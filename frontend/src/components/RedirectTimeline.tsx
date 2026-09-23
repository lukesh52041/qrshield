import React from 'react';
import { Globe } from 'lucide-react';
import type { RedirectChain } from '../types/analyzer';

interface RedirectTimelineProps {
  chain: RedirectChain;
}

export const RedirectTimeline: React.FC<RedirectTimelineProps> = ({ chain }) => {
  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
    if (code >= 300 && code < 400) {
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    }
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
            Redirect Chain Sandbox Tracer
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Total Hops:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700">
            {chain.total_hops}
          </span>
          {chain.is_shortened && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Shortener Unmasked
            </span>
          )}
        </div>
      </div>

      {/* Hops Flow */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {chain.hops.map((hop, idx) => {
          const isFinal = idx === chain.hops.length - 1;
          const isInitial = idx === 0;

          return (
            <div key={idx} className="relative group">
              {/* Dot on line */}
              <div
                className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                  isFinal
                    ? 'bg-rose-500 border-rose-400 shadow-[0_0_8px_#ef4444]'
                    : isInitial
                    ? 'bg-cyan-500 border-cyan-400'
                    : 'bg-slate-800 border-slate-600'
                }`}
              />

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500 font-bold">
                      HOP #{hop.hop}
                    </span>
                    <span className="text-sm font-semibold text-slate-200 font-mono">
                      {hop.domain || 'Direct IP'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${getStatusBadge(hop.status_code)}`}>
                      HTTP {hop.status_code}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {hop.latency_ms}ms
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-mono break-all bg-black/40 p-2 rounded border border-slate-800/80">
                  {hop.url}
                </p>

                {hop.note && (
                  <p className="text-[11px] text-amber-400 font-mono italic">
                    ℹ {hop.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
