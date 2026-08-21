import React from "react";
import { Play, RotateCcw, ShieldAlert, CheckCircle, AlertTriangle, AlertOctagon, User } from "lucide-react";
import { ScenarioDefinition, UserProfile } from "@/lib/types";

interface ScenarioSwitcherProps {
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onResetDemo: () => void;
  userProfiles: Record<string, UserProfile>;
  activeUserId: string;
  onSelectUser: (userId: string) => void;
  isLoading?: boolean;
}

export const SCENARIO_LIST = [
  {
    id: "scenario_a",
    title: "Scenario A: Safe Everyday Payment",
    amount: "₹850",
    context: "Known grocer • Normal hours • Known iPhone",
    band: "LOW",
    action: "ALLOW",
    color: "emerald",
    icon: CheckCircle,
  },
  {
    id: "scenario_b",
    title: "Scenario B: Legitimate Monthly Rent",
    amount: "₹50,000",
    context: "Known Landlord • Monthly pattern • Normal hours",
    band: "LOW / INFORM",
    action: "ALLOW",
    color: "emerald",
    icon: CheckCircle,
  },
  {
    id: "scenario_c",
    title: "Scenario C: Suspicious Context",
    amount: "₹45,000",
    context: "New payee Amit • 2:07 AM • Unrecognized device",
    band: "HIGH",
    action: "CONFIRM",
    color: "amber",
    icon: AlertTriangle,
  },
  {
    id: "scenario_d",
    title: "Scenario D: High-Risk Coercion / ATO",
    amount: "₹75,000",
    context: "New payee • 3:18 AM • New device • 2 retries",
    band: "VERY_HIGH",
    action: "ESCALATE",
    color: "rose",
    icon: AlertOctagon,
  },
];

export const ScenarioSwitcher: React.FC<ScenarioSwitcherProps> = ({
  activeScenarioId,
  onSelectScenario,
  onResetDemo,
  userProfiles,
  activeUserId,
  onSelectUser,
  isLoading = false,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl space-y-4">
      {/* Top Header & Reset */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
            <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            <span>Judge Demo Scenarios</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Run the 4 canonical test flows in &lt; 90 seconds
          </p>
        </div>

        <button
          onClick={onResetDemo}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* 4 Quick Scenario Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {SCENARIO_LIST.map((sc) => {
          const isSelected = activeScenarioId === sc.id;
          const Icon = sc.icon;

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`p-3 rounded-xl text-left border transition relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(0,186,242,0.2)]"
                  : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/80"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {sc.title}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    sc.color === "emerald"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                      : sc.color === "amber"
                      ? "bg-amber-950 text-amber-300 border-amber-500/40"
                      : "bg-rose-950 text-rose-300 border-rose-500/40"
                  }`}
                >
                  {sc.action}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-extrabold text-white text-sm">{sc.amount}</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[170px]">
                  {sc.context}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
