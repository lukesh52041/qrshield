"""Deep inspection engine for UPI payment protocols (upi://pay and upi://collect)."""

from urllib.parse import urlparse, parse_qs, unquote
from typing import Dict, Any, List, Optional
from app.core.config import (
    SUSPICIOUS_UPI_KEYWORDS,
    LEGITIMATE_UPI_HANDLES,
    BRAND_WATCHLIST,
)


def parse_upi_uri(uri_str: str) -> Optional[Dict[str, Any]]:
    """Parse upi://pay or upi://collect URI into structured parameters."""
    if not uri_str.lower().startswith("upi://"):
        return None

    # Handle upi://pay?... or upi://collect?...
    scheme_action = uri_str.split("://", 1)[1].split("?", 1)[0].lower()
    query_str = uri_str.split("?", 1)[1] if "?" in uri_str else ""
    
    parsed_query = parse_qs(query_str, keep_blank_values=True)
    params = {k: unquote(v[0]) if v else "" for k, v in parsed_query.items()}

    return {
        "raw_uri": uri_str,
        "action": scheme_action, # 'pay' or 'collect'
        "vpa": params.get("pa", "").strip(),
        "payee_name": params.get("pn", "").strip(),
        "merchant_code": params.get("mc", "").strip(),
        "amount": params.get("am", "").strip(),
        "currency": params.get("cu", "INR").strip(),
        "transaction_note": params.get("tn", "").strip(),
        "transaction_ref": params.get("tr", "").strip(),
        "url": params.get("url", "").strip(),
        "mode": params.get("mode", "").strip(),
        "org_id": params.get("orgid", "").strip(),
        "raw_params": params
    }


def analyze_upi_intent(upi_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform heuristic and behavioral risk analysis on a UPI payload.
    Flags collect traps, handle impersonation, deceptive payee names, and missing merchant credentials.
    """
    action = upi_data.get("action", "pay")
    vpa = upi_data.get("vpa", "")
    payee_name = upi_data.get("payee_name", "")
    mc = upi_data.get("merchant_code", "")
    amount = upi_data.get("amount", "")
    currency = upi_data.get("currency", "INR")
    note = upi_data.get("transaction_note", "")
    mode = upi_data.get("mode", "")

    threat_flags: List[str] = []
    risk_score = 0
    explanations: List[str] = []

    # 1. Inspect Action: upi://collect or mode=02 (Collect Mandate)
    is_collect_request = (action == "collect") or (mode in ["02", "15"])
    if is_collect_request:
        threat_flags.append("UPI_COLLECT_INTENT")
        risk_score += 40
        explanations.append(
            "CRITICAL: This is a DEBIT request (Collect). Approving this will DEDUCT money from your account, "
            "not credit or refund you."
        )

    # 2. VPA Structure and Handle Analysis
    vpa_username = ""
    vpa_handle = ""
    if "@" in vpa:
        parts = vpa.split("@", 1)
        vpa_username = parts[0].lower()
        vpa_handle = parts[1].lower()
    else:
        threat_flags.append("MALFORMED_VPA")
        risk_score += 30
        explanations.append(f"Invalid UPI address format: '{vpa}' lacks a standard '@bank' handle.")

    # 3. Check for Suspicious/Deceptive Keywords in VPA Username
    detected_vpa_keywords = [
        kw for kw in SUSPICIOUS_UPI_KEYWORDS if kw in vpa_username
    ]
    if detected_vpa_keywords:
        threat_flags.append("DECEPTIVE_VPA_KEYWORDS")
        risk_score += 35
        explanations.append(
            f"VPA username contains deceptive scam terms: {', '.join(detected_vpa_keywords)}. "
            "Scammers frequently use keywords like 'refund' or 'support' to impersonate official helplines."
        )

    # 4. Brand Impersonation in Payee Name or VPA
    combined_name_vpa = f"{payee_name} {vpa_username}".lower()
    for brand_key, brand_info in BRAND_WATCHLIST.items():
        for token in brand_info["tokens"]:
            if token in combined_name_vpa:
                # Brand is claimed. Does it have an official merchant code (mc)?
                if not mc:
                    threat_flags.append("UNVERIFIED_BRAND_IMPERSONATION")
                    risk_score += 40
                    explanations.append(
                        f"Claims affiliation with '{brand_info['name']}' in name or VPA, "
                        "but lacks an official NPCI registered Merchant Category Code (mc). This is an individual P2P account."
                    )
                    break
        if "UNVERIFIED_BRAND_IMPERSONATION" in threat_flags:
            break

    # 5. Cashback / Refund Trap in Payee Name or Transaction Note
    combined_notes = f"{payee_name} {note}".lower()
    cashback_scam_words = ["cashback", "refund", "prize", "reward", "lottery", "bonus", "claim"]
    matched_cashback = [w for w in cashback_scam_words if w in combined_notes]
    if matched_cashback and (amount or is_collect_request):
        threat_flags.append("CASHBACK_REFUND_TRAP")
        risk_score += 35
        explanations.append(
            f"Payee name or note advertises '{matched_cashback[0]}', but UPI requires your PIN ONLY to PAY, "
            "never to receive money or refunds!"
        )

    # 6. Currency check
    if currency and currency.upper() != "INR":
        threat_flags.append("NON_INR_CURRENCY")
        risk_score += 25
        explanations.append(f"Unusual currency code: '{currency}' (Standard Indian UPI uses INR).")

    # 7. Pre-filled high amount with suspicious parameters
    amount_val = 0.0
    if amount:
        try:
            amount_val = float(amount)
            if amount_val > 10000 and ("DECEPTIVE_VPA_KEYWORDS" in threat_flags or "CASHBACK_REFUND_TRAP" in threat_flags):
                threat_flags.append("HIGH_VALUE_SCAM_TARGET")
                risk_score += 15
                explanations.append(f"Auto-filled with a high payment amount of ₹{amount_val:,.2f}.")
        except ValueError:
            pass

    # Safe check if legitimate verified merchant
    is_safe_merchant = False
    if mc and not detected_vpa_keywords and not is_collect_request and not matched_cashback:
        is_safe_merchant = True
        risk_score = max(0, risk_score - 20)

    # Normalize risk score 0 - 100
    normalized_score = min(100, max(0, risk_score))

    return {
        "is_upi": True,
        "action_type": action.upper(),
        "is_collect_request": is_collect_request,
        "vpa": vpa,
        "vpa_username": vpa_username,
        "vpa_handle": vpa_handle,
        "payee_name": payee_name,
        "amount": amount_val if amount else None,
        "currency": currency,
        "merchant_code": mc,
        "is_registered_merchant": bool(mc),
        "is_safe_merchant": is_safe_merchant,
        "threat_flags": threat_flags,
        "risk_score": normalized_score,
        "explanations": explanations
    }
