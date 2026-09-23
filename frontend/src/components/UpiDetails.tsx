import React from 'react';
import { IndianRupee, ShieldCheck, AlertOctagon, User, Store, Tag } from 'lucide-react';
import type { UpiDetails as UpiDetailsType } from '../types/analyzer';

interface UpiDetailsProps {
  upi: UpiDetailsType;
}

export const UpiDetails: React.FC<UpiDetailsProps> = ({ upi }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
              UPI Protocol Deep Inspection
            </h3>
            <p className="text-xs text-slate-400">
              National Payments Corporation of India (NPCI) Specification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {upi.is_collect_request ? (
            <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>COLLECT REQUEST (DEBIT)</span>
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PAY INTENT</span>
            </span>
          )}
        </div>
      </div>

      {/* Grid of UPI Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* VPA */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <Tag className="w-3 h-3 text-cyan-400" />
            <span>Payee VPA Address</span>
          </span>
          <p className="text-sm font-bold font-mono text-white truncate" title={upi.vpa}>
            {upi.vpa || 'N/A'}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            Handle: @{upi.vpa_handle || 'unknown'}
          </span>
        </div>

        {/* Payee Name */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <User className="w-3 h-3 text-cyan-400" />
            <span>Claimed Payee Name</span>
          </span>
          <p className="text-sm font-bold font-mono text-white truncate" title={upi.payee_name}>
            {upi.payee_name || 'Individual / Unspecified'}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            Display identity
          </span>
        </div>

        {/* Amount */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <IndianRupee className="w-3 h-3 text-cyan-400" />
            <span>Pre-filled Amount</span>
          </span>
          <p className="text-sm font-bold font-mono text-amber-400">
            {upi.amount !== null ? `₹${upi.amount.toFixed(2)}` : 'User-Entered'}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            Currency: {upi.currency}
          </span>
        </div>

        {/* Merchant Category Code */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <Store className="w-3 h-3 text-cyan-400" />
            <span>Merchant Code (MC)</span>
          </span>
          <p className="text-sm font-bold font-mono text-white">
            {upi.merchant_code || 'None (P2P Account)'}
          </p>
          <span className={`text-[10px] font-mono ${upi.is_registered_merchant ? 'text-emerald-400' : 'text-amber-400'}`}>
            {upi.is_registered_merchant ? 'Verified Merchant' : 'Unregistered Individual'}
          </span>
        </div>

      </div>

      {/* Threat Flags Bar */}
      {upi.threat_flags.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
          <h4 className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Active UPI Fraud Indicators</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {upi.threat_flags.map((flag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono text-[11px] font-semibold"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
