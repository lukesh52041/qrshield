"""Classifier and Explainability Engine for QRShield.

Synthesizes heuristic scores, threat intelligence, redirect history,
and UPI parameters to produce normalized risk scores and plain-language verdicts.
"""

from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

from app.core.config import (
    SCORE_SAFE_MAX,
    SCORE_SUSPICIOUS_MAX,
)
from app.services.threat_db import check_known_threats, is_whitelisted
from app.services.feature_extractor import extract_url_features
from app.services.upi_analyzer import parse_upi_uri, analyze_upi_intent
from app.services.redirect_tracer import trace_redirect_chain


async def classify_target(input_str: str) -> Dict[str, Any]:
    """
    Main analysis pipeline for any QR payload or payment link (Web URL or UPI).
    Executes deep inspection, sandbox unshortening, feature scoring, and explainability generation.
    """
    input_clean = input_str.strip()
    is_upi = input_clean.lower().startswith("upi://")

    # If it's a UPI protocol intent
    if is_upi:
        return classify_upi(input_clean)

    # Otherwise treat as Web URL (or un-prefixed domain)
    if not input_clean.startswith(("http://", "https://")):
        input_clean = "https://" + input_clean

    return await classify_url(input_clean)


def classify_upi(upi_uri: str) -> Dict[str, Any]:
    """Classify UPI payment link with deep intent checks."""
    parsed_upi = parse_upi_uri(upi_uri)
    if not parsed_upi:
        return {
            "verdict": "CAUTION_UNVERIFIED",
            "risk_score": 50,
            "confidence": 0.5,
            "category": "UPI",
            "summary": "Malformed or invalid UPI protocol string.",
            "reasons": ["The provided payload could not be parsed as a standard UPI intent."],
            "recommendations": ["Do not attempt to open this payment link in any UPI app."],
            "details": {"raw": upi_uri}
        }

    analysis = analyze_upi_intent(parsed_upi)
    score = analysis["risk_score"]
    threat_flags = analysis["threat_flags"]
    explanations = analysis["explanations"]

    # Determine Verdict
    if score <= SCORE_SAFE_MAX:
        verdict = "SAFE"
        summary = (
            f"Verified legitimate UPI payment intent for {parsed_upi['payee_name'] or 'Merchant'} "
            f"({parsed_upi['vpa']}). Standard payment parameters verified."
        )
        recommendations = [
            "Safe to proceed. Confirm the merchant name and amount in your UPI app before completing payment.",
            "Remember: UPI PIN is ONLY required when money is leaving your account."
        ]
    elif score <= SCORE_SUSPICIOUS_MAX:
        verdict = "SUSPICIOUS"
        summary = (
            f"Potential payment risk detected: The UPI address '{parsed_upi['vpa']}' exhibits "
            "irregular attributes or unverified merchant indicators."
        )
        recommendations = [
            "Proceed with extreme caution.",
            "Verify if you know the recipient personally before authorizing payment.",
            "NEVER enter your UPI PIN if you were expecting to receive a cashback or refund."
        ]
    else:
        verdict = "MALICIOUS"
        summary = (
            f"High-Risk UPI Scam Alert: Intent contains deceptive fraud signals designed to debit "
            f"your account under the guise of an official refund or brand support."
        )
        recommendations = [
            "DO NOT AUTHORIZE THIS TRANSACTION.",
            "DO NOT enter your UPI PIN. Entering your PIN will instantly DEBIT your bank account.",
            "Report this VPA handle to your bank and the National Cyber Crime Portal (cybercrime.gov.in)."
        ]

    confidence = 0.92 if threat_flags else 0.85

    return {
        "verdict": verdict,
        "risk_score": score,
        "confidence": confidence,
        "category": "UPI_PAYMENT",
        "input": upi_uri,
        "summary": summary,
        "reasons": explanations if explanations else ["Standard peer-to-peer or merchant UPI intent."],
        "recommendations": recommendations,
        "upi_details": analysis,
        "features": {
            "threat_flags": threat_flags,
            "is_collect": analysis["is_collect_request"],
            "vpa": analysis["vpa"],
            "registered_merchant": analysis["is_registered_merchant"]
        },
        "redirect_chain": None
    }


async def classify_url(url_str: str) -> Dict[str, Any]:
    """Classify Web URL using sandbox unshortener, static features, and threat signatures."""
    # 1. First extract features of initial input URL
    initial_features = extract_url_features(url_str)
    initial_host = initial_features.get("hostname", "")

    # 2. Check Whitelist on initial host
    if is_whitelisted(initial_host):
        return {
            "verdict": "SAFE",
            "risk_score": 0,
            "confidence": 0.99,
            "category": "WEB_URL",
            "input": url_str,
            "summary": f"'{initial_host}' is an officially verified, trusted domain.",
            "reasons": ["Domain matches verified legitimate banking, tech, or institutional whitelist."],
            "recommendations": ["Safe to proceed. Ensure your browser displays the valid SSL padlock."],
            "features": initial_features,
            "redirect_chain": {
                "start_url": url_str,
                "final_url": url_str,
                "final_domain": initial_host,
                "total_hops": 1,
                "hops": [{
                    "hop": 1,
                    "url": url_str,
                    "domain": initial_host,
                    "status_code": 200,
                    "latency_ms": 1.0,
                    "note": "Verified trusted domain"
                }]
            }
        }

    # 3. Sandbox Redirect Tracer (Unshorten bitly/tinyurl and discover landing destination)
    tracer_res = await trace_redirect_chain(url_str)
    final_url = tracer_res["final_url"]
    final_host = tracer_res["final_domain"] or initial_host

    # Extract features for final destination URL
    final_features = extract_url_features(final_url)

    reasons: List[str] = []
    risk_score = 0

    # 4. Check Known Malicious Signatures
    known_hit = check_known_threats(final_url, final_host) or check_known_threats(url_str, initial_host)
    if known_hit:
        risk_score += 85
        reasons.append(f"Confirmed Threat Signature: {known_hit['type']} ({known_hit['source']}).")

    # 5. Typosquatting / Brand Impersonation
    typo_info = final_features.get("typosquatting", {})
    if typo_info.get("is_typosquat"):
        risk_score += 55
        reasons.extend(typo_info.get("reasons", []))

    # 6. Homoglyph / Punycode (Check both initial and final domains)
    homoglyph_info = final_features.get("homoglyph", {})
    init_homoglyph = initial_features.get("homoglyph", {})
    if homoglyph_info.get("has_homoglyphs") or init_homoglyph.get("has_homoglyphs"):
        risk_score += 55
        details = homoglyph_info.get("details") or init_homoglyph.get("details", "Homoglyph / deceptive unicode spoofing detected.")
        reasons.append(details)

    # 7. Suspicious / Abused TLD
    tld_info = final_features.get("tld", {})
    if tld_info.get("is_suspicious"):
        risk_score += 25
        reasons.append(f"High-Risk TLD: Domain uses '.{tld_info['name']}', a top-level domain frequently associated with disposable phishing campaigns.")

    # 8. High Shannon Entropy (Randomized domain / DGA)
    entropy_info = final_features.get("entropy", {})
    if entropy_info.get("is_high_entropy"):
        risk_score += 20
        reasons.append(f"High Domain Entropy ({entropy_info['domain_entropy']}): String pattern exhibits statistical randomness common in evasion links.")

    # 9. Raw IP Address Hostname
    if final_features.get("ip_host"):
        risk_score += 35
        reasons.append("Raw IP Address Host: Target uses a direct IP instead of a registered domain, bypassing DNS safety reputations.")

    # 10. Scam / Phishing Keywords in Path or Query
    scam_kws = list(set(final_features.get("scam_keywords", []) + initial_features.get("scam_keywords", [])))
    if scam_kws:
        kw_penalty = min(35, len(scam_kws) * 15)
        risk_score += kw_penalty
        reasons.append(f"Social Engineering Keywords: URL contains sensitive triggers: {', '.join(scam_kws)}.")

    # 11. Multi-hop Redirection / Camouflage
    if tracer_res.get("is_shortened"):
        if not is_whitelisted(final_host):
            risk_score += 35
            reasons.append(
                f"Obfuscated Shortened Link ({initial_host}): URL shorteners conceal true destination. Unmasked destination is '{final_host}'."
            )
    elif tracer_res.get("has_cross_domain_hop") and tracer_res.get("total_hops", 1) > 1:
        if not is_whitelisted(final_host):
            risk_score += 20
            reasons.append(
                f"Cross-Domain Redirection: Redirected from '{initial_host}' to unexpected destination '{final_host}'."
            )

    # 12. Non-HTTPS Connection
    if not final_features.get("https", True):
        risk_score += 15
        reasons.append("Insecure Protocol: Link uses unencrypted HTTP instead of secure HTTPS.")

    # Handle Unreachable / Timeout with Fail-Safe Uncertainty
    if tracer_res.get("is_unreachable"):
        if risk_score >= SCORE_SUSPICIOUS_MAX:
            # If strong phishing markers existed even though server is down
            reasons.append(f"Network probe note: Destination is unreachable ({tracer_res.get('error_reason')}).")
        else:
            # Ambiguous or offline host without clear malware indicators
            return {
                "verdict": "CAUTION_UNVERIFIED",
                "risk_score": 50,
                "confidence": 0.45,
                "category": "WEB_URL",
                "input": url_str,
                "summary": "Caution: Destination host could not be reached or timed out during inspection.",
                "reasons": [
                    f"Host status: {tracer_res.get('error_reason', 'Connection unreachable')}.",
                    "The link cannot be verified as safe because the destination server did not return a valid response."
                ],
                "recommendations": [
                    "Do not proceed until you can confirm the legitimacy of this link through an independent channel.",
                    "Attackers often disable servers after a campaign or host temporary landing pages."
                ],
                "features": final_features,
                "redirect_chain": tracer_res
            }

    normalized_score = min(100, max(0, risk_score))

    # Determine Verdict
    if normalized_score <= SCORE_SAFE_MAX:
        verdict = "SAFE"
        summary = f"No deceptive patterns or phishing indicators found on '{final_host}'."
        recommendations = [
            "Safe to browse. Always verify the domain name matches your intended destination before logging in."
        ]
    elif normalized_score <= SCORE_SUSPICIOUS_MAX:
        verdict = "SUSPICIOUS"
        summary = f"Caution recommended: '{final_host}' exhibits anomalous attributes or redirection patterns."
        recommendations = [
            "Proceed with vigilance. Do not enter passwords, credit card numbers, or personal credentials.",
            "Check the full URL in your browser bar before taking any actions."
        ]
    else:
        verdict = "MALICIOUS"
        summary = f"High-Risk Cyber Threat Alert: Phishing or deceptive impersonation detected targeting '{final_host}'."
        recommendations = [
            "DO NOT OPEN OR ENTER CREDENTIALS ON THIS SITE.",
            "This link appears to be an active phishing or credential-harvesting trap.",
            "Close the browser tab immediately and warn anyone who shared it."
        ]

    confidence = 0.95 if (known_hit or typo_info.get("is_typosquat")) else 0.80

    return {
        "verdict": verdict,
        "risk_score": normalized_score,
        "confidence": confidence,
        "category": "WEB_URL",
        "input": url_str,
        "summary": summary,
        "reasons": reasons if reasons else ["Clean domain reputation with standard web parameters."],
        "recommendations": recommendations,
        "features": final_features,
        "redirect_chain": tracer_res
    }
