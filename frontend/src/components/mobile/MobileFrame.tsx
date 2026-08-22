import React from "react";
import { Signal, Wifi, Battery } from "lucide-react";

interface MobileFrameProps {
  children: React.ReactNode;
  timeString?: string;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  timeString = "9:41",
}) => {
  return (
    <div className="relative mx-auto w-full max-w-[390px] h-[820px] bg-slate-900 rounded-[50px] p-2.5 shadow-[0_25px_60px_-15px_rgba(0,46,110,0.25),0_0_0_8px_#cbd5e1] border-[3px] border-slate-400/50 flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Inner Screen Bezel */}
      <div className="relative w-full h-full bg-white rounded-[42px] flex flex-col overflow-hidden text-slate-900 shadow-inner">
        {/* Top Status Bar (Clean, NO Calling Indicator) */}
        <div className="w-full bg-white pt-2.5 px-6 pb-1.5 flex items-center justify-between z-30 text-[12px] font-semibold text-slate-900 shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-slate-900">{timeString}</span>
          </div>

          {/* Dynamic Island Pill */}
          <div className="w-20 h-4 bg-slate-950 rounded-full mx-auto -mt-1 flex items-center justify-end px-2">
            <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700" />
          </div>

          <div className="flex items-center gap-1.5 text-slate-800 text-[11px]">
            <Signal className="w-3.5 h-3.5 stroke-[2.2]" />
            <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />
            <div className="flex items-center gap-0.5 ml-0.5">
              <span className="text-[10px] font-bold text-slate-700">85%</span>
              <Battery className="w-4 h-4 text-slate-800 fill-slate-800 rotate-90" />
            </div>
          </div>
        </div>

        {/* Viewport content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col bg-white">
          {children}
        </div>

        {/* Home Navigation Indicator Bar */}
        <div className="w-full bg-white py-2 flex justify-center items-center z-30 shrink-0 border-t border-slate-100">
          <div className="w-36 h-1 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
};

