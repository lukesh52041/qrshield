"""FastAPI route definitions for QRShield threat analyzer."""

import time
from typing import Dict, Any, List
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel, Field

from app.services.qr_decoder import decode_qr_image
from app.services.classifier import classify_target

router = APIRouter()


class URLAnalysisRequest(BaseModel):
    url: str = Field(..., description="Web URL or UPI payment intent URI (e.g. upi://pay?...)")


class AnalysisResponse(BaseModel):
    success: bool
    verdict: str
    risk_score: int
    confidence: float
    category: str
    input: str
    summary: str
    reasons: List[str]
    recommendations: List[str]
    latency_ms: float
    features: Optional[Dict[str, Any]] = None
    upi_details: Optional[Dict[str, Any]] = None
    redirect_chain: Optional[Dict[str, Any]] = None
    qr_metadata: Optional[Dict[str, Any]] = None


# Pitch Demo Presets for Hackathon Judges
DEMO_PRESETS = [
    {
        "id": "preset_safe_merchant",
        "title": "Verified Merchant QR",
        "type": "UPI",
        "expected_verdict": "SAFE",
        "badge": "Safe Merchant",
        "description": "Starbucks in-store counter QR with verified ICICI merchant code (MC: 5499).",
        "payload": "upi://pay?pa=starbucks@icici&pn=Starbucks+Coffee&am=240.00&cu=INR&mc=5499&tr=TXN948172"
    },
    {
        "id": "preset_upi_refund_scam",
        "title": "GPay Refund / Collect Trap",
        "type": "UPI",
        "expected_verdict": "MALICIOUS",
        "badge": "Debit Scam",
        "description": "Scammer sending a DEBIT collect request masquerading as a '₹4,999 Cashback Refund'.",
        "payload": "upi://pay?pa=refund-desk9021@ybl&pn=GPay+Cashback+Refund&am=4999.00&mode=02&tn=Claim+Cashback+Refund"
    },
    {
        "id": "preset_sbi_phishing",
        "title": "SBI KYC Phishing Portal",
        "type": "URL",
        "expected_verdict": "MALICIOUS",
        "badge": "Phishing",
        "description": "Fake banking login targeting State Bank of India with brand token injection on .xyz TLD.",
        "payload": "https://sbi-netbanking-verify.xyz/login.php"
    },
    {
        "id": "preset_homoglyph_attack",
        "title": "Punycode / Homoglyph Impersonation",
        "type": "URL",
        "expected_verdict": "MALICIOUS",
        "badge": "Homoglyph",
        "description": "Cyrillic character 'а' (U+0430) disguised inside 'paypal.com' to deceive visual inspection.",
        "payload": "https://pаypal.com/signin?claim_reward=true"
    },
    {
        "id": "preset_shortener_redirect",
        "title": "Multi-Hop Camouflaged Shortener",
        "type": "URL",
        "expected_verdict": "SUSPICIOUS",
        "badge": "Redirect Chain",
        "description": "Shortened link redirecting through intermediate tracking hops into an unverified portal.",
        "payload": "https://tinyurl.com/qrshield-test-redirect"
    },
    {
        "id": "preset_offline_uncertainty",
        "title": "Unreachable / Disposable Host",
        "type": "URL",
        "expected_verdict": "CAUTION_UNVERIFIED",
        "badge": "Uncertainty",
        "description": "Inactive or dead server test demonstrating fail-safe uncertainty handling without false certainty.",
        "payload": "https://expired-fraud-domain-404-test.buzz/claim"
    }
]


@router.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "QRShield API",
        "version": "1.0.0",
        "hackathon": "Presidency University x ISACA Bangalore Chapter (Darkbyte)"
    }


@router.get("/presets")
def get_presets():
    return {"presets": DEMO_PRESETS}


@router.post("/analyze/url")
async def analyze_url(req: URLAnalysisRequest):
    t0 = time.perf_counter()
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="Empty URL or payment payload.")

    result = await classify_target(req.url)
    latency_ms = round((time.perf_counter() - t0) * 1000, 1)

    result["success"] = True
    result["latency_ms"] = latency_ms
    return result


@router.post("/analyze/qr")
async def analyze_qr(file: UploadFile = File(...)):
    t0 = time.perf_counter()
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file received.")

    decode_res = decode_qr_image(image_bytes)
    if not decode_res["success"] or not decode_res["data"]:
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        return {
            "success": False,
            "verdict": "ERROR",
            "risk_score": 0,
            "confidence": 0.0,
            "category": "QR_IMAGE",
            "input": file.filename,
            "summary": "QR Code could not be decoded from the uploaded image.",
            "reasons": [decode_res.get("error", "No valid QR code pattern detected.")],
            "recommendations": [
                "Ensure the QR code is clearly visible, well-lit, and not overly cropped.",
                "Try scanning with a higher resolution image or via the live camera."
            ],
            "latency_ms": latency_ms,
            "qr_metadata": decode_res
        }

    decoded_payload = decode_res["data"]
    result = await classify_target(decoded_payload)
    latency_ms = round((time.perf_counter() - t0) * 1000, 1)

    result["success"] = True
    result["latency_ms"] = latency_ms
    result["qr_metadata"] = {
        "decoded_content": decoded_payload,
        "decode_engine": decode_res["method"],
        "filename": file.filename
    }
    return result
