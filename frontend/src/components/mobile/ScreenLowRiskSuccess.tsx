import React, { useState } from "react";
import { Check, ShieldCheck, ThumbsUp, ThumbsDown, ArrowLeft, Clock, Share2 } from "lucide-react";
import { RiskEvaluationResponse, TransactionData } from "@/lib/types";

interface ScreenLowRiskSuccessProps {
  evaluation: RiskEvaluationResponse;
  transaction: TransactionData;
  onReset: () => void;
  onSubmitFeedback: (isIntentional: boolean) => void;
}

export const ScreenLowRiskSuccess: React.FC<ScreenLowRiskSuccessProps> = ({
  evaluation,
  transaction,
  onReset,
  onSubmitFeedback,
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);

  const handleFeedback = (isIntentional: boolean) => {
    setFeedbackGiven(isIntentional);
    onSubmitFeedback(isIntentional);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-white text-slate-900 font-sans select-none animate-fadeIn">
      {/* Top Success Header */}
      <div className="text-center pt-4">
        {/* Large Paytm Green Success Circle */}
        <div className="w-16 h-16 mx-auto rounded-full bg-[#00BFA5] text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Check className="w-10 h-10 stroke-[3.5]" />
        </div>

        <h2 className="mt-4 font-extrabold text-xl text-slate-900">
          Paid Successfully
        </h2>
        <div className="text-3xl font-black text-slate-900 mt-1">
          ₹{transaction.amount.toLocaleString("en-IN")}
        </div>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          to <strong className="text-slate-900 font-bold">{transaction.recipient_name}</strong>
        </p>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          UPI Ref: 423985729104 • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        {/* IntentGuard Context Assessment Box */}
        <div className="mt-5 p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-left shadow-xs">
          <div className="flex items-center gap-1.5 text-[#002E6E] text-xs font-bold mb-1">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span>IntentGuard Context Check: Approved</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {evaluation.explanation_en}
          </p>
          <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>Risk Score: <strong className="text-emerald-700 font-bold">{evaluation.risk_score}/100 (LOW)</strong></span>
            <span className="font-mono text-slate-600">Latency: {evaluation.latency_ms}ms</span>
          </div>
        </div>

        {/* Post-Payment Learning Loop */}
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
          <span className="text-xs font-bold text-slate-800 block mb-1">
            Help IntentGuard learn
          </span>
          <p className="text-[11px] text-slate-500 mb-3">
            Was this payment intentional and expected?
          </p>

          {feedbackGiven === null ? (
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleFeedback(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition shadow-xs"
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Yes
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold hover:bg-rose-100 transition shadow-xs"
              >
                <ThumbsDown className="w-3.5 h-3.5" /> No
              </button>
            </div>
          ) : (
            <div className="text-xs font-bold text-[#002E6E] bg-blue-50 py-1.5 px-3 rounded-full border border-blue-200 inline-block">
              ✓ Feedback saved to refine future baseline checks
            </div>
          )}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-3 border-t border-slate-100">
        <button
          onClick={onReset}
          className="w-full bg-[#002E6E] hover:bg-[#002559] text-white font-bold py-3.5 rounded-full text-xs transition flex items-center justify-center gap-1.5 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Make Another Payment
        </button>
      </div>
    </div>
  );
};
