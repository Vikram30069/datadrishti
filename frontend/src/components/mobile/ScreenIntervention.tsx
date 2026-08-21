import React, { useState } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2, HelpCircle, ArrowRight, X, UserX, Clock, TrendingUp, Landmark, Plus, Info } from "lucide-react";
import { RiskEvaluationResponse, TransactionData } from "@/lib/types";

interface ScreenInterventionProps {
  evaluation: RiskEvaluationResponse;
  transaction: TransactionData;
  onCancel: () => void;
  onContinue: (selectedCategory?: string) => void;
  onViewExplainability: () => void;
}

export const ScreenIntervention: React.FC<ScreenInterventionProps> = ({
  evaluation,
  transaction,
  onCancel,
  onContinue,
  onViewExplainability,
}) => {
  // Top 3 contributing signals
  const activeSignals = [...evaluation.signals]
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="relative flex-1 flex flex-col justify-between bg-slate-900/60 font-sans select-none overflow-hidden">
      {/* Background Dimmed Sheet showing Bank Accounts (Matching Screenshot 2 background) */}
      <div className="absolute inset-0 bg-slate-100 flex flex-col justify-end p-4 pb-6 opacity-40 pointer-events-none">
        <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-sm mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 font-bold flex items-center justify-center text-xs">
                BOI
              </div>
              <div>
                <span className="font-bold text-sm text-slate-800 block">Union BOI - 0236</span>
                <span className="text-xs text-blue-600 font-semibold">Check Balance</span>
              </div>
            </div>
            <div className="w-5 h-5 rounded-full bg-[#002E6E] flex items-center justify-center text-white text-xs">
              ✓
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-slate-200 text-xs font-semibold text-blue-600 flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4" /> Add Bank Account
        </div>

        <div className="flex justify-center gap-1.5 py-2">
          <span className="w-2 h-2 rounded-full bg-slate-800" />
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          <span className="w-2 h-2 rounded-full bg-slate-300" />
        </div>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-[2px]" />

      {/* Centered Paytm Protect Modal Card (Matching Screenshot 2) */}
      <div className="relative z-20 m-3 my-auto bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col animate-scaleUp">
        {/* Top Illustrated Graphic */}
        <div className="relative mx-auto w-24 h-24 mb-1 flex items-center justify-center">
          {/* Smartphone Outline Background */}
          <div className="w-16 h-20 rounded-2xl border-4 border-cyan-400 bg-cyan-50/50 flex flex-col items-center justify-center shadow-sm">
            {/* Warning Hazard Triangle */}
            <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center text-amber-600 animate-bounce">
              <AlertTriangle className="w-5 h-5 fill-amber-500 text-white" />
            </div>
          </div>

          {/* Scammer Illustration Badge in top-right */}
          <div className="absolute -top-1 -right-1 w-11 h-11 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white shadow-md text-base">
            🕵️
          </div>
        </div>

        {/* Modal Heading & Subheading matching Screenshot 2 */}
        <div className="text-center mt-1">
          <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
            Paytm Protect: IntentGuard
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-snug font-medium">
            This payment of <strong className="text-slate-900 font-bold">₹{transaction.amount.toLocaleString("en-IN")}</strong> to <strong className="text-slate-900 font-bold">{transaction.recipient_name}</strong> is unusual for your account.
          </p>
        </div>

        {/* 3 Anomaly Cards (IntentGuard Explainable signals) */}
        <div className="space-y-1.5 my-3.5">
          {activeSignals.map((signal) => (
            <div
              key={signal.name}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-left"
            >
              <div className="p-1 rounded-md bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                {signal.name === "amount_anomaly" ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : signal.name === "new_recipient" ? (
                  <UserX className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-800 uppercase">
                    {signal.display_name}
                  </span>
                  <span className="text-[9px] font-mono text-amber-700 font-bold">
                    +{signal.score} pts
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                  {signal.reason}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Authentic Paytm Safety Guidance Message from Screenshot 2 */}
        <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-center mb-3">
          <p className="text-[11px] font-extrabold text-slate-900 leading-snug">
            You need not to enter MPIN to receive money in your Bank A/c
          </p>
        </div>

        {/* Action Buttons: Blue Pill Button matching Screenshot 2 */}
        <div className="space-y-2">
          <button
            onClick={() => onContinue()}
            className="w-full bg-[#002E6E] hover:bg-[#002559] active:scale-[0.99] text-white font-bold py-3.5 rounded-full shadow-md text-xs tracking-wide transition"
          >
            Ok, I Understand & Review
          </button>

          <button
            onClick={onCancel}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-full text-xs transition"
          >
            Cancel Payment
          </button>
        </div>

        {/* Explainability link */}
        <div className="mt-2.5 text-center">
          <button
            onClick={onViewExplainability}
            className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Why am I seeing this? (Risk Breakdown)
          </button>
        </div>
      </div>
    </div>
  );
};
