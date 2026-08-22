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
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 font-sans text-slate-900">
      {/* Top Header & Reset */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-[#002E6E] flex items-center gap-2">
            <Play className="w-4 h-4 text-[#00BAF2] fill-[#00BAF2]" />
            <span>Judge Demo Scenarios</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Run the 4 canonical test flows in &lt; 90 seconds
          </p>
        </div>

        <button
          onClick={onResetDemo}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition shadow-xs"
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
              className={`p-3.5 rounded-2xl text-left border transition relative overflow-hidden flex flex-col justify-between shadow-2xs ${
                isSelected
                  ? "bg-blue-50/70 border-[#002E6E] shadow-sm"
                  : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-extrabold text-slate-900">
                  {sc.title}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    sc.color === "emerald"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : sc.color === "amber"
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  }`}
                >
                  {sc.action}
                </span>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#002E6E] text-base">{sc.amount}</span>
                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[170px]">
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
