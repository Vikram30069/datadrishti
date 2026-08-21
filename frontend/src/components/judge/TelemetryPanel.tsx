import React from "react";
import { BarChart3, Activity, ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Clock } from "lucide-react";
import { DashboardMetrics } from "@/lib/types";

interface TelemetryPanelProps {
  metrics?: DashboardMetrics | null;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 text-center text-slate-400 text-xs">
        Loading measured telemetry metrics...
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wide">
            Measured Security Telemetry
          </h3>
        </div>
        <span className="text-[10px] text-amber-300/90 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
          Simulated Prototype Metrics
        </span>
      </div>

      {/* 4 Measured Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Evaluations</span>
          <span className="font-mono text-base font-extrabold text-white">
            {metrics.transactions_evaluated}
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Warnings Shown</span>
          <span className="font-mono text-base font-extrabold text-amber-400">
            {metrics.warnings_shown}
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">User Cancellations</span>
          <span className="font-mono text-base font-extrabold text-rose-400">
            {metrics.simulated_cancellations}
          </span>
        </div>

        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Avg Latency</span>
          <span className="font-mono text-base font-extrabold text-emerald-400 flex items-center justify-center gap-1">
            <Activity className="w-3.5 h-3.5" /> {metrics.avg_evaluation_latency_ms} ms
          </span>
        </div>
      </div>

      {/* Risk Distribution Breakdown */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Risk Band Distribution:
        </span>
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
          <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
            <span className="text-emerald-300 block font-semibold">LOW</span>
            <span className="font-mono font-bold text-white text-xs">{metrics.risk_distribution.LOW || 0}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-blue-950/40 border border-blue-500/30">
            <span className="text-blue-300 block font-semibold">MEDIUM</span>
            <span className="font-mono font-bold text-white text-xs">{metrics.risk_distribution.MEDIUM || 0}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30">
            <span className="text-amber-300 block font-semibold">HIGH</span>
            <span className="font-mono font-bold text-white text-xs">{metrics.risk_distribution.HIGH || 0}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30">
            <span className="text-rose-300 block font-semibold">VERY HIGH</span>
            <span className="font-mono font-bold text-white text-xs">{metrics.risk_distribution.VERY_HIGH || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Evaluations Timeline */}
      {metrics.recent_events && metrics.recent_events.length > 0 && (
        <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Live Risk Timeline:
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {metrics.recent_events.slice(0, 5).map((evt) => (
              <div
                key={evt.event_id}
                className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/90 text-[11px] border border-slate-800/80"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      evt.risk_band === "LOW"
                        ? "bg-emerald-400"
                        : evt.risk_band === "MEDIUM"
                        ? "bg-blue-400"
                        : evt.risk_band === "HIGH"
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                  />
                  <span className="text-slate-300 font-semibold">₹{evt.amount.toLocaleString("en-IN")}</span>
                  <span className="text-slate-400 text-[10px]">→ {evt.recipient_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-400">{evt.risk_score} pts</span>
                  <span className="font-mono text-[9px] text-cyan-400">{evt.latency_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
