import React from "react";
import { Terminal, Shield, CheckCircle, AlertTriangle, AlertOctagon, Activity, Cpu } from "lucide-react";
import { RiskEvaluationResponse } from "@/lib/types";

interface RiskTraceViewerProps {
  evaluation?: RiskEvaluationResponse | null;
}

export const RiskTraceViewer: React.FC<RiskTraceViewerProps> = ({ evaluation }) => {
  if (!evaluation) {
    return (
      <div className="bg-white rounded-3xl p-5 border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
        Select a scenario or trigger a payment in the mobile simulator to view the live decision trace.
      </div>
    );
  }

  const getBadgeColor = (action: string) => {
    switch (action) {
      case "ALLOW":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "INFORM":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "CONFIRM":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "ESCALATE":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 font-sans text-slate-900">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00BAF2]" />
          <h3 className="font-extrabold text-xs text-[#002E6E] tracking-wide uppercase">
            Deterministic Decision Trace
          </h3>
        </div>
        <span className="font-mono text-[10px] text-[#002E6E] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
          v{evaluation.policy_version}
        </span>
      </div>

      {/* Decision Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Risk Score</span>
          <span className="font-mono text-base font-extrabold text-slate-900">
            {evaluation.risk_score} <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Risk Band</span>
          <span className="font-bold text-sm text-[#002E6E]">{evaluation.risk_band}</span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Authoritative Action</span>
          <span className={`inline-block font-extrabold text-xs px-2 py-0.5 mt-0.5 rounded-md border ${getBadgeColor(evaluation.policy_action)}`}>
            {evaluation.policy_action}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Evaluation Latency</span>
          <span className="font-mono text-xs font-bold text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
            <Activity className="w-3 h-3 text-emerald-600" /> {evaluation.latency_ms} ms
          </span>
        </div>
      </div>

      {/* Signal Points Contribution Table */}
      <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-3">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          <span>Explainable Signal Breakdown</span>
          <span>Points</span>
        </div>

        <div className="space-y-1.5">
          {evaluation.signals.map((sig) => (
            <div
              key={sig.name}
              className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    sig.score > 0 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
                <span className="text-slate-800 text-[11px] font-semibold">
                  {sig.display_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">max {sig.max_points}</span>
                <span
                  className={`font-mono text-xs font-bold ${
                    sig.score > 0 ? "text-amber-700" : "text-slate-400"
                  }`}
                >
                  +{sig.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Reason Codes */}
      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Audit Reason Codes:
        </span>
        <div className="flex flex-wrap gap-1">
          {evaluation.reason_codes.map((rc, idx) => (
            <span
              key={idx}
              className="font-mono text-[9px] font-bold bg-blue-50 text-[#002E6E] px-2 py-0.5 rounded-full border border-blue-200"
            >
              {rc}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
