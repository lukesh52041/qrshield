import React from 'react';
import { X, Trash2, Clock, ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle } from 'lucide-react';
import type { HistoryItem, VerdictType } from '../types/analyzer';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistory,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const getVerdictBadge = (verdict: VerdictType) => {
    switch (verdict) {
      case 'SAFE':
        return {
          icon: ShieldCheck,
          class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        };
      case 'SUSPICIOUS':
        return {
          icon: AlertTriangle,
          class: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        };
      case 'MALICIOUS':
        return {
          icon: ShieldAlert,
          class: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
        };
      default:
        return {
          icon: HelpCircle,
          class: 'text-slate-300 bg-slate-700/20 border-slate-600'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Scan Audit History ({history.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all text-xs"
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs">
              <Clock className="w-8 h-8 mb-2 opacity-40 text-cyan-400" />
              <p>No scans recorded in this session yet.</p>
              <p className="text-[11px] text-slate-600 mt-1">Analyze a link or QR code to view audit history.</p>
            </div>
          ) : (
            history.map((item) => {
              const badge = getVerdictBadge(item.verdict);
              const Icon = badge.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectHistory(item);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${badge.class} flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />
                      <span>{item.verdict.replace('_', ' ')}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-slate-300 break-all line-clamp-1 group-hover:text-cyan-300 transition-colors">
                    {item.input}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>Score: <strong className="text-slate-300">{item.risk_score}/100</strong></span>
                    <span className="uppercase text-[10px]">{item.category}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
