import React, { useState, useEffect } from "react";
import { Check, AlertOctagon, ArrowLeft, ThumbsUp, ThumbsDown, XCircle, ShieldAlert, MessageSquare, PhoneCall, ShieldCheck, Clock, Lock } from "lucide-react";
import { RiskEvaluationResponse, TransactionData } from "@/lib/types";
import { triggerEscalationAlert, getEscalationSession, simulateEscalationResponse, completeVerifiedTransaction, EscalationSessionResponse } from "@/lib/api";

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
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "PENDING_VERIFICATION" | "VERIFYING" | "VERIFIED" | "REJECTED" | "CANCELLED" | "COMPLETED" | "EXPIRED"
  >("PENDING_VERIFICATION");
  const [verificationMethod, setVerificationMethod] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSendingTwilio, setIsSendingTwilio] = useState<boolean>(false);
  const [isSubmittingProceed, setIsSubmittingProceed] = useState<boolean>(false);

  // 0. Reset state on new transaction
  useEffect(() => {
    setVerificationStatus("PENDING_VERIFICATION");
    setVerificationMethod(null);
    setStatusMessage(null);
    setIsCancelled(false);
    setIsCompleted(!isEscalated);
    setFeedbackGiven(null);
    setCooldown(isEscalated ? 10 : 0);
  }, [transaction.transaction_id, isEscalated]);

  // 1. Cooldown timer (informational pause, does NOT unlock Proceed by itself)
  useEffect(() => {
    if (isEscalated && cooldown > 0 && !isCancelled && !isCompleted) {
      const timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isEscalated, cooldown, isCancelled, isCompleted]);

  // 2. Authoritative Backend Polling of Verification State
  useEffect(() => {
    if (!isEscalated || isCompleted || isCancelled) return;

    const interval = setInterval(async () => {
      try {
        const session: EscalationSessionResponse = await getEscalationSession(transaction.transaction_id);
        if (session) {
          const status = session.verification_status;
          setVerificationStatus(status);
          if (session.verification_method) {
            setVerificationMethod(session.verification_method);
          }

          if (status === "VERIFIED") {
            const methodLabel = session.verification_method === "WHATSAPP" ? "WhatsApp" : session.verification_method === "VOICE" ? "Voice Call" : "Groq Verification";
            setStatusMessage(`✓ Verified via ${methodLabel}`);
          } else if (status === "REJECTED" || status === "CANCELLED") {
            setIsCancelled(true);
            onSubmitFeedback(false);
          } else if (status === "VERIFYING") {
            const methodLabel = session.verification_method === "WHATSAPP" ? "WhatsApp" : "Voice Call";
            setStatusMessage(`⏳ Waiting for ${methodLabel} confirmation...`);
          }
        }
      } catch (err) {
        // Silently retry polling
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isEscalated, isCompleted, isCancelled, transaction.transaction_id, onSubmitFeedback]);


  // Trigger WhatsApp or Voice Verification
  const handleSendTwilio = async (channel: "whatsapp" | "voice") => {
    setIsSendingTwilio(true);
    setVerificationStatus("VERIFYING");
    setVerificationMethod(channel.toUpperCase());
    setStatusMessage(
      channel === "whatsapp"
        ? "📲 WhatsApp Alert dispatched. Reply YES to verify or NO to cancel."
        : "📞 Voice Call initiating. Answer and say YES to verify or NO to cancel."
    );

    try {
      await triggerEscalationAlert({
        channel,
        recipient_name: transaction.recipient_name,
        amount: transaction.amount,
        to_phone: "+916304589007",
        user_name: "Vikram Verma",
        transaction_id: transaction.transaction_id || "TXN_DEMO_D",
      });
    } catch (err: any) {
      setStatusMessage("Verification service temporarily unavailable. Please try the other method.");
    } finally {
      setIsSendingTwilio(false);
    }

  };

  // Demo simulator buttons (calls the exact same backend Groq verification service)
  const handleSimulateResponse = async (action: "YES" | "NO" | "UNCLEAR") => {
    try {
      const res = await simulateEscalationResponse(
        action,
        "DEMO",
        transaction.transaction_id || "TXN_DEMO_D",
        action === "YES"
          ? "Yes, I initiated this payment."
          : action === "NO"
          ? "No, I did not initiate this payment."
          : "Maybe, I am not sure."
      );
      if (res && res.session) {
        const decision = res.decision || action;
        if (decision === "YES") {
          setVerificationStatus("VERIFIED");
          setVerificationMethod("DEMO");
          setStatusMessage("✓ Verified via Groq Language Classifier");
        } else if (decision === "NO") {
          setVerificationStatus("CANCELLED");
          setIsCancelled(true);
          setStatusMessage("🛑 Groq Classified NO / CANCEL: Payment Stopped.");
          onSubmitFeedback(false);
        } else {
          setVerificationStatus("PENDING_VERIFICATION");
          setStatusMessage(
            "❓ We couldn't clearly verify your response. Please answer 'YES, I initiated this payment' or 'NO, I did not initiate this payment.'"
          );
        }
      }
    } catch (err: any) {
      console.error("Simulation error:", err);
    }
  };

  // Finalize payment only if backend confirms VERIFIED
  const handleProceedClick = async () => {
    if (verificationStatus !== "VERIFIED" || isSubmittingProceed) return;

    setIsSubmittingProceed(true);
    try {
      await completeVerifiedTransaction({
        transaction_id: transaction.transaction_id || "TXN_DEMO_D",
        amount: transaction.amount,
        recipient_name: transaction.recipient_name,
      });
      setIsCompleted(true);
      onConfirmPayment();
    } catch (err: any) {
      setStatusMessage(`Payment authorization error: ${err.message}`);
    } finally {
      setIsSubmittingProceed(false);
    }
  };

  const handleFeedback = (isIntentional: boolean) => {
    setFeedbackGiven(isIntentional);
    onSubmitFeedback(isIntentional);
  };

  // -------------------------------------------------------------
  // STATE 1: PAYMENT CANCELLED / REJECTED RESULT SCREEN
  // -------------------------------------------------------------
  if (isCancelled || verificationStatus === "REJECTED" || verificationStatus === "CANCELLED") {
    const methodLabel = verificationMethod === "WHATSAPP" ? "WhatsApp" : verificationMethod === "VOICE" ? "Voice Call" : "Verification Channel";
    return (
      <div className="flex-1 flex flex-col justify-between p-5 bg-rose-50/40 text-slate-900 font-sans select-none animate-fadeIn">
        <div className="text-center pt-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
            <XCircle className="w-10 h-10 stroke-[2.5]" />
          </div>

          <span className="mt-3 inline-block text-[10px] uppercase font-mono font-extrabold tracking-wider bg-rose-100 text-rose-800 px-3 py-0.5 rounded-full border border-rose-300">
            Verification Rejected
          </span>

          <h2 className="mt-2 font-black text-xl text-rose-700">
            Payment Cancelled
          </h2>
          <div className="text-2xl font-black text-slate-900 line-through opacity-70 mt-0.5">
            ₹{transaction.amount.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            to <strong>{transaction.recipient_name}</strong>
          </p>

          <div className="mt-4 p-4 bg-white border border-rose-200 rounded-2xl text-left space-y-2.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Protected by IntentGuard Out-of-Band Verification</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              IntentGuard received a <strong>NO</strong> response via {methodLabel}. The <strong>₹{transaction.amount.toLocaleString("en-IN")}</strong> payment to <strong>{transaction.recipient_name}</strong> was cancelled for your protection.
            </p>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Zero funds were debited. Your account is safe.</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-rose-200/60">
          <button
            onClick={() => {
              onCancelPayment();
              onReset();
            }}
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-full text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Home (Account Secured)
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: STEPPED-UP SECURITY PAUSE SCREEN (FORCED VERIFICATION)
  // -------------------------------------------------------------
  if (isEscalated && !isCompleted) {
    const isVerified = verificationStatus === "VERIFIED";

    return (
      <div className="flex-1 flex flex-col justify-between p-4 bg-white text-slate-900 font-sans select-none animate-fadeIn">
        <div>
          {/* High Risk Header */}
          <div className="text-center pt-1">
            <div className="w-13 h-13 mx-auto rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center text-rose-600 shadow-sm">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <h3 className="mt-2 font-extrabold text-sm text-rose-600">
              Stepped-Up Security Pause
            </h3>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              ₹{transaction.amount.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-600">
              to <strong className="text-slate-900">{transaction.recipient_name}</strong>
            </p>
          </div>

          {/* Verification Badge */}
          <div className="mt-2.5 mb-2 py-1 px-3 bg-rose-100/80 border border-rose-300 rounded-full text-center">
            <span className="text-[10px] font-extrabold text-rose-800 tracking-wider uppercase">
              PAYMENT VERIFICATION REQUIRED
            </span>
          </div>

          {/* Cooldown Timer Banner */}
          {cooldown > 0 && (
            <div className="mb-2.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-center flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <p className="text-[11px] text-amber-900 font-bold">
                Security pause active: <span className="font-mono text-xs text-amber-700 font-extrabold">{cooldown}s</span>
              </p>
            </div>
          )}

          {/* Out-of-Band Verification Box */}
          <div className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-emerald-400" /> Verification Channel
              </span>
              <span className="text-[10px] text-slate-400 font-mono">+91 63045 89007</span>
            </div>

            {/* Exactly Two Verification Channels */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => handleSendTwilio("whatsapp")}
                disabled={isSendingTwilio || isVerified}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-[11px] font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Alert
              </button>

              <button
                type="button"
                onClick={() => handleSendTwilio("voice")}
                disabled={isSendingTwilio || isVerified}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white text-[11px] font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Voice Call (TTS)
              </button>
            </div>

            {/* Verification Status Card */}
            <div className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-800 text-center space-y-1">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Status:
              </div>
              {isVerified ? (
                <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 animate-fadeIn">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    ✓ Verified via {verificationMethod === 'WHATSAPP' ? 'WhatsApp' : verificationMethod === 'VOICE' ? 'Voice Call' : 'Groq Verification'}
                  </span>
                </div>
              ) : verificationStatus === "VERIFYING" ? (
                <div className="text-[11px] font-semibold text-amber-300 animate-pulse">
                  ⏳ Verification in progress... Reply YES/NO
                </div>
              ) : (
                <div className="text-xs font-bold text-rose-300 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>🔒 Verification required</span>
                </div>
              )}
            </div>

            {/* Unclear / Status Message Display */}
            {statusMessage && (
              <div className="text-[11px] text-center text-slate-200 leading-relaxed font-medium bg-slate-950 p-2.5 rounded-xl border border-slate-800 animate-fadeIn">
                {statusMessage}
              </div>
            )}

            {/* Quick Demo Verification Classifier Controls */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
              <span className="text-[9px] text-slate-400 font-medium">Groq Classifier Test:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSimulateResponse("YES")}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer"
                  title="Simulate user confirms: 'Yes, I initiated this payment.'"
                >
                  ✓ Said &quot;YES&quot;
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateResponse("NO")}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[9px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer"
                  title="Simulate user denies: 'No, I did not initiate this payment.'"
                >
                  🛑 Said &quot;NO&quot;
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateResponse("UNCLEAR")}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.5 rounded-md transition cursor-pointer"
                  title="Simulate user ambiguous response: 'Maybe, I'm not sure'"
                >
                  ❓ Ambiguous
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: PROCEED ONLY (Cancel button strictly removed) */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={handleProceedClick}
            disabled={!isVerified || isSubmittingProceed}
            className={`w-full font-bold py-3.5 rounded-full text-xs flex items-center justify-center gap-1.5 transition ${
              isVerified && !isSubmittingProceed
                ? "bg-[#002E6E] hover:bg-[#002559] text-white shadow-md cursor-pointer animate-pulse"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
            }`}
          >
            {isSubmittingProceed ? (
              <span>Authorizing Transfer...</span>
            ) : isVerified ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" /> I verified all details, Proceed
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> I verified all details, Proceed
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }


  // -------------------------------------------------------------
  // STATE 3: PAYMENT COMPLETED SUCCESS STATE
  // -------------------------------------------------------------
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

