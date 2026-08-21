import React, { useState, useEffect } from "react";
import { Database, Download, Play, Pause, Users, Zap, ShieldAlert, Sparkles, Filter, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { UserProfile, TransactionData, RiskEvaluationResponse } from "@/lib/types";

interface SyntheticStudioProps {
  onInjectTransaction: (tx: TransactionData) => void;
  activeScenarioId: string;
}

interface ScenarioMeta {
  scenario_id: string;
  title: string;
  description: string;
  risk_category: string;
  expected_action: string;
  expected_score_range: [number, number];
  primary_signals: string[];
}

interface StreamItem {
  stream_index: number;
  transaction: TransactionData;
  user_name: string;
  income_band: string;
  evaluation: {
    risk_score: number;
    risk_band: string;
    policy_action: string;
    explanation_en: string;
    latency_ms: number;
  };
}

export const SyntheticStudio: React.FC<SyntheticStudioProps> = ({
  onInjectTransaction,
  activeScenarioId,
}) => {
  const [activeTab, setActiveTab] = useState<"scenarios" | "personas" | "stream">("scenarios");
  const [scenarios, setScenarios] = useState<ScenarioMeta[]>([]);
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedIncomeBand, setSelectedIncomeBand] = useState<string>("ALL");
  const [stats, setStats] = useState<any>({ total_personas: 100, total_transactions: 10240 });
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamFeed, setStreamFeed] = useState<StreamItem[]>([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

  useEffect(() => {
    // Fetch scenario matrix & dataset stats
    fetch(`${API_BASE}/simulation/scenarios`)
      .then((r) => r.json())
      .then((data) => setScenarios(data))
      .catch(console.error);

    fetch(`${API_BASE}/simulation/dataset/stats`)
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error);

    fetch(`${API_BASE}/simulation/personas`)
      .then((r) => r.json())
      .then((data) => setPersonas(data))
      .catch(console.error);
  }, [API_BASE]);

  // Live Stream Effect
  useEffect(() => {
    let interval: any = null;
    if (isStreaming) {
      interval = setInterval(() => {
        fetch(`${API_BASE}/simulation/stream/next`)
          .then((r) => r.json())
          .then((item: StreamItem) => {
            setStreamFeed((prev) => [item, ...prev.slice(0, 7)]);
          })
          .catch(console.error);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isStreaming, API_BASE]);

  const handleScenarioClick = (sc: ScenarioMeta) => {
    // Construct scenario transaction payload
    const persona = personas[0] || {
      user_id: "U102",
      name: "Vikram Verma",
      median_amount: 1250,
      p90_amount: 4500,
      usual_start_hour: 8,
      known_devices: ["DEV_VIKRAM_IPHONE15"],
      usual_regions: ["Mumbai"],
      known_recipients: [{ id: "R201", name: "Suresh Nair (Landlord)", upi: "suresh.nair@okhdfcbank", regular_amount: 50000 }]
    };

    let tx: TransactionData;
    const now = new Date().toISOString();

    if (sc.scenario_id === "LEGITIMATE_HIGH_VALUE") {
      tx = {
        transaction_id: `TXN_LEGIT_${Date.now()}`,
        user_id: "U102",
        recipient_id: "R201",
        recipient_name: "Suresh Nair (Landlord)",
        recipient_upi: "suresh.nair@okhdfcbank",
        amount: 50000.0,
        timestamp: now,
        device_id: "DEV_VIKRAM_IPHONE15",
        location_region: "Mumbai",
        is_known_recipient: true,
        is_known_device: true,
        failed_attempts_recent: 0
      };
    } else if (sc.scenario_id === "MULTI_SIGNAL_ANOMALY") {
      tx = {
        transaction_id: `TXN_ATO_${Date.now()}`,
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
        failed_attempts_recent: 0
      };
    } else if (sc.scenario_id === "SOCIAL_ENGINEERING") {
      tx = {
        transaction_id: `TXN_SCAM_${Date.now()}`,
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
        failed_attempts_recent: 2
      };
    } else if (sc.scenario_id === "AMOUNT_SPIKE") {
      tx = {
        transaction_id: `TXN_SPIKE_${Date.now()}`,
        user_id: "U102",
        recipient_id: "R202",
        recipient_name: "Nature Basket Groceries",
        recipient_upi: "naturebasket@paytm",
        amount: 32000.0,
        timestamp: now,
        device_id: "DEV_VIKRAM_IPHONE15",
        location_region: "Mumbai",
        is_known_recipient: true,
        is_known_device: true,
        failed_attempts_recent: 0
      };
    } else {
      tx = {
        transaction_id: `TXN_NORM_${Date.now()}`,
        user_id: "U102",
        recipient_id: "R202",
        recipient_name: "Nature Basket Groceries",
        recipient_upi: "naturebasket@paytm",
        amount: 850.0,
        timestamp: now,
        device_id: "DEV_VIKRAM_IPHONE15",
        location_region: "Mumbai",
        is_known_recipient: true,
        is_known_device: true,
        failed_attempts_recent: 0
      };
    }

    onInjectTransaction(tx);
  };

  const filteredPersonas = selectedIncomeBand === "ALL"
    ? personas
    : personas.filter((p) => p.income_band === selectedIncomeBand);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-slate-100 font-sans">
      {/* Header with Dataset Stats & Export Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="font-extrabold text-base text-white tracking-tight">
              Synthetic Data Studio & Scenario Generator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {stats.total_personas} Deterministic Personas • {stats.total_transactions?.toLocaleString()} Historical Transactions • 10 Scenarios
          </p>
        </div>

        {/* Download CSV / JSON Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`${API_BASE}/simulation/export/transactions?format=csv`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Transactions (CSV)</span>
          </a>

          <a
            href={`${API_BASE}/simulation/export/personas?format=json`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Personas (JSON)</span>
          </a>
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="flex items-center justify-between mt-3 mb-4">
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("scenarios")}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeTab === "scenarios" ? "bg-cyan-500 text-slate-950 font-bold shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            10 Configurable Scenarios
          </button>
          <button
            onClick={() => setActiveTab("personas")}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeTab === "personas" ? "bg-cyan-500 text-slate-950 font-bold shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            100 Personas Explorer
          </button>
          <button
            onClick={() => setActiveTab("stream")}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "stream" ? "bg-cyan-500 text-slate-950 font-bold shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Live Stream Feed</span>
            {isStreaming && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
          </button>
        </div>
      </div>

      {/* TAB 1: 10 Scenarios Matrix */}
      {activeTab === "scenarios" && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {scenarios.map((sc) => {
              const isLegitHigh = sc.scenario_id === "LEGITIMATE_HIGH_VALUE";
              const isSocialEng = sc.scenario_id === "SOCIAL_ENGINEERING";
              const isATO = sc.scenario_id === "MULTI_SIGNAL_ANOMALY";

              return (
                <div
                  key={sc.scenario_id}
                  onClick={() => handleScenarioClick(sc)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between group ${
                    isLegitHigh
                      ? "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400"
                      : isSocialEng || isATO
                      ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-400"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-white group-hover:text-cyan-300 transition">
                        {sc.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          sc.expected_action === "ALLOW"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                            : sc.expected_action === "CONFIRM" || sc.expected_action === "INFORM"
                            ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                            : "bg-rose-950 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {sc.expected_action}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      {sc.description}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">
                      Expected Score: {sc.expected_score_range[0]}–{sc.expected_score_range[1]} pts
                    </span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                      Test in Simulator <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: 100 Personas Explorer */}
      {activeTab === "personas" && (
        <div className="space-y-3">
          {/* Income Band Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            {["ALL", "STUDENT_TIER", "ENTRY_SALARIED", "SENIOR_SALARIED", "MERCHANT_SMB", "GIG_FREELANCER"].map((band) => (
              <button
                key={band}
                onClick={() => setSelectedIncomeBand(band)}
                className={`px-3 py-1 rounded-xl font-semibold shrink-0 transition ${
                  selectedIncomeBand === band
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {band.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
            {filteredPersonas.slice(0, 15).map((p) => (
              <div
                key={p.user_id}
                className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white">{p.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded">
                      {p.user_id}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                      {p.persona_type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                    <span>Median: <strong className="text-slate-200">₹{p.median_amount}</strong></span>
                    <span>P90: <strong className="text-slate-200">₹{p.p90_amount}</strong></span>
                    <span>Hours: <strong className="text-slate-200">{p.usual_start_hour} AM–{p.usual_end_hour % 12 || 12} PM</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">{p.usual_regions.join(", ")}</span>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">
                    {p.trusted_patterns?.length || 0} Trusted Patterns
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Real-Time Live Stream */}
      {activeTab === "stream" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                  isStreaming
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                }`}
              >
                {isStreaming ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause Stream
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Start Live Ticker
                  </>
                )}
              </button>
              <span className="text-xs text-slate-400">
                {isStreaming ? "Simulating live incoming UPI transactions..." : "Click to stream transactions"}
              </span>
            </div>

            <span className="text-[10px] font-mono text-cyan-400">
              Evaluated via IntentGuard Policy Engine
            </span>
          </div>

          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {streamFeed.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Stream paused. Click "Start Live Ticker" to watch real-time synthetic transaction evaluations.
              </div>
            ) : (
              streamFeed.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-950/80 border border-slate-800/90 rounded-xl flex items-center justify-between text-xs animate-fadeIn"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] text-slate-500">#{item.stream_index}</span>
                    <div>
                      <span className="font-bold text-slate-200">{item.user_name}</span>
                      <span className="text-slate-500 text-[11px]"> → {item.transaction.recipient_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-100">
                      ₹{item.transaction.amount?.toLocaleString("en-IN")}
                    </span>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        item.evaluation.policy_action === "ALLOW"
                          ? "bg-emerald-950 text-emerald-300"
                          : item.evaluation.policy_action === "CONFIRM"
                          ? "bg-amber-950 text-amber-300"
                          : "bg-rose-950 text-rose-300"
                      }`}
                    >
                      {item.evaluation.policy_action} ({item.evaluation.risk_score} pts)
                    </span>

                    <span className="text-[9px] font-mono text-slate-500">
                      {item.evaluation.latency_ms}ms
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
