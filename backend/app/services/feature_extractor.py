"""Feature extraction service: Shannon entropy, typosquatting, homoglyphs, and NLP token analysis."""

import math
import re
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any, List, Tuple
from app.core.config import (
    BRAND_WATCHLIST,
    SUSPICIOUS_TLDS,
    SCAM_KEYWORDS,
    DOMAIN_WHITELIST,
)
from app.services.threat_db import is_whitelisted


def calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string."""
    if not text:
        return 0.0
    prob = [float(text.count(c)) / len(text) for c in dict.fromkeys(list(text))]
    entropy = -sum([p * math.log2(p) for p in prob])
    return round(entropy, 3)


def levenshtein_distance(s1: str, s2: str) -> int:
    """Compute the Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def detect_homoglyphs(domain: str) -> Dict[str, Any]:
    """Detect Punycode (xn--) or Cyrillic/Greek homoglyphs masquerading as Latin characters."""
    domain_lower = domain.lower()
    
    # Check for Punycode prefix
    if "xn--" in domain_lower:
        try:
            decoded = domain_lower.encode("ascii").decode("idna")
            return {
                "has_homoglyphs": True,
                "is_punycode": True,
                "decoded": decoded,
                "details": f"Punycode encoded domain disguising actual text as '{decoded}'"
            }
        except Exception:
            return {
                "has_homoglyphs": True,
                "is_punycode": True,
                "decoded": None,
                "details": "Malformed or deceptive Punycode IDN domain detected"
            }

    # Check for non-ASCII characters directly in unicode string
    cyrillic_or_greek = False
    suspicious_chars = []
    for char in domain:
        code = ord(char)
        # Cyrillic range: 0x0400 - 0x04FF
        # Greek range: 0x0370 - 0x03FF
        if (0x0400 <= code <= 0x04FF) or (0x0370 <= code <= 0x03FF):
            cyrillic_or_greek = True
            suspicious_chars.append(f"{char} (U+{code:04X})")

    if cyrillic_or_greek:
        return {
            "has_homoglyphs": True,
            "is_punycode": False,
            "suspicious_chars": suspicious_chars,
            "details": f"Non-Latin lookalike characters detected: {', '.join(suspicious_chars[:3])}"
        }

    return {"has_homoglyphs": False, "is_punycode": False}


def check_ip_address_host(hostname: str) -> bool:
    """Check if the hostname is a raw IPv4 or IPv6 address."""
    # IPv4 regex
    ipv4_pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
    if re.match(ipv4_pattern, hostname):
        return True
    # IPv6 check
    if ":" in hostname and not re.search(r"[a-zA-Z]", hostname.replace(":", "")):
        return True
    return False


def extract_typosquatting_signals(domain: str) -> Dict[str, Any]:
    """
    Check if a domain impersonates a targeted banking/fintech brand
    using brand token injection or close edit distance.
    """
    domain_clean = domain.lower().strip()
    if is_whitelisted(domain_clean):
        return {"is_typosquat": False, "target_brand": None, "reasons": []}

    reasons = []
    matched_brand = None
    min_dist = 999

    # Split domain into base labels (excluding root TLD)
    parts = domain_clean.split(".")
    domain_body = parts[0] if len(parts) > 1 else domain_clean
    tld = parts[-1] if len(parts) > 1 else ""

    # Check against each watched brand
    for brand_key, brand_info in BRAND_WATCHLIST.items():
        legit_domains = brand_info["domains"]
        
        # If it's literally a legitimate domain of this brand, skip
        if any(domain_clean == ld or domain_clean.endswith("." + ld) for ld in legit_domains):
            continue

        # 1. Brand name in domain body with extra words (e.g., sbi-netbanking, hdfc-verify, paytm-cashback)
        for token in brand_info["tokens"]:
            if token in domain_body:
                # If the domain contains the brand token but is NOT the brand's verified domain
                matched_brand = brand_info["name"]
                reasons.append(
                    f"Domain body '{domain_body}' contains brand token '{token}' ({brand_info['name']}) "
                    f"on an unauthorized domain."
                )
                return {
                    "is_typosquat": True,
                    "target_brand": matched_brand,
                    "reasons": reasons,
                    "risk_level": "CRITICAL"
                }

        # 2. Edit distance (Levenshtein) comparison against genuine domain bases
        for legit_domain in legit_domains:
            legit_body = legit_domain.split(".")[0]
            dist = levenshtein_distance(domain_body, legit_body)
            if dist < min_dist:
                min_dist = dist

            # Distance of 1 or 2 for bodies >= 4 chars indicates lookalike (e.g., paytmm, hdfccbank)
            if dist in [1, 2] and len(legit_body) >= 4 and len(domain_body) >= 4:
                matched_brand = brand_info["name"]
                reasons.append(
                    f"Domain label '{domain_body}' is suspiciously similar to official '{legit_body}' "
                    f"(Levenshtein distance: {dist})."
                )
                return {
                    "is_typosquat": True,
                    "target_brand": matched_brand,
                    "reasons": reasons,
                    "distance": dist,
                    "risk_level": "HIGH"
                }

    return {"is_typosquat": False, "target_brand": None, "reasons": []}


def extract_url_features(url_str: str) -> Dict[str, Any]:
    """Extract full spectrum of static, lexical, and structural features from a URL."""
    try:
        parsed = urlparse(url_str)
    except Exception:
        return {"error": "Invalid URL structure"}

    hostname = parsed.hostname or ""
    path = parsed.path or ""
    query = parsed.query or ""
    port = parsed.port

    # Whitelist check
    whitelisted = is_whitelisted(hostname)

    # 1. Shannon Entropy
    domain_entropy = calculate_entropy(hostname)
    path_entropy = calculate_entropy(path)
    is_high_entropy = domain_entropy > 3.85

    # 2. TLD Check
    parts = hostname.split(".")
    tld = parts[-1].lower() if len(parts) > 1 else ""
    is_suspicious_tld = tld in SUSPICIOUS_TLDS

    # 3. Homoglyph / Punycode
    homoglyph_res = detect_homoglyphs(hostname)

    # 4. IP address host
    is_ip = check_ip_address_host(hostname)

    # 5. Non-standard port
    is_unusual_port = port not in [None, 80, 443]

    # 6. Typosquatting
    typosquat_res = extract_typosquatting_signals(hostname)

    # 7. Scam Keywords in Path and Query
    full_search_text = f"{hostname} {path} {query}".lower()
    detected_keywords = [kw for kw in SCAM_KEYWORDS if kw in full_search_text]

    # 8. Subdomain Depth
    subdomain_count = max(0, len(parts) - 2) if len(parts) > 2 else 0

    return {
        "url": url_str,
        "hostname": hostname,
        "path": path,
        "query": query,
        "is_whitelisted": whitelisted,
        "entropy": {
            "domain_entropy": domain_entropy,
            "path_entropy": path_entropy,
            "is_high_entropy": is_high_entropy
        },
        "tld": {
            "name": tld,
            "is_suspicious": is_suspicious_tld
        },
        "homoglyph": homoglyph_res,
        "ip_host": is_ip,
        "unusual_port": {
            "has_unusual_port": is_unusual_port,
            "port": port
        },
        "typosquatting": typosquat_res,
        "scam_keywords": detected_keywords,
        "subdomain_depth": subdomain_count,
        "https": parsed.scheme.lower() == "https"
    }
