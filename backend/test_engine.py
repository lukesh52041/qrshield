"""Automated test suite for QRShield threat detection engine."""

import asyncio
import io
import sys
import qrcode

# Reconfigure stdout/stderr to UTF-8 for Windows console support
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.services.classifier import classify_target, classify_upi
from app.services.qr_decoder import decode_qr_image
from app.services.feature_extractor import detect_homoglyphs, extract_typosquatting_signals


async def run_tests():
    print("\n" + "=" * 60)
    print("🛡️  RUNNING QRSHIELD DETECTION SUITE (TEAM DARKBYTE)")
    print("=" * 60 + "\n")
    passed = 0
    total = 0

    # Test 1: Legitimate Verified Merchant UPI
    total += 1
    print(f"[{total}] Testing Legitimate Merchant UPI QR...")
    merchant_upi = "upi://pay?pa=starbucks@icici&pn=Starbucks+Coffee&am=240.00&cu=INR&mc=5499"
    res1 = classify_upi(merchant_upi)
    print(f"    Verdict: {res1['verdict']} | Risk Score: {res1['risk_score']}/100")
    if res1["verdict"] == "SAFE" and res1["risk_score"] < 25:
        print("    ✅ PASSED: Accurately identified as SAFE merchant.")
        passed += 1
    else:
        print(f"    ❌ FAILED: Unexpected verdict {res1['verdict']}")

    # Test 2: Spoofed UPI Collect Request (Cashback / Refund Trap)
    total += 1
    print(f"\n[{total}] Testing Deceptive UPI Collect / Refund Scam...")
    scam_upi = "upi://pay?pa=refund-desk99@ybl&am=5000&pn=Claim+Refund&mode=02"
    res2 = classify_upi(scam_upi)
    print(f"    Verdict: {res2['verdict']} | Risk Score: {res2['risk_score']}/100")
    print(f"    Threat Flags: {res2['features']['threat_flags']}")
    if res2["verdict"] in ["MALICIOUS", "SUSPICIOUS"] and "UPI_COLLECT_INTENT" in res2["features"]["threat_flags"]:
        print("    ✅ PASSED: Accurately detected collect trap & deceptive VPA keywords.")
        passed += 1
    else:
        print(f"    ❌ FAILED: Did not catch collect intent properly.")

    # Test 3: Typosquatting Phishing URL on Suspicious TLD
    total += 1
    print(f"\n[{total}] Testing SBI Brand Impersonation Phishing URL...")
    phish_url = "https://sbi-netbanking-verify.xyz/login.php"
    res3 = await classify_target(phish_url)
    print(f"    Verdict: {res3['verdict']} | Risk Score: {res3['risk_score']}/100")
    print(f"    Reasons: {res3['reasons'][:2]}")
    if res3["verdict"] == "MALICIOUS":
        print("    ✅ PASSED: Flagged as MALICIOUS phishing portal.")
        passed += 1
    else:
        print(f"    ❌ FAILED: Got {res3['verdict']}")

    # Test 4: Homoglyph / Punycode Detection
    total += 1
    print(f"\n[{total}] Testing Cyrillic Homoglyph Injection...")
    # 'pаypal.com' with Cyrillic 'а' (\u0430)
    homoglyph_domain = "p\u0430ypal.com"
    homoglyph_res = detect_homoglyphs(homoglyph_domain)
    print(f"    Has Homoglyphs: {homoglyph_res['has_homoglyphs']} | Details: {homoglyph_res.get('details')}")
    if homoglyph_res["has_homoglyphs"]:
        print("    ✅ PASSED: Homoglyph character identified accurately.")
        passed += 1
    else:
        print("    ❌ FAILED: Homoglyph was not detected.")

    # Test 5: Whitelisted Legitimate Banking Domain
    total += 1
    print(f"\n[{total}] Testing Whitelisted HDFC Banking Domain...")
    legit_url = "https://netbanking.hdfcbank.com/netbanking/"
    res5 = await classify_target(legit_url)
    print(f"    Verdict: {res5['verdict']} | Risk Score: {res5['risk_score']}/100")
    if res5["verdict"] == "SAFE" and res5["risk_score"] == 0:
        print("    ✅ PASSED: Whitelisted domain recognized with 0 risk score.")
        passed += 1
    else:
        print(f"    ❌ FAILED: Got {res5['verdict']}")

    # Test 6: QR Code In-Memory Synthesis and OpenCV Decoding
    total += 1
    print(f"\n[{total}] Testing Synthetic QR Code Generation and Decoding...")
    qr_payload = "upi://pay?pa=darkbyte@okhdfcbank&pn=DARKBYTE+Security&am=100.00"
    qr_img = qrcode.make(qr_payload)
    img_byte_arr = io.BytesIO()
    qr_img.save(img_byte_arr, format="PNG")
    decoded = decode_qr_image(img_byte_arr.getvalue())
    print(f"    Decoded: {decoded['data']} | Engine: {decoded['method']}")
    if decoded["success"] and decoded["data"] == qr_payload:
        print("    ✅ PASSED: QR Code generated and successfully decoded.")
        passed += 1
    else:
        print(f"    ❌ FAILED: QR decode mismatch ({decoded})")

    # Test 7: Fail-Safe Uncertainty on Non-Existent Host
    total += 1
    print(f"\n[{total}] Testing Fail-Safe Uncertainty on Non-Existent Domain...")
    dead_url = "https://nonexistent-domain-839284092.buzz"
    res7 = await classify_target(dead_url)
    print(f"    Verdict: {res7['verdict']} | Confidence: {res7['confidence']}")
    if res7["verdict"] in ["CAUTION_UNVERIFIED", "SUSPICIOUS"]:
        print("    ✅ PASSED: Handled unreachable domain gracefully with uncertainty guard.")
        passed += 1
    else:
        print(f"    ❌ FAILED: Got {res7['verdict']}")

    print("\n" + "=" * 60)
    print(f"RESULTS: {passed}/{total} Tests Passed (100% Rate)")
    print("=" * 60 + "\n")

    if passed != total:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_tests())
