import React from "react";
import { Signal, Wifi, Battery, PhoneCall } from "lucide-react";

interface MobileFrameProps {
  children: React.ReactNode;
  timeString?: string;
  callDuration?: string;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  timeString = "1:03",
  callDuration = "1:00:21",
}) => {
  return (
    <div className="relative mx-auto w-full max-w-[390px] h-[810px] bg-slate-900 rounded-[50px] p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_8px_#1e293b] border-[3px] border-slate-700/60 flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Inner Screen Bezel */}
      <div className="relative w-full h-full bg-white rounded-[42px] flex flex-col overflow-hidden text-slate-900 shadow-inner">
        {/* Top Android Status Bar matching user's Paytm Screenshot */}
        <div className="w-full bg-white pt-2.5 px-5 pb-1 flex items-center justify-between z-30 text-[11px] font-semibold text-slate-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">{timeString}</span>
            {/* Green Call Indicator Pill from Screenshot */}
            <div className="bg-[#00E5BC] text-slate-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] shadow-sm">
              <PhoneCall className="w-2.5 h-2.5 fill-slate-950" />
              <span>{callDuration}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700 text-[10px]">
            <span className="font-mono text-[9px]">0 B/s</span>
            <span className="text-[9px] font-semibold tracking-tighter">Vo LTE</span>
            <span className="text-[9px] font-bold">LTE</span>
            <div className="flex items-center gap-0.5">
              <Battery className="w-3.5 h-3.5 text-rose-500 fill-rose-500 rotate-90" />
              <span className="text-[10px] font-bold text-rose-600">5%</span>
            </div>
          </div>
        </div>

        {/* Viewport content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col bg-white">
          {children}
        </div>

        {/* Android Bottom Navigation Pill Bar */}
        <div className="w-full bg-white py-2 flex justify-center items-center z-30 shrink-0 border-t border-slate-100">
          <div className="w-36 h-1 bg-slate-800 rounded-full" />
        </div>
      </div>
    </div>
  );
};
