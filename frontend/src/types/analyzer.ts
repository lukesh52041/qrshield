export type VerdictType = 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'CAUTION_UNVERIFIED' | 'ERROR';

export interface Hop {
  hop: number;
  url: string;
  domain: string;
  status_code: number;
  latency_ms: number;
  content_type?: string;
  server?: string;
  note?: string;
}

export interface RedirectChain {
  start_url: string;
  final_url: string;
  final_domain: string;
  total_hops: number;
  is_shortened: boolean;
  has_cross_domain_hop: boolean;
  is_unreachable: boolean;
  error_reason?: string | null;
  hops: Hop[];
}

export interface UpiDetails {
  is_upi: boolean;
  action_type: string;
  is_collect_request: boolean;
  vpa: string;
  vpa_username: string;
  vpa_handle: string;
  payee_name: string;
  amount: number | null;
  currency: string;
  merchant_code: string;
  is_registered_merchant: boolean;
  is_safe_merchant: boolean;
  threat_flags: string[];
  risk_score: number;
  explanations: string[];
}

export interface UrlFeatures {
  url: string;
  hostname: string;
  path: string;
  query: string;
  is_whitelisted: boolean;
  entropy: {
    domain_entropy: number;
    path_entropy: number;
    is_high_entropy: boolean;
  };
  tld: {
    name: string;
    is_suspicious: boolean;
  };
  homoglyph: {
    has_homoglyphs: boolean;
    is_punycode: boolean;
    decoded?: string | null;
    details?: string;
  };
  ip_host: boolean;
  unusual_port: {
    has_unusual_port: boolean;
    port: number | null;
  };
  typosquatting: {
    is_typosquat: boolean;
    target_brand: string | null;
    reasons: string[];
    distance?: number;
    risk_level?: string;
  };
  scam_keywords: string[];
  subdomain_depth: number;
  https: boolean;
}

export interface QRMetadata {
  decoded_content: string;
  decode_engine: string;
  filename: string;
}

export interface AnalysisResponse {
  success: boolean;
  verdict: VerdictType;
  risk_score: number;
  confidence: number;
  category: 'UPI_PAYMENT' | 'WEB_URL' | 'QR_IMAGE' | string;
  input: string;
  summary: string;
  reasons: string[];
  recommendations: string[];
  latency_ms: number;
  features?: UrlFeatures;
  upi_details?: UpiDetails;
  redirect_chain?: RedirectChain;
  qr_metadata?: QRMetadata;
}

export interface DemoPreset {
  id: string;
  title: string;
  type: 'UPI' | 'URL';
  expected_verdict: VerdictType;
  badge: string;
  description: string;
  payload: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  input: string;
  verdict: VerdictType;
  risk_score: number;
  category: string;
  summary: string;
}
