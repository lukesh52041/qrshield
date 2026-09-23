"""Configuration constants, risk thresholds, and threat watchlists for QRShield."""

from typing import List, Dict, Set

# Timeout & Sandbox Limits
HTTP_TIMEOUT_SECONDS: float = 1.2
MAX_REDIRECT_HOPS: int = 8
MAX_IMAGE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB

# Verdict Score Thresholds (0 - 100)
SCORE_SAFE_MAX: int = 24
SCORE_SUSPICIOUS_MAX: int = 65
# >= 66 is Malicious

# High-Risk / Abused TLDs (frequently used in phishing/throwaway campaigns)
SUSPICIOUS_TLDS: Set[str] = {
    "xyz", "top", "buzz", "click", "fit", "support", "work", "gq", "cf", "tk",
    "ml", "ga", "rest", "cam", "live", "loan", "stream", "win", "bid", "racing",
    "surf", "party", "space", "icu", "site", "online", "monster", "hair", "beauty",
    "quest", "cyou", "shop", "uno", "vip", "link", "club"
}

# Free / Disposable URL Shorteners (legitimate in normal use, but trigger redirect unshortening)
KNOWN_SHORTENERS: Set[str] = {
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "buff.ly", "ow.ly", "goo.gl",
    "cutt.ly", "rb.gy", "rebrand.ly", "shorturl.at", "rotf.lol", "v.gd", "qr.ae"
}

# Scam / Phishing Trigger Keywords in domains, paths, query strings
SCAM_KEYWORDS: List[str] = [
    "kyc", "kyc-update", "refund", "cashback", "lottery", "bonus", "verify",
    "verification", "account-blocked", "unfreeze", "claim-reward", "claim",
    "pan-link", "aadhaar-update", "electricity-bill", "power-bill", "free-cash",
    "lucky-draw", "gift-card", "urgent-action", "winner", "scratch-card",
    "secure-login", "netbanking-login", "security-alert", "apk-download",
    "install-app", "remote-support", "anydesk", "teamviewer", "quicksupport"
]

# Deceptive keywords in UPI VPA usernames (e.g., refund-desk@ybl or sbi-support@axis)
SUSPICIOUS_UPI_KEYWORDS: List[str] = [
    "refund", "cashback", "reward", "support", "helpline", "helpdesk", "care",
    "customer-care", "nodal", "officer", "kyc", "verification", "bonus", "winner",
    "claim", "department", "desk", "settlement", "dispute", "tollfree"
]

# High-profile Banking & FinTech Brand Watchlist (Name, Primary Genuine Domains)
BRAND_WATCHLIST: Dict[str, Dict[str, any]] = {
    "sbi": {
        "name": "State Bank of India",
        "domains": ["sbi.co.in", "onlinesbi.sbi", "onlinesbi.com", "bank.sbi"],
        "tokens": ["sbi", "onlinesbi", "statebank"],
    },
    "hdfc": {
        "name": "HDFC Bank",
        "domains": ["hdfcbank.com", "hdfc.com", "netbanking.hdfcbank.com"],
        "tokens": ["hdfc", "hdfcbank"],
    },
    "icici": {
        "name": "ICICI Bank",
        "domains": ["icicibank.com", "icici.com"],
        "tokens": ["icici", "icicibank"],
    },
    "axis": {
        "name": "Axis Bank",
        "domains": ["axisbank.com", "axisb.in"],
        "tokens": ["axis", "axisbank"],
    },
    "paytm": {
        "name": "Paytm",
        "domains": ["paytm.com", "paytmbank.com"],
        "tokens": ["paytm", "paytmpayments"],
    },
    "phonepe": {
        "name": "PhonePe",
        "domains": ["phonepe.com"],
        "tokens": ["phonepe", "ybl"],
    },
    "googlepay": {
        "name": "Google Pay",
        "domains": ["pay.google.com", "g.co", "google.com"],
        "tokens": ["googlepay", "gpay"],
    },
    "razorpay": {
        "name": "Razorpay",
        "domains": ["razorpay.com", "rzp.io"],
        "tokens": ["razorpay", "rzp"],
    },
    "kotak": {
        "name": "Kotak Mahindra Bank",
        "domains": ["kotak.com"],
        "tokens": ["kotak", "kotakbank"],
    },
    "pnb": {
        "name": "Punjab National Bank",
        "domains": ["pnbindia.in", "pnb.bank.in"],
        "tokens": ["pnb", "pnbindia"],
    },
    "amazon": {
        "name": "Amazon Pay",
        "domains": ["amazon.in", "amazon.com", "amzn.to", "amzn.in"],
        "tokens": ["amazon", "amazonpay"],
    },
    "bhim": {
        "name": "BHIM UPI (NPCI)",
        "domains": ["bhimupi.org.in", "npci.org.in"],
        "tokens": ["bhim", "npci"],
    },
    "cred": {
        "name": "CRED",
        "domains": ["cred.club"],
        "tokens": ["cred"],
    },
    "zerodha": {
        "name": "Zerodha",
        "domains": ["zerodha.com", "kite.zerodha.com"],
        "tokens": ["zerodha", "kite"],
    },
    "paypal": {
        "name": "PayPal",
        "domains": ["paypal.com", "paypal.me"],
        "tokens": ["paypal"],
    }
}

# Valid NPCI Bank UPI Handles (subset of official PSP handles)
LEGITIMATE_UPI_HANDLES: Set[str] = {
    "okaxis", "oksbi", "okhdfcbank", "okicici", "ybl", "ibl", "axl", "paytm",
    "apl", "upi", "barodampay", "fbl", "idfcbank", "citi", "kotak", "pnb",
    "indus", "aubank", "federal", "rbl", "airtel", "postbank", "jupiteraxis",
    "freecharge", "yesbank", "centralbank"
}

# Whitelist of globally recognized, safe root domains (prevents false positives)
DOMAIN_WHITELIST: Set[str] = {
    "google.com", "google.co.in", "youtube.com", "github.com", "microsoft.com",
    "apple.com", "wikipedia.org", "cloudflare.com", "amazon.in", "amazon.com",
    "sbi.co.in", "onlinesbi.sbi", "hdfcbank.com", "icicibank.com", "axisbank.com",
    "kotak.com", "paytm.com", "phonepe.com", "razorpay.com", "npci.org.in",
    "bhimupi.org.in", "incometax.gov.in", "uidai.gov.in", "isaca.org"
}
