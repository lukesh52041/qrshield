import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Clock, 
  Zap
} from 'lucide-react';
import type { AnalysisResponse, VerdictType } from '../types/analyzer';

interface VerdictCardProps {
  result: AnalysisResponse;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ result }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVerdictConfig = (verdict: VerdictType) => {
    switch (verdict) {
      case 'SAFE':
        return {
          title: 'VERIFIED SAFE',
          textColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/40',
          glowClass: 'cyber-glow-safe',
          icon: ShieldCheck,
          accentColor: '#10b981',
          gradient: 'from-emerald-500/20 via-slate-900 to-slate-900'
        };
      case 'SUSPICIOUS':
        return {
          title: 'SUSPICIOUS LINK',
          textColor: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/40',
          glowClass: 'cyber-glow-suspicious',
          icon: AlertTriangle,
          accentColor: '#f59e0b',
          gradient: 'from-amber-500/20 via-slate-900 to-slate-900'
        };
      case 'MALICIOUS':
        return {
          title: 'MALICIOUS THREAT DETECTED',
          textColor: 'text-rose-500',
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/50',
          glowClass: 'cyber-glow-danger',
          icon: ShieldAlert,
          accentColor: '#ef4444',
          gradient: 'from-rose-500/25 via-slate-900 to-slate-900'
        };
      case 'CAUTION_UNVERIFIED':
      default:
        return {
          title: 'CAUTION - UNVERIFIED',
          textColor: 'text-slate-300',
          bgColor: 'bg-slate-700/20',
          borderColor: 'border-slate-600',
          glowClass: 'cyber-glow-accent',
          icon: HelpCircle,
          accentColor: '#94a3b8',
          gradient: 'from-slate-700/20 via-slate-900 to-slate-900'
        };
    }
  };

  const config = getVerdictConfig(result.verdict);
  const VerdictIcon = config.icon;

  // Circular gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (result.risk_score / 100) * circumference;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${config.borderColor} bg-slate-900/90 ${config.glowClass} backdrop-blur-xl transition-all`}>
      {/* Background Gradient Accent */}
      <div className={`absolute inset-0 bg-gradient-to-b ${config.gradient} pointer-events-none opacity-40`} />

      <div className="relative p-6 sm:p-8">
        
        {/* Top Header: Badge, Latency & Confidence */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
              <VerdictIcon className={`w-7 h-7 ${config.textColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-lg sm:text-xl font-extrabold tracking-wider font-mono ${config.textColor}`}>
                  {config.title}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {result.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI + Heuristic Threat Assessment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspection:</span>
              <span className="text-cyan-300 font-semibold">{result.latency_ms}ms</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Confidence:</span>
              <span className="text-slate-200 font-semibold">{Math.round(result.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Dial + Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-6">
          
          {/* Risk Dial Gauge */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#1e293b"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Score Progress */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={config.accentColor}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold font-mono text-white">
                  {result.risk_score}
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                  RISK INDEX
                </span>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                {result.verdict.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Plain-Language Explanation & Target */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Plain-Language Threat Verdict
            </h4>
            <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-medium">
              {result.summary}
            </p>

            {/* Target Link preview */}
            <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="text-slate-500 font-semibold select-none">TARGET:</span>
              <span className="truncate flex-1 text-cyan-300 select-all">{result.input}</span>
              <button
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-white transition-all rounded hover:bg-slate-800"
                title="Copy link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </div>

        {/* Reasons & Safety Action Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-800">
          
          {/* Key Findings */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <h5 className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider mb-2.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Inspection Signals & Reasoning</span>
            </h5>
            <ul className="space-y-2 text-xs text-slate-300">
              {result.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  <span className="leading-snug">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety Recommendations */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <h5 className="text-xs font-semibold text-slate-300 uppercase font-mono tracking-wider mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safety Action Checklist</span>
            </h5>
            <ul className="space-y-2 text-xs text-slate-300">
              {result.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="leading-snug">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};
