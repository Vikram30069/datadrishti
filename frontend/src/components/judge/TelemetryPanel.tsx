import React from "react";
import { BarChart3, Activity, ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Clock } from "lucide-react";
import { DashboardMetrics } from "@/lib/types";

interface TelemetryPanelProps {
  metrics?: DashboardMetrics | null;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="bg-white rounded-3xl p-5 border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
        Loading measured telemetry metrics...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 font-sans text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#00BAF2]" />
          <h3 className="font-extrabold text-xs text-[#002E6E] uppercase tracking-wide">
            Measured Security Telemetry
          </h3>
        </div>
        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
          Simulated Prototype Metrics
        </span>
      </div>

      {/* 4 Measured Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Evaluations</span>
          <span className="font-mono text-base font-extrabold text-slate-900">
            {metrics.transactions_evaluated}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Warnings Shown</span>
          <span className="font-mono text-base font-extrabold text-amber-600">
            {metrics.warnings_shown}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-semibold">User Cancellations</span>
          <span className="font-mono text-base font-extrabold text-rose-600">
            {metrics.simulated_cancellations}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Avg Latency</span>
          <span className="font-mono text-base font-extrabold text-emerald-700 flex items-center justify-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-600" /> {metrics.avg_evaluation_latency_ms} ms
          </span>
        </div>
      </div>

      {/* Risk Distribution Breakdown */}
      <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Risk Band Distribution:
        </span>
        <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-800 block font-bold">LOW</span>
            <span className="font-mono font-extrabold text-slate-900 text-xs">{metrics.risk_distribution.LOW || 0}</span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-blue-800 block font-bold">MEDIUM</span>
            <span className="font-mono font-extrabold text-slate-900 text-xs">{metrics.risk_distribution.MEDIUM || 0}</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-amber-900 block font-bold">HIGH</span>
            <span className="font-mono font-extrabold text-slate-900 text-xs">{metrics.risk_distribution.HIGH || 0}</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-rose-900 block font-bold">VERY HIGH</span>
            <span className="font-mono font-extrabold text-slate-900 text-xs">{metrics.risk_distribution.VERY_HIGH || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Evaluations Timeline */}
      {metrics.recent_events && metrics.recent_events.length > 0 && (
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Live Risk Timeline:
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {metrics.recent_events.slice(0, 5).map((evt) => (
              <div
                key={evt.event_id}
                className="flex items-center justify-between p-2 rounded-xl bg-white text-[11px] border border-slate-200/80 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      evt.risk_band === "LOW"
                        ? "bg-emerald-500"
                        : evt.risk_band === "MEDIUM"
                        ? "bg-blue-500"
                        : evt.risk_band === "HIGH"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <span className="text-slate-900 font-bold">₹{evt.amount.toLocaleString("en-IN")}</span>
                  <span className="text-slate-500 text-[10px]">→ {evt.recipient_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-500">{evt.risk_score} pts</span>
                  <span className="font-mono text-[9px] text-[#002E6E] font-bold">{evt.latency_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Out-of-Band Twilio Escalation Dispatch */}
      <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider">
              Twilio Escalation Dispatch
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">+91 63045 89007</span>
        </div>
        <p className="text-[11px] text-slate-300">
          Dispatches immediate out-of-band warning alerts to freeze UPI or confirm voluntary authorization.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={async () => {
              try {
                const { triggerEscalationAlert } = await import("@/lib/api");
                const res = await triggerEscalationAlert({
                  channel: "whatsapp",
                  recipient_name: "Amit Kumar",
                  amount: 75000,
                  to_phone: "+916304589007"
                });
                alert(`✓ WhatsApp message dispatched via Twilio!\nSID: ${res.sid || 'Live'}`);
              } catch (e: any) {
                alert(`Error: ${e.message}`);
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            📲 Test WhatsApp Alert
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const { triggerEscalationAlert } = await import("@/lib/api");
                const res = await triggerEscalationAlert({
                  channel: "voice",
                  recipient_name: "Amit Kumar",
                  amount: 75000,
                  to_phone: "+916304589007"
                });
                alert(`✓ Automated Voice Call dispatched via Twilio!\nSID: ${res.sid || 'Live'}`);
              } catch (e: any) {
                alert(`Error: ${e.message}`);
              }
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            📞 Test Voice Call
          </button>
        </div>
      </div>
    </div>
  );
};


