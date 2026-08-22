"use client";

import React, { useState, useEffect } from "react";
import { Shield, Sparkles, Smartphone, LayoutDashboard, Database, Activity } from "lucide-react";
import { MobileFrame } from "@/components/mobile/MobileFrame";
import { ScreenPaymentEntry } from "@/components/mobile/ScreenPaymentEntry";
import { ScreenLowRiskSuccess } from "@/components/mobile/ScreenLowRiskSuccess";
import { ScreenIntervention } from "@/components/mobile/ScreenIntervention";
import { ScreenExplainability } from "@/components/mobile/ScreenExplainability";
import { ScreenIntentSelection } from "@/components/mobile/ScreenIntentSelection";
import { ScreenDecisionOutcome } from "@/components/mobile/ScreenDecisionOutcome";
import { ScreenTrustProfile } from "@/components/mobile/ScreenTrustProfile";

import { ScenarioSwitcher, SCENARIO_LIST } from "@/components/judge/ScenarioSwitcher";
import { RiskTraceViewer } from "@/components/judge/RiskTraceViewer";
import { TelemetryPanel } from "@/components/judge/TelemetryPanel";
import { AdaptiveComparison } from "@/components/judge/AdaptiveComparison";
import { SyntheticStudio } from "@/components/judge/SyntheticStudio";

import {
  evaluateTransaction,
  getUserProfile,
  getRegularPayees,
  submitFeedback,
  getDashboardMetrics,
  triggerScenario,
  resetDemoState,
} from "@/lib/api";
import {
  TransactionData,
  RiskEvaluationResponse,
  UserProfile,
  DashboardMetrics,
  RegularPayee,
} from "@/lib/types";

type MobileScreenState =
  | "ENTRY"
  | "LOW_RISK_SUCCESS"
  | "INTERVENTION"
  | "EXPLAINABILITY"
  | "INTENT_CHECK"
  | "DECISION_OUTCOME"
  | "TRUST_PROFILE";

export default function Home() {
  // View mode: 'split' (phone + judge panel) or 'phone-only' (embed preview)
  const [viewMode, setViewMode] = useState<"split" | "phone-only">("split");
  const [rightTab, setRightTab] = useState<"telemetry" | "studio">("studio");

  // Mobile UI state
  const [mobileState, setMobileState] = useState<MobileScreenState>("ENTRY");
  const [activeScenarioId, setActiveScenarioId] = useState<string>("scenario_c");
  const [activeUserId, setActiveUserId] = useState<string>("U102");

  // Data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [payeesList, setPayeesList] = useState<RegularPayee[]>([]);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionData>({
    transaction_id: "TXN_DEMO_C",
    user_id: "U102",
    recipient_id: "R991",
    recipient_name: "Amit Kumar",
    recipient_upi: "amit.kumar89@okaxis",
    amount: 45000.0,
    timestamp: "2026-08-21T02:07:00",
    device_id: "DEV_UNKNOWN_REDMI_12",
    location_region: "Mumbai",
    is_known_recipient: false,
    is_known_device: false,
    failed_attempts_recent: 0,
  });

  const [evaluation, setEvaluation] = useState<RiskEvaluationResponse | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previousScreenBeforeExplain, setPreviousScreenBeforeExplain] = useState<MobileScreenState>("INTERVENTION");

  // Load initial profile, regular payees, and metrics on mount
  useEffect(() => {
    loadProfileAndMetrics("U102");
  }, []);

  const loadProfileAndMetrics = async (userId: string) => {
    try {
      const [prof, payees, mets] = await Promise.all([
        getUserProfile(userId),
        getRegularPayees(),
        getDashboardMetrics(),
      ]);
      setUserProfile(prof);
      setPayeesList(payees);
      setMetrics(mets);
    } catch (e) {
      console.error("Initial load error:", e);
    }
  };

  // Payee selection handler
  const handleSelectPayee = (payee: RegularPayee) => {
    setCurrentTransaction((prev) => ({
      ...prev,
      recipient_id: payee.id,
      recipient_name: payee.name,
      recipient_upi: payee.upi,
      amount: payee.regular_amount > 0 ? payee.regular_amount : prev.amount,
      is_known_recipient: payee.is_regular,
    }));
  };

  // Inject transaction directly from Synthetic Studio
  const handleInjectTransaction = async (tx: TransactionData) => {
    setCurrentTransaction(tx);
    setMobileState("ENTRY");
    setIsLoading(true);
    try {
      const evalRes = await evaluateTransaction(tx);
      setEvaluation(evalRes);
      const mets = await getDashboardMetrics();
      setMetrics(mets);
    } catch (e) {
      console.error("Evaluation error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch Scenario handler
  const handleSelectScenario = async (scenarioId: string) => {
    setIsLoading(true);
    setActiveScenarioId(scenarioId);
    try {
      const evalRes = await triggerScenario(scenarioId);
      setEvaluation(evalRes);

      const nowTs = Date.now();
      if (scenarioId === "scenario_a") {
        setCurrentTransaction({
          transaction_id: `TXN_DEMO_A_${nowTs}`,
          user_id: "U102",
          recipient_id: "R202",
          recipient_name: "Nature Basket Groceries",
          recipient_upi: "naturebasket@paytm",
          amount: 850.0,
          timestamp: "2026-08-21T11:30:00",
          device_id: "DEV_VIKRAM_IPHONE15",
          location_region: "Mumbai",
          is_known_recipient: true,
          is_known_device: true,
          failed_attempts_recent: 0,
        });
      } else if (scenarioId === "scenario_b") {
        setCurrentTransaction({
          transaction_id: `TXN_DEMO_B_${nowTs}`,
          user_id: "U102",
          recipient_id: "R201",
          recipient_name: "Suresh Nair (Landlord)",
          recipient_upi: "suresh.nair@okhdfcbank",
          amount: 50000.0,
          timestamp: "2026-08-21T10:15:00",
          device_id: "DEV_VIKRAM_IPHONE15",
          location_region: "Mumbai",
          is_known_recipient: true,
          is_known_device: true,
          failed_attempts_recent: 0,
        });
      } else if (scenarioId === "scenario_c") {
        setCurrentTransaction({
          transaction_id: `TXN_DEMO_C_${nowTs}`,
          user_id: "U102",
          recipient_id: "R991",
          recipient_name: "Amit Kumar",
          recipient_upi: "amit.kumar89@okaxis",
          amount: 45000.0,
          timestamp: "2026-08-21T02:07:00",
          device_id: "DEV_UNKNOWN_REDMI_12",
          location_region: "Mumbai",
          is_known_recipient: false,
          is_known_device: false,
          failed_attempts_recent: 0,
        });
      } else if (scenarioId === "scenario_d") {
        setCurrentTransaction({
          transaction_id: `TXN_DEMO_D_${nowTs}`,
          user_id: "U102",
          recipient_id: "R999",
          recipient_name: "QuickCrypto Pay",
          recipient_upi: "fastcrypto@ybl",
          amount: 75000.0,
          timestamp: "2026-08-21T03:18:00",
          device_id: "DEV_NEW_DEVICE_EMULATOR",
          location_region: "Kolkata",
          is_known_recipient: false,
          is_known_device: false,
          failed_attempts_recent: 2,
        });
      }

      setMobileState("ENTRY");
      const mets = await getDashboardMetrics();
      setMetrics(mets);
    } catch (e) {
      console.error("Scenario trigger error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Proceed to Pay (Evaluate live)
  const handleProceedToPay = async () => {
    setIsLoading(true);
    try {
      // Ensure unique transaction_id for each live payment attempt
      const activeTx = {
        ...currentTransaction,
        transaction_id: currentTransaction.transaction_id.includes("_") 
          ? currentTransaction.transaction_id 
          : `${currentTransaction.transaction_id}_${Date.now()}`
      };
      setCurrentTransaction(activeTx);
      const evalRes = await evaluateTransaction(activeTx);

      setEvaluation(evalRes);

      if (evalRes.policy_action === "ALLOW") {
        setMobileState("LOW_RISK_SUCCESS");
      } else if (evalRes.policy_action === "INFORM" || evalRes.policy_action === "CONFIRM") {
        setMobileState("INTERVENTION");
      } else if (evalRes.policy_action === "ESCALATE") {
        setMobileState("DECISION_OUTCOME");
      }

      const mets = await getDashboardMetrics();
      setMetrics(mets);
    } catch (e) {
      console.error("Evaluation error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Feedback handler
  const handleFeedbackSubmit = async (isIntentional: boolean, action: string = "CONTINUED") => {
    if (!evaluation) return;
    try {
      await submitFeedback({
        transaction_id: currentTransaction.transaction_id,
        user_id: currentTransaction.user_id,
        user_action: action,
        is_intentional: isIntentional,
      });
      const [prof, mets] = await Promise.all([
        getUserProfile(currentTransaction.user_id),
        getDashboardMetrics(),
      ]);
      setUserProfile(prof);
      setMetrics(mets);
    } catch (e) {
      console.error("Feedback error:", e);
    }
  };

  // Reset demo
  const handleResetDemo = async () => {
    setIsLoading(true);
    try {
      await resetDemoState();
      await loadProfileAndMetrics("U102");
      handleSelectScenario("scenario_c");
    } catch (e) {
      console.error("Reset error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-3 md:p-6 flex flex-col justify-between max-w-7xl mx-auto space-y-4 font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-3 border-b border-slate-200 gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl paytm-header-gradient flex items-center justify-center text-white shadow-md font-black text-xl border border-cyan-300">
            ₹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg md:text-xl text-[#002E6E] tracking-tight">
                Paytm <span className="text-[#00BAF2]">IntentGuard</span>
              </h1>
              <span className="text-[10px] font-bold bg-blue-50 text-[#002E6E] border border-blue-200 px-2.5 py-0.5 rounded-full">
                Native Paytm Layer Prototype
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Contextual Payment Security • 100 Personas & 10,000+ Deterministic Synthetic Stream
            </p>
          </div>
        </div>

        {/* View Mode & Right Panel Switcher */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Studio Tab Switcher */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex items-center gap-1 text-xs">
            <button
              onClick={() => setRightTab("studio")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                rightTab === "studio"
                  ? "bg-[#002E6E] text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Synthetic Studio</span>
            </button>
            <button
              onClick={() => setRightTab("telemetry")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                rightTab === "telemetry"
                  ? "bg-[#002E6E] text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Telemetry & Scenarios</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode("phone-only")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === "phone-only"
                  ? "bg-[#00BAF2] text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Only</span>
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === "split"
                  ? "bg-[#00BAF2] text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
          </div>

          <button
            onClick={handleResetDemo}
            disabled={isLoading}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Quick Scenario Preset Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0 px-2">
          <Sparkles className="w-4 h-4 text-[#00BAF2]" />
          <span>Quick Scenarios:</span>
        </div>

        <div className="flex items-center gap-2">
          {SCENARIO_LIST.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 shrink-0 shadow-xs ${
                activeScenarioId === sc.id
                  ? "bg-[#002E6E] text-white border-[#002E6E] font-bold shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{sc.title.split(":")[0]}: <strong>{sc.amount}</strong></span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                sc.action === "ALLOW"
                  ? (activeScenarioId === sc.id ? "bg-emerald-400/30 text-emerald-200" : "bg-emerald-100 text-emerald-800")
                  : sc.action === "CONFIRM"
                  ? (activeScenarioId === sc.id ? "bg-amber-400/30 text-amber-200" : "bg-amber-100 text-amber-900")
                  : (activeScenarioId === sc.id ? "bg-rose-400/30 text-rose-200" : "bg-rose-100 text-rose-800")
              }`}>
                {sc.action}
              </span>
            </button>
          ))}

          {/* Quick Twilio Out-of-Band Call & WhatsApp Trigger */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 shrink-0">
            <button
              onClick={() => {
                setRightTab("telemetry");
              }}
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-slate-700 transition flex items-center gap-1.5 shadow-xs"
              title="Open Twilio Out-of-Band Calling & WhatsApp Panel"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>📞 Live Twilio (+91 63045 89007)</span>
            </button>
          </div>
        </div>
      </div>


      {/* Main Layout */}
      <div className={`grid grid-cols-1 ${viewMode === "split" ? "lg:grid-cols-12" : "max-w-md mx-auto w-full"} gap-6 items-start`}>
        {/* Mobile Phone Simulator Container */}
        <div className={`${viewMode === "split" ? "lg:col-span-5" : "w-full"} flex flex-col items-center`}>
          <div className="w-full max-w-[390px] flex items-center justify-between mb-1.5 text-xs text-slate-500 px-2 font-medium">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Paytm UPI Native Interface
            </span>
            <span className="text-[10px] text-[#002E6E] font-mono font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              State: {mobileState}
            </span>
          </div>

          <MobileFrame timeString="9:41">
            {/* Screen 1: Payment Entry (Matching Latest Screenshot) */}
            {mobileState === "ENTRY" && (
              <ScreenPaymentEntry
                transaction={currentTransaction}
                userProfile={userProfile}
                payeesList={payeesList}
                onAmountChange={(amt) => setCurrentTransaction({ ...currentTransaction, amount: amt })}
                onSelectPayee={handleSelectPayee}
                onProceedToPay={handleProceedToPay}
                onViewTrustProfile={() => setMobileState("TRUST_PROFILE")}
                isLoading={isLoading}
              />
            )}

            {/* Screen 2: Low-Risk Success */}
            {mobileState === "LOW_RISK_SUCCESS" && evaluation && (
              <ScreenLowRiskSuccess
                evaluation={evaluation}
                transaction={currentTransaction}
                onReset={() => setMobileState("ENTRY")}
                onSubmitFeedback={(isIntentional) => handleFeedbackSubmit(isIntentional, "ALLOWED")}
              />
            )}

            {/* Screen 3: Paytm Protect / IntentGuard Intervention Modal */}
            {mobileState === "INTERVENTION" && evaluation && (
              <ScreenIntervention
                evaluation={evaluation}
                transaction={currentTransaction}
                onCancel={() => {
                  handleFeedbackSubmit(false, "CANCELLED");
                  setMobileState("ENTRY");
                }}
                onContinue={(cat) => setMobileState("INTENT_CHECK")}
                onViewExplainability={() => {
                  setPreviousScreenBeforeExplain(mobileState);
                  setMobileState("EXPLAINABILITY");
                }}
              />
            )}

            {/* Screen 4: Explainability Breakdown */}
            {mobileState === "EXPLAINABILITY" && evaluation && (
              <ScreenExplainability
                evaluation={evaluation}
                onClose={() => setMobileState(previousScreenBeforeExplain)}
              />
            )}

            {/* Screen 5: Intent & Context Check */}
            {mobileState === "INTENT_CHECK" && (
              <ScreenIntentSelection
                recipientName={currentTransaction.recipient_name}
                amount={currentTransaction.amount}
                onBack={() => setMobileState("INTERVENTION")}
                onProceed={(extracted) => setMobileState("DECISION_OUTCOME")}
              />
            )}

            {/* Screen 6: Decision Outcome & Cooldown */}
            {mobileState === "DECISION_OUTCOME" && evaluation && (
              <ScreenDecisionOutcome
                evaluation={evaluation}
                transaction={currentTransaction}
                isEscalated={evaluation.policy_action === "ESCALATE"}
                onReset={() => setMobileState("ENTRY")}
                onConfirmPayment={() => handleFeedbackSubmit(true, "CONTINUED")}
                onCancelPayment={() => {
                  handleFeedbackSubmit(false, "CANCELLED");
                  setMobileState("ENTRY");
                }}
                onSubmitFeedback={(isIntentional) => handleFeedbackSubmit(isIntentional, "CONTINUED")}
              />
            )}

            {/* Screen 7: Trust Profile with Regular Payees Dataset */}
            {mobileState === "TRUST_PROFILE" && userProfile && (
              <ScreenTrustProfile
                profile={userProfile}
                payeesList={payeesList}
                onBack={() => setMobileState("ENTRY")}
                onSelectPayee={handleSelectPayee}
              />
            )}
          </MobileFrame>

          <p className="mt-2 text-[10px] text-center text-slate-500 max-w-[340px]">
            Simulated hackathon experience matching Paytm Android app design patterns.
          </p>
        </div>

        {/* Right Column: Judge Panel (Only shown in split view) */}
        {viewMode === "split" && (
          <div className="lg:col-span-7 space-y-4">
            {rightTab === "studio" ? (
              <SyntheticStudio
                onInjectTransaction={handleInjectTransaction}
                activeScenarioId={activeScenarioId}
              />
            ) : (
              <>
                <ScenarioSwitcher
                  activeScenarioId={activeScenarioId}
                  onSelectScenario={handleSelectScenario}
                  onResetDemo={handleResetDemo}
                  userProfiles={{ U102: userProfile! }}
                  activeUserId={activeUserId}
                  onSelectUser={(uid) => {
                    setActiveUserId(uid);
                    loadProfileAndMetrics(uid);
                  }}
                  isLoading={isLoading}
                />

                <RiskTraceViewer evaluation={evaluation} />

                <AdaptiveComparison />

                <TelemetryPanel metrics={metrics} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
        Paytm IntentGuard Concept Prototype • Deterministic Synthetic Engine with 100 Personas & 10,000+ Transactions
      </footer>
    </main>
  );
}
