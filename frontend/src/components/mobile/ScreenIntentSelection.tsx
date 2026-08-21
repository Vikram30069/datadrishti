import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, MessageSquare, CheckCircle2 } from "lucide-react";
import { extractIntent } from "@/lib/api";
import { IntentExtractResponse } from "@/lib/types";

interface ScreenIntentSelectionProps {
  onBack: () => void;
  onProceed: (extractedIntent?: IntentExtractResponse) => void;
  recipientName: string;
  amount: number;
}

const PRESET_QUICK_RESPONSES = [
  "My cousin asked me to send this for hospital emergency expenses.",
  "Monthly house rent payment to flat landlord.",
  "Paying invoice for commercial wholesale supplies.",
  "Buying electronics item from store seller."
];

export const ScreenIntentSelection: React.FC<ScreenIntentSelectionProps> = ({
  onBack,
  onProceed,
  recipientName,
  amount,
}) => {
  const [inputText, setInputText] = useState<string>("My cousin asked me to send this for hospital expenses.");
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<IntentExtractResponse | null>(null);

  const handleAnalyzeIntent = async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) return;
    setIsExtracting(true);
    try {
      const res = await extractIntent(textToAnalyze);
      setExtractedData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-white text-slate-900 font-sans select-none animate-fadeIn">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <button
            onClick={onBack}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> Back
          </button>
          <span className="text-[11px] font-bold text-[#002E6E] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            IntentGuard Context Check
          </span>
        </div>

        {/* Title */}
        <div className="my-3 text-center">
          <h3 className="font-extrabold text-base text-slate-900">
            Why are you paying {recipientName}?
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Voluntary context helps verify if this transfer makes sense for you
          </p>
        </div>

        {/* Free text input area */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-xs">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-[#002E6E]" /> Payment Reason / Purpose:
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={2}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#002E6E] resize-none"
            placeholder="e.g. My cousin asked me to send this for urgent medical expenses..."
          />

          <div className="flex justify-between items-center mt-2">
            <button
              onClick={() => handleAnalyzeIntent(inputText)}
              disabled={isExtracting || !inputText.trim()}
              className="text-[11px] font-bold bg-[#002E6E] text-white hover:bg-[#002559] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isExtracting ? (
                <span>Extracting...</span>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>Analyze Intent</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="my-3">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
            Quick Examples:
          </span>
          <div className="space-y-1.5">
            {PRESET_QUICK_RESPONSES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(preset);
                  handleAnalyzeIntent(preset);
                }}
                className="w-full text-left text-[11px] p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition truncate font-medium"
              >
                "{preset}"
              </button>
            ))}
          </div>
        </div>

        {/* Extracted Intent Badge Card */}
        {extractedData && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl shadow-xs animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-[#002E6E] mb-1">
              <span>Intent: {extractedData.category_display}</span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">
                Confidence: {(extractedData.confidence * 100).toFixed(0)}%
              </span>
            </div>
            {extractedData.extracted_relationship && (
              <div className="text-[11px] text-slate-700 mb-1">
                Relationship: <strong className="capitalize text-slate-900">{extractedData.extracted_relationship}</strong>
              </div>
            )}
            <p className="text-[11px] text-slate-600 leading-tight">
              {extractedData.context_note}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="pt-3 border-t border-slate-100">
        <button
          onClick={() => onProceed(extractedData || undefined)}
          className="w-full bg-[#002E6E] hover:bg-[#002559] text-white font-bold py-3.5 rounded-full shadow-md text-xs flex items-center justify-center gap-1.5 transition"
        >
          <span>Continue to Final Payment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
