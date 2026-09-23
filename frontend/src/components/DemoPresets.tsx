import React from 'react';
import { Play, Sparkles, ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle } from 'lucide-react';
import type { DemoPreset, VerdictType } from '../types/analyzer';

interface DemoPresetsProps {
  presets: DemoPreset[];
  onSelectPreset: (preset: DemoPreset) => void;
  isLoading: boolean;
}

export const DemoPresets: React.FC<DemoPresetsProps> = ({
  presets,
  onSelectPreset,
  isLoading,
}) => {
  const getBadgeStyle = (verdict: VerdictType) => {
    switch (verdict) {
      case 'SAFE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'SUSPICIOUS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MALICIOUS':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700/20 text-slate-300 border-slate-600';
    }
  };

  const getVerdictIcon = (verdict: VerdictType) => {
    switch (verdict) {
      case 'SAFE':
        return ShieldCheck;
      case 'SUSPICIOUS':
        return AlertTriangle;
      case 'MALICIOUS':
        return ShieldAlert;
      default:
        return HelpCircle;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
            1-Click Pitch Demonstration Sandbox (Team DARKBYTE)
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Click any preset to trigger instant live threat inspection
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {presets.map((preset) => {
          const Icon = getVerdictIcon(preset.expected_verdict);
          const badgeClass = getBadgeStyle(preset.expected_verdict);

          return (
            <button
              key={preset.id}
              disabled={isLoading}
              onClick={() => onSelectPreset(preset)}
              className="flex flex-col text-left p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all group disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeClass} flex items-center gap-1`}>
                  <Icon className="w-3 h-3" />
                  <span>{preset.badge}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {preset.type}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1">
                {preset.title}
              </h4>

              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                <span>Run Sandbox Test</span>
                <Play className="w-3 h-3 fill-current" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
