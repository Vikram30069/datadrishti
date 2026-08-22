import React from "react";
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";

export const AdaptiveComparison: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 font-sans text-slate-900">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00BAF2]" />
          <h3 className="font-extrabold text-xs text-[#002E6E] uppercase tracking-wide">
            Adaptive Friction Differentiator
          </h3>
        </div>
        <span className="text-[10px] text-[#002E6E] font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
          Same Amount • Different Context
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed font-medium">
        Paytm already detects fraud. IntentGuard introduces the missing <strong className="text-[#002E6E] font-bold">contextual layer</strong>: instead of blocking large payments indiscriminately, friction is dynamically calibrated to user behavior.
      </p>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* User A / Scenario B */}
        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Legitimate Context (User A)
            </span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
              ALLOW
            </span>
          </div>

          <div className="text-xl font-black text-slate-900">₹50,000</div>

          <div className="space-y-1 text-[11px] text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Recipient:</span>
              <span className="font-semibold text-slate-900">Landlord (Known)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pattern:</span>
              <span className="font-semibold text-slate-900">Monthly 1st–5th</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Device & Time:</span>
              <span className="font-semibold text-slate-900">Known Phone • 10:15 AM</span>
            </div>
          </div>

          <div className="p-2 bg-white/80 border border-emerald-200 rounded-xl text-[10px] text-emerald-800 font-semibold shadow-2xs">
            ✓ 0 Signal Points • 1-tap instant seamless payment.
          </div>
        </div>

        {/* User B / Scenario C */}
        <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Suspicious Context (User B)
            </span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
              CONFIRM
            </span>
          </div>

          <div className="text-xl font-black text-slate-900">₹45,000</div>

          <div className="space-y-1 text-[11px] text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Recipient:</span>
              <span className="font-semibold text-amber-900">Amit Kumar (New)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pattern:</span>
              <span className="font-semibold text-amber-900">Unusual (+22 pts)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Device & Time:</span>
              <span className="font-semibold text-amber-900">New Device • 2:07 AM</span>
            </div>
          </div>

          <div className="p-2 bg-white/80 border border-amber-200 rounded-xl text-[10px] text-amber-900 font-semibold shadow-2xs">
            ⚠ 77 Signal Points • Calm intervention with intent check.
          </div>
        </div>
      </div>
    </div>
  );
};
