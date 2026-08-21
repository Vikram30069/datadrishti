import React from "react";
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";

export const AdaptiveComparison: React.FC = () => {
  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3 font-sans">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wide">
            Adaptive Friction Differentiator
          </h3>
        </div>
        <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
          Same Amount • Different Context
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        Paytm already detects fraud. IntentGuard introduces the missing <strong className="text-cyan-300 font-semibold">contextual layer</strong>: instead of blocking large payments indiscriminately, friction is dynamically calibrated to user behavior.
      </p>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* User A / Scenario B */}
        <div className="p-3 bg-slate-900/90 border border-emerald-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Legitimate Context (User A)
            </span>
            <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
              ALLOW
            </span>
          </div>

          <div className="text-lg font-black text-white">₹50,000</div>

          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Recipient:</span>
              <span className="font-semibold text-slate-200">Landlord (Known)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pattern:</span>
              <span className="font-semibold text-slate-200">Monthly 1st–5th</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Device & Time:</span>
              <span className="font-semibold text-slate-200">Known Phone • 10:15 AM</span>
            </div>
          </div>

          <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[10px] text-emerald-300 font-medium">
            ✓ 0 Signal Points • 1-tap instant seamless payment.
          </div>
        </div>

        {/* User B / Scenario C */}
        <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Suspicious Context (User B)
            </span>
            <span className="text-[10px] font-bold bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
              CONFIRM
            </span>
          </div>

          <div className="text-lg font-black text-white">₹45,000</div>

          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Recipient:</span>
              <span className="font-semibold text-amber-300">Amit Kumar (New)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pattern:</span>
              <span className="font-semibold text-amber-300">Unusual (+22 pts)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Device & Time:</span>
              <span className="font-semibold text-amber-300">New Device • 2:07 AM</span>
            </div>
          </div>

          <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-lg text-[10px] text-amber-300 font-medium">
            ⚠ 77 Signal Points • Calm intervention with intent check.
          </div>
        </div>
      </div>
    </div>
  );
};
