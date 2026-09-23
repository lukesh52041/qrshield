# QRShield - Scam QR Code & Payment Link Analyzer
### Presidency University × ISACA Bangalore Chapter Hackathon (Problem Statement 05)
**Developed by Team DARKBYTE**

QRShield is a real-time, explainable threat detection system engineered to protect everyday consumers from malicious QR codes, deceptive UPI payment intents (collect traps, refund impersonation), and phishing websites camouflaged behind redirect chains.

---

## 🌟 Key Capabilities

1. **Dual QR Decoding Engine**:
   - **Client-Side Live Scanner**: Zero-latency webcam/mobile camera stream decoder using `jsQR` with viewfinder targeting and auto-capture.
   - **Server-Side Multi-Stage OpenCV Pipeline**: Ingestion of uploaded images with grayscale, Otsu binarization, and inversion preprocessing fallbacks.

2. **Deep UPI Payment Protocol Inspection (`upi://pay` & `upi://collect`)**:
   - **Collect Request Trap Detection**: Flags debit intents masquerading as cashbacks/refunds (`mode=02` or `upi://collect`).
   - **VPA Username Fraud Scanner**: Unmasks deceptive keywords (e.g. `refund-desk`, `sbi-support`, `kyc-update`) on personal P2P handles.
   - **Merchant Authenticity Verification**: Validates NPCI Merchant Category Codes (`mc`) against claimed payee names.

3. **Safe Sandbox Redirect Tracer**:
   - Asynchronous `httpx` tracer unmasks multi-hop redirect chains (Bitly, TinyURL, tracking hops) up to 8 hops in under 2 seconds.
   - Extracts status codes (`301`, `302`, `200`, `504`), cross-domain jumps, and latency per hop.

4. **Multi-Vector Feature Scoring**:
   - **Shannon Entropy**: Identifies randomized DGA domains and obfuscated tokens.
   - **Levenshtein Typosquatting**: Matches against 60+ Indian and global banking/fintech brand dictionaries (SBI, HDFC, ICICI, Paytm, PhonePe, Google Pay, Razorpay, etc.).
   - **Homoglyph & Punycode Detection**: Catches lookalike characters (e.g. Cyrillic `а` in `pаypal.com`).
   - **High-Risk TLD & Scam Lexicon**: Flags abused TLDs (`.xyz`, `.top`, `.buzz`, etc.) and social engineering keywords.

5. **Explainability & Fail-Safe Uncertainty**:
   - Outputs a normalized Risk Score ($0 - 100$) and plain-language verdicts:
     - 🟢 **SAFE** ($< 25$)
     - 🟡 **SUSPICIOUS** ($25 - 65$)
     - 🔴 **MALICIOUS** ($> 65$)
     - ⚪ **CAUTION - UNVERIFIED** (when target server times out or domain is unreachable, avoiding dangerous false negatives).
   - Generates actionable safety checklists for non-technical users ("Do NOT enter UPI PIN").

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Service
```powershell
cd C:\Users\len\.gemini\antigravity\scratch\qrshield\backend
# Activate virtual environment
.\.venv\Scripts\Activate.ps1
# Run automated tests
python test_engine.py
# Start FastAPI backend
uvicorn app.main:app --port 8000
```
Backend API will be live at `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/docs`).

### 2. Frontend Web Interface
```powershell
cd C:\Users\len\.gemini\antigravity\scratch\qrshield\frontend
npm.cmd run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 1-Click Pitch Demonstration Scenarios

In the frontend UI, click any card in the **1-Click Pitch Demonstration Sandbox**:
1. **Verified Merchant QR**: Legitimate Starbucks counter QR (`upi://pay?pa=starbucks@icici&mc=5499`) -> 🟢 **SAFE (Score: 0)**
2. **GPay Refund / Collect Trap**: Scammer sending a ₹4,999 collect debit request -> 🔴 **MALICIOUS (Score: 100)**
3. **SBI KYC Phishing Portal**: Banking login spoof on `.xyz` -> 🔴 **MALICIOUS (Score: 100)**
4. **Homoglyph Impersonation**: Cyrillic `а` inside PayPal link -> 🔴 **MALICIOUS (Score: 100)**
5. **Multi-Hop Shortener**: Obfuscated Bitly/TinyURL unmasked -> 🟡 **SUSPICIOUS**
6. **Unreachable / Dead Host**: Server timeout handled with uncertainty guard -> ⚪ **CAUTION - UNVERIFIED**

---

## 📂 Project Architecture

```
qrshield/
├── backend/
│   ├── app/
│   │   ├── core/config.py          # Threat watchlists, weights, and SLA thresholds
│   │   ├── services/
│   │   │   ├── qr_decoder.py       # OpenCV multi-stage image decoder
│   │   │   ├── redirect_tracer.py  # Async sandbox HTTP hop tracer
│   │   │   ├── upi_analyzer.py     # NPCI UPI protocol inspector
│   │   │   ├── feature_extractor.py# Entropy, Levenshtein, homoglyphs, scam tokens
│   │   │   ├── threat_db.py        # Signatures, reputation, and whitelists
│   │   │   └── classifier.py       # Risk aggregator and explainability generator
│   │   ├── api/routes.py           # REST endpoints
│   │   └── main.py                 # FastAPI application
│   ├── requirements.txt
│   └── test_engine.py              # Test suite (7/7 passing)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Brand, ISACA hackathon badge
│   │   │   ├── InputSection.tsx     # Direct paste, dropzone, sample QR gallery
│   │   │   ├── QRScannerModal.tsx   # Live video webcam scanner
│   │   │   ├── VerdictCard.tsx      # Risk dial gauge & plain-language summary
│   │   │   ├── RedirectTimeline.tsx # Visual redirect chain graph
│   │   │   ├── UpiDetails.tsx       # NPCI parameter breakdown
│   │   │   ├── FeatureBreakdown.tsx # Entropy & static security vectors
│   │   │   ├── DemoPresets.tsx      # 1-Click hackathon demo buttons
│   │   │   └── HistoryDrawer.tsx    # Scan audit trail
│   │   ├── types/analyzer.ts
│   │   ├── utils/api.ts
│   │   ├── App.tsx
│   │   └── index.css                # Dark cybersecurity styling
│   └── package.json
│
└── demo_samples/                   # Pre-generated QR PNG images for offline testing
```

---

## 🏆 Hackathon Alignment

- **Hackathon**: Presidency University × ISACA Bangalore Chapter Hackathon
- **Problem Statement**: 05 (Scam QR Code & Payment Link Analyzer)
- **Team**: DARKBYTE
