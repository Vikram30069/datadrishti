import React, { useState, useEffect } from "react";
import { Check, AlertOctagon, ArrowLeft, ThumbsUp, ThumbsDown, XCircle, ShieldAlert } from "lucide-react";
import { RiskEvaluationResponse, TransactionData } from "@/lib/types";

interface ScreenDecisionOutcomeProps {
  evaluation: RiskEvaluationResponse;
  transaction: TransactionData;
  isEscalated: boolean;
  onReset: () => void;
  onConfirmPayment: () => void;
  onCancelPayment: () => void;
  onSubmitFeedback: (isIntentional: boolean) => void;
}

export const ScreenDecisionOutcome: React.FC<ScreenDecisionOutcomeProps> = ({
  evaluation,
  transaction,
  isEscalated,
  onReset,
  onConfirmPayment,
  onCancelPayment,
  onSubmitFeedback,
}) => {
  const [cooldown, setCooldown] = useState<number>(isEscalated ? 10 : 0);
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(!isEscalated);

  useEffect(() => {
    if (isEscalated && cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isEscalated, cooldown]);

  const handleFeedback = (isIntentional: boolean) => {
    setFeedbackGiven(isIntentional);
    onSubmitFeedback(isIntentional);
  };

  const handleAuthorizeAfterEscalation = () => {
    setIsCompleted(true);
    onConfirmPayment();
  };

  if (isEscalated && !isCompleted) {
    return (
      <div className="flex-1 flex flex-col justify-between p-4 bg-white text-slate-900 font-sans select-none animate-fadeIn">
        <div>
          {/* High Risk Header */}
          <div className="text-center pt-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center text-rose-600 shadow-sm">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <h3 className="mt-2.5 font-extrabold text-base text-rose-600">
              Stepped-Up Security Pause
            </h3>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              ₹{transaction.amount.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-600">
              to <strong className="text-slate-900">{transaction.recipient_name}</strong>
            </p>
          </div>

          {/* Safety Checklist */}
          <div className="my-3.5 p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider block">
              Paytm Safety Verification Checklist:
            </span>
            <div className="space-y-1.5 text-xs text-slate-800 font-medium">
              <div className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span>Did someone call asking for payment to avoid account blocking?</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span>Are you on a screen sharing app (AnyDesk, TeamViewer, QuickSupport)?</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span>Have you verbally verified this exact phone/UPI with the payee?</span>
              </div>
            </div>
          </div>

          {/* Cooldown Counter */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center">
            {cooldown > 0 ? (
              <p className="text-xs text-amber-900 font-bold">
                Security pause active: <span className="font-mono text-sm text-amber-700 font-extrabold">{cooldown}s</span>
              </p>
            ) : (
              <p className="text-xs text-emerald-800 font-bold">
                ✓ Cooldown completed. Proceed with extreme caution.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <button
            onClick={onCancelPayment}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-full text-xs flex items-center justify-center gap-1.5 transition shadow-md"
          >
            <XCircle className="w-4 h-4" /> Cancel Payment (Recommended)
          </button>

          <button
            onClick={handleAuthorizeAfterEscalation}
            disabled={cooldown > 0}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 font-bold py-2.5 rounded-full text-xs transition"
          >
            I verified all details, Proceed
          </button>
        </div>
      </div>
    );
  }

  // Payment Completed Success State
  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-white text-slate-900 font-sans select-none animate-fadeIn">
      <div className="text-center pt-4">
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

        {/* Post-Payment Feedback */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
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

      {/* Bottom Action */}
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
