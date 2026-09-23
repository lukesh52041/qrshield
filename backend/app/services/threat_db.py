"""Threat Database and Reputation Matching Service."""

import re
from typing import Optional, Dict, Any
from app.core.config import DOMAIN_WHITELIST

# Curated repository of known malicious domain patterns, synthetic hackathon samples, and phishing feeds
KNOWN_MALICIOUS_PATTERNS = [
    # Typosquat / Lookalike Phishing
    r".*sbi-netbanking.*\.xyz.*",
    r".*sbi-kyc-verify.*",
    r".*hdfc-secure-login.*",
    r".*icici-update-pan.*",
    r".*paytm-kyc-bonus.*",
    r".*gpay-reward-claim.*",
    r".*phonepe-cashback-desk.*",
    r".*electricity-bill-unfreeze.*",
    r".*lottery-winner-202[0-9].*",
    # Suspicious APK downloads
    r".*\.apk$",
    r".*download-anydesk-support.*",
    r".*quicksupport-bank-agent.*",
]

# Fast set of known high-risk test/demo phishing domains
KNOWN_MALICIOUS_DOMAINS = {
    "sbi-netbanking-verify.xyz",
    "sbi-kyc-update.buzz",
    "hdfc-rewards-portal.top",
    "icici-pan-link.work",
    "paytm-cashback-claim.xyz",
    "phonepe-refund-desk.club",
    "free-recharge-offer.online",
    "electricity-bill-overdue.top",
    "secure-banking-verification.xyz",
    "instant-loan-approval-apk.net",
    "pаypal.com", # Punycode homoglyph variant
}

def is_whitelisted(domain: str) -> bool:
    """Check if domain or parent domain is on the trusted whitelist."""
    domain = domain.lower().strip()
    if domain in DOMAIN_WHITELIST:
        return True
    
    # Check if ends with any whitelisted root (e.g., netbanking.hdfcbank.com matches hdfcbank.com)
    for white in DOMAIN_WHITELIST:
        if domain.endswith("." + white):
            return True
    return False

def check_known_threats(url: str, domain: str) -> Optional[Dict[str, Any]]:
    """Deterministic lookup against known signatures."""
    url_lower = url.lower()
    domain_lower = domain.lower().strip()
    
    if is_whitelisted(domain_lower):
        return None
        
    if domain_lower in KNOWN_MALICIOUS_DOMAINS:
        return {
            "source": "QRShield Known Threats Feed",
            "type": "Confirmed Phishing / Malicious Domain",
            "confidence": 0.99,
            "severity": "CRITICAL"
        }
        
    for pattern in KNOWN_MALICIOUS_PATTERNS:
        if re.match(pattern, url_lower):
            return {
                "source": "Signature Pattern Engine",
                "type": "Matches Known Attack Pattern",
                "pattern": pattern,
                "confidence": 0.95,
                "severity": "HIGH"
            }
            
    return None
