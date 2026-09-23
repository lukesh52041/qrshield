import React from 'react';
import { Cpu, Lock, Unlock, Hash, Eye, AlertTriangle } from 'lucide-react';
import type { UrlFeatures } from '../types/analyzer';

interface FeatureBreakdownProps {
  features: UrlFeatures;
}

export const FeatureBreakdown: React.FC<FeatureBreakdownProps> = ({ features }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
            Static & Structural Threat Vectors
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          NLP & Heuristic Analysis
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Shannon Entropy */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              <span>Shannon Entropy</span>
            </span>
            <span className={`font-bold ${features.entropy.is_high_entropy ? 'text-amber-400' : 'text-emerald-400'}`}>
              {features.entropy.domain_entropy}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${features.entropy.is_high_entropy ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (features.entropy.domain_entropy / 5.0) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            {features.entropy.is_high_entropy
              ? 'High randomness detected (DGA / evasion pattern).'
              : 'Normal lexical entropy within natural language distribution.'}
          </p>
        </div>

        {/* Typosquatting */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Typosquatting Check</span>
            </span>
            {features.typosquatting.is_typosquat ? (
              <span className="text-rose-400 font-bold">MATCH</span>
            ) : (
              <span className="text-emerald-400 font-bold">CLEAN</span>
            )}
          </div>
          <p className="text-xs text-white font-medium">
            {features.typosquatting.target_brand
              ? `Impersonating: ${features.typosquatting.target_brand}`
              : 'No brand impersonation detected'}
          </p>
          <p className="text-[11px] text-slate-500 leading-tight">
            Levenshtein edit distance against 60+ banking/fintech brand dictionaries.
          </p>
        </div>

        {/* Homoglyph / Punycode */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Homoglyphs / IDN</span>
            </span>
            {features.homoglyph.has_homoglyphs ? (
              <span className="text-rose-400 font-bold">SPOOF DETECTED</span>
            ) : (
              <span className="text-emerald-400 font-bold">ASCII ONLY</span>
            )}
          </div>
          <p className="text-xs text-white font-medium truncate">
            {features.homoglyph.has_homoglyphs
              ? features.homoglyph.details
              : 'Standard Latin characters'}
          </p>
          <p className="text-[11px] text-slate-500 leading-tight">
            Punycode (xn--) and Cyrillic/Greek deceptive unicode glyph inspection.
          </p>
        </div>

        {/* TLD Reputation */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">Top-Level Domain (TLD)</span>
          <p className="text-sm font-bold font-mono text-white">
            .{features.tld.name || 'none'}
          </p>
          <p className={`text-[11px] font-mono ${features.tld.is_suspicious ? 'text-rose-400' : 'text-slate-400'}`}>
            {features.tld.is_suspicious
              ? 'Flagged: High-abuse / disposable phishing TLD.'
              : 'Standard commercial / institutional registry.'}
          </p>
        </div>

        {/* SSL / HTTPS Security */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2">
            {features.https ? (
              <Lock className="w-4 h-4 text-emerald-400" />
            ) : (
              <Unlock className="w-4 h-4 text-rose-400" />
            )}
            <span className="text-xs font-mono text-slate-400">Transport Security</span>
          </div>
          <p className="text-sm font-bold font-mono text-white">
            {features.https ? 'Encrypted (HTTPS)' : 'Plaintext (HTTP)'}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            {features.https ? 'Valid TLS handshake initiated' : 'Vulnerable to MITM tampering'}
          </p>
        </div>

        {/* Host Type */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">Host Resolution</span>
          <p className="text-sm font-bold font-mono text-white truncate">
            {features.ip_host ? 'Raw IP Address' : 'DNS Hostname'}
          </p>
          <p className={`text-[11px] font-mono ${features.ip_host ? 'text-rose-400' : 'text-slate-400'}`}>
            {features.ip_host ? 'Bypassing DNS domain reputation' : `${features.subdomain_depth} subdomain level(s)`}
          </p>
        </div>

      </div>

      {/* Scam Keywords Bar */}
      {features.scam_keywords.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <h4 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
            Detected Social Engineering Triggers ({features.scam_keywords.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {features.scam_keywords.map((kw, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 font-mono text-[11px]"
              >
                "{kw}"
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
