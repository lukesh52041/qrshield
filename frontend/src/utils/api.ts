import type { AnalysisResponse, DemoPreset } from '../types/analyzer';

const API_BASE_URL = 'http://localhost:8000/api';

export async function analyzeUrl(url: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze/url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis request failed with status ${response.status}`);
  }

  return response.json();
}

export async function analyzeQRImage(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/analyze/qr`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Image QR analysis failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchPresets(): Promise<DemoPreset[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/presets`);
    if (response.ok) {
      const data = await response.json();
      return data.presets;
    }
  } catch (e) {
    console.warn('Backend presets endpoint unavailable, falling back to static presets', e);
  }

  // Built-in pitch fallback presets
  return [
    {
      id: "preset_safe_merchant",
      title: "Verified Merchant QR",
      type: "UPI",
      expected_verdict: "SAFE",
      badge: "Safe Merchant",
      description: "Starbucks in-store counter QR with verified ICICI merchant code (MC: 5499).",
      payload: "upi://pay?pa=starbucks@icici&pn=Starbucks+Coffee&am=240.00&cu=INR&mc=5499&tr=TXN948172"
    },
    {
      id: "preset_upi_refund_scam",
      title: "GPay Refund / Collect Trap",
      type: "UPI",
      expected_verdict: "MALICIOUS",
      badge: "Debit Scam",
      description: "Scammer sending a DEBIT collect request masquerading as a '₹4,999 Cashback Refund'.",
      payload: "upi://pay?pa=refund-desk9021@ybl&pn=GPay+Cashback+Refund&am=4999.00&mode=02&tn=Claim+Cashback+Refund"
    },
    {
      id: "preset_sbi_phishing",
      title: "SBI KYC Phishing Portal",
      type: "URL",
      expected_verdict: "MALICIOUS",
      badge: "Phishing",
      description: "Fake banking login targeting State Bank of India with brand token injection on .xyz TLD.",
      payload: "https://sbi-netbanking-verify.xyz/login.php"
    },
    {
      id: "preset_homoglyph_attack",
      title: "Punycode / Homoglyph Impersonation",
      type: "URL",
      expected_verdict: "MALICIOUS",
      badge: "Homoglyph",
      description: "Cyrillic character 'а' (U+0430) disguised inside 'paypal.com' to deceive visual inspection.",
      payload: "https://pаypal.com/signin?claim_reward=true"
    },
    {
      id: "preset_shortener_redirect",
      title: "Multi-Hop Camouflaged Shortener",
      type: "URL",
      expected_verdict: "SUSPICIOUS",
      badge: "Redirect Chain",
      description: "Shortened link redirecting through intermediate tracking hops into an unverified portal.",
      payload: "https://tinyurl.com/qrshield-test-redirect"
    },
    {
      id: "preset_offline_uncertainty",
      title: "Unreachable / Disposable Host",
      type: "URL",
      expected_verdict: "CAUTION_UNVERIFIED",
      badge: "Uncertainty",
      description: "Inactive or dead server test demonstrating fail-safe uncertainty handling without false certainty.",
      payload: "https://expired-fraud-domain-404-test.buzz/claim"
    }
  ];
}
