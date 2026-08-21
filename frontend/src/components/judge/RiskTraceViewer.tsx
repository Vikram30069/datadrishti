import React from "react";
import { Terminal, Shield, CheckCircle, AlertTriangle, AlertOctagon, Activity, Cpu } from "lucide-react";
import { RiskEvaluationResponse } from "@/lib/types";

interface RiskTraceViewerProps {
  evaluation?: RiskEvaluationResponse | null;
}

export const RiskTraceViewer: React.FC<RiskTraceViewerProps> = ({ evaluation }) => {
  if (!evaluation) {
    return (
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-center text-slate-400 text-xs">
        Select a scenario or trigger a payment in the mobile simulator to view the live decision trace.
      </div>
    );
  }

  const getBadgeColor = (action: string) => {
    switch (action) {
      case "ALLOW":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-500/50";
      case "INFORM":
        return "bg-blue-950/80 text-blue-300 border-blue-500/50";
      case "CONFIRM":
        return "bg-amber-950/80 text-amber-300 border-amber-500/50";
      case "ESCALATE":
        return "bg-rose-950/80 text-rose-300 border-rose-500/50";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs text-slate-200 tracking-wide uppercase">
            Deterministic Decision Trace
          </h3>
        </div>
        <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
          v{evaluation.policy_version}
        </span>
      </div>

      {/* Decision Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Risk Score</span>
          <span className="font-mono text-base font-extrabold text-white">
            {evaluation.risk_score} <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Risk Band</span>
          <span className="font-bold text-sm text-cyan-300">{evaluation.risk_band}</span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Authoritative Action</span>
          <span className={`inline-block font-extrabold text-xs px-2 py-0.5 mt-0.5 rounded-md border ${getBadgeColor(evaluation.policy_action)}`}>
            {evaluation.policy_action}
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Evaluation Latency</span>
          <span className="font-mono text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
            <Activity className="w-3 h-3" /> {evaluation.latency_ms} ms
          </span>
        </div>
      </div>

      {/* Signal Points Contribution Table */}
      <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-2.5">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <span>Explainable Signal Breakdown</span>
          <span>Points</span>
        </div>

        <div className="space-y-1">
          {evaluation.signals.map((sig) => (
            <div
              key={sig.name}
              className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    sig.score > 0 ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />
                <span className="text-slate-300 text-[11px] font-medium">
                  {sig.display_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">max {sig.max_points}</span>
                <span
                  className={`font-mono text-xs font-bold ${
                    sig.score > 0 ? "text-amber-400" : "text-slate-400"
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
      <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          Audit Reason Codes:
        </span>
        <div className="flex flex-wrap gap-1">
          {evaluation.reason_codes.map((rc, idx) => (
            <span
              key={idx}
              className="font-mono text-[9px] font-medium bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700"
            >
              {rc}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
