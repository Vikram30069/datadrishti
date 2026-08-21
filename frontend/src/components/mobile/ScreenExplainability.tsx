import React, { useState } from "react";
import { ArrowLeft, Languages, Activity, ShieldCheck, CheckCircle2 } from "lucide-react";
import { RiskEvaluationResponse } from "@/lib/types";

interface ScreenExplainabilityProps {
  evaluation: RiskEvaluationResponse;
  onClose: () => void;
}

export const ScreenExplainability: React.FC<ScreenExplainabilityProps> = ({
  evaluation,
  onClose,
}) => {
  const [lang, setLang] = useState<"en" | "hi">("en");

  const activeSignals = evaluation.signals.filter((s) => s.score > 0);

  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-white text-slate-900 font-sans select-none animate-fadeIn">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <button
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Back
          </button>

          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[11px] font-bold text-[#002E6E] border border-blue-200 hover:bg-blue-100 transition"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === "en" ? "हिंदी में देखें" : "View in English"}</span>
          </button>
        </div>

        {/* Title */}
        <div className="text-center my-3">
          <h3 className="font-extrabold text-base text-slate-900">
            {lang === "en" ? "Why this payment was flagged" : "यह भुगतान क्यों चिह्नित किया गया"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === "en"
              ? `IntentGuard noticed ${activeSignals.length} unusual signals`
              : `IntentGuard ने ${activeSignals.length} असामान्य संकेत पहचाने`}
          </p>
        </div>

        {/* Signal Breakdown Cards */}
        <div className="space-y-2 my-3">
          {activeSignals.map((signal, idx) => (
            <div
              key={signal.name}
              className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#002E6E] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {signal.display_name}
                  </span>
                  <span className="text-[11px] text-slate-600 block leading-tight mt-0.5">
                    {lang === "en" ? signal.reason : signal.reason_hi || signal.reason}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#002E6E] shrink-0 ml-2">
                +{signal.score}
              </span>
            </div>
          ))}
        </div>

        {/* Total Risk Score Card */}
        <div className="my-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50/60 border border-blue-200 rounded-2xl text-center shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            {lang === "en" ? "Calculated Risk Score" : "जोखिम स्कोर"}
          </span>
          <div className="text-3xl font-black text-[#002E6E] mt-0.5">
            {evaluation.risk_score} <span className="text-sm font-semibold text-slate-500">/ 100</span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-medium">
            <span>Band: <strong>{evaluation.risk_band}</strong></span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">Latency: {evaluation.latency_ms}ms</span>
          </div>
        </div>

        {/* Reassurance Message */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <p className="text-xs text-slate-700 leading-snug font-medium">
            {lang === "en"
              ? "This does NOT mean the payment is fraudulent. It means the payment is unusual for your established activity."
              : "इसका यह अर्थ नहीं है कि लेन-देन धोखाधड़ी है। इसका अर्थ है कि यह लेन-देन आपके सामान्य पैटर्न से अलग है।"}
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-3 border-t border-slate-100">
        <button
          onClick={onClose}
          className="w-full bg-[#002E6E] hover:bg-[#002559] text-white font-bold py-3.5 rounded-full shadow-md text-xs transition"
        >
          {lang === "en" ? "I Understand" : "मैं समझ गया"}
        </button>
      </div>
    </div>
  );
};
