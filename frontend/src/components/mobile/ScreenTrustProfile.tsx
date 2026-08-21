import React from "react";
import { ArrowLeft, Clock, Users, ShieldCheck, CheckCircle2, Home, Zap, Wifi, Calendar, Sparkles } from "lucide-react";
import { UserProfile, RegularPayee } from "@/lib/types";

interface ScreenTrustProfileProps {
  profile: UserProfile;
  payeesList?: RegularPayee[];
  onBack: () => void;
  onSelectPayee?: (payee: RegularPayee) => void;
}

export const ScreenTrustProfile: React.FC<ScreenTrustProfileProps> = ({
  profile,
  payeesList = [],
  onBack,
  onSelectPayee,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-white text-slate-900 font-sans select-none animate-fadeIn overflow-y-auto">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <button
            onClick={onBack}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Back
          </button>
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#002E6E] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" /> Trust Profile
          </div>
        </div>

        {/* User Card */}
        <div className="my-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50/60 border border-blue-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{profile.name}</h3>
              <p className="text-xs text-[#002E6E] font-mono font-medium">{profile.upi_handle}</p>
            </div>
            <span className="text-[10px] font-bold bg-[#002E6E] text-white px-2.5 py-1 rounded-full shadow-xs">
              {profile.persona}
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-blue-200/60 text-xs">
            <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-slate-500 block text-[10px] font-semibold">Median Spend:</span>
              <span className="font-bold text-slate-900 text-sm">₹{profile.median_amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-slate-500 block text-[10px] font-semibold">Max Daily Limit:</span>
              <span className="font-bold text-slate-900 text-sm">₹1,00,000 (1 Lakh)</span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-blue-100 flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
              <Clock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>{profile.usual_start_hour} AM–{profile.usual_end_hour % 12 || 12} PM</span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-blue-100 flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
              <Users className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>{profile.known_recipient_count} Established Payees</span>
            </div>
          </div>
        </div>

        {/* Regular Payees Dataset (Amount & Time Window) */}
        <div className="my-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#002E6E]" /> Regular Payees Dataset
            </span>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Learned Baselines
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mb-2.5 leading-snug">
            IntentGuard compares incoming transfers against these expected amounts and time windows to prevent fraud without false alarms.
          </p>

          <div className="space-y-2">
            {payeesList.filter(p => p.is_regular).map((payee) => (
              <div
                key={payee.id}
                onClick={() => {
                  if (onSelectPayee) onSelectPayee(payee);
                  onBack();
                }}
                className="p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ backgroundColor: payee.avatar_color, color: "#1e293b" }}
                  >
                    {payee.avatar_initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-slate-900">{payee.name}</span>
                      <span className="w-3 h-3 rounded-full bg-[#00BAF2] text-white flex items-center justify-center text-[8px] font-bold">
                        ✓
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 block mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-cyan-700" /> {payee.regular_time}
                    </span>
                    <span className="text-[9px] text-slate-500 block font-mono">{payee.category}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-extrabold text-slate-900 block text-xs">
                    ₹{payee.regular_amount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                    {payee.frequency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Close Button */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          onClick={onBack}
          className="w-full bg-[#002E6E] hover:bg-[#002559] text-white font-bold py-3 rounded-full text-xs transition shadow-md"
        >
          Return to Payment Flow
        </button>
      </div>
    </div>
  );
};
