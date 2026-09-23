import React from 'react';
import { ShieldCheck, Zap, History } from 'lucide-react';

interface HeaderProps {
  onToggleHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onToggleHistory, historyCount }) => {
  return (
    <header className="border-b border-slate-800 bg-[#0b1120]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        
        {/* Brand & Team DARKBYTE identifier */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 cyber-glow-accent">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                QR<span className="text-cyan-400">Shield</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider font-semibold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                TEAM DARKBYTE
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Presidency University × ISACA Bangalore Chapter Hackathon • Problem 05
            </p>
          </div>
        </div>

        {/* Status Indicators & History Trigger */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Real-time Sandbox:</span>
            <span className="text-emerald-400 font-mono font-medium">&lt;2.0s SLA</span>
          </div>

          <button
            onClick={onToggleHistory}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-all hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                {historyCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
