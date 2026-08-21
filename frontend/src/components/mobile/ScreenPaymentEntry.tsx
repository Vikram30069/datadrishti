import React, { useState } from "react";
import { ArrowLeft, Check, Shield, Delete, ChevronDown, Users, Clock } from "lucide-react";
import { TransactionData, UserProfile, RegularPayee } from "@/lib/types";
import { amountToIndianWords } from "@/lib/numberToWords";

interface ScreenPaymentEntryProps {
  transaction: TransactionData;
  userProfile?: UserProfile | null;
  payeesList?: RegularPayee[];
  onAmountChange: (amount: number) => void;
  onSelectPayee?: (payee: RegularPayee) => void;
  onProceedToPay: () => void;
  onViewTrustProfile: () => void;
  onSelectTag?: (tag: string) => void;
  isLoading?: boolean;
}

const TAGS = [
  { id: "shopping", label: "🛍️ Shopping", isDashed: false },
  { id: "emi", label: "💰 EMI and Loans", isDashed: false },
  { id: "note", label: "+ Add a note", isDashed: true },
];

const MAX_LIMIT = 100000; // 1 Lakh limit

export const ScreenPaymentEntry: React.FC<ScreenPaymentEntryProps> = ({
  transaction,
  userProfile,
  payeesList = [],
  onAmountChange,
  onSelectPayee,
  onProceedToPay,
  onViewTrustProfile,
  onSelectTag,
  isLoading = false,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [showPayeeDrawer, setShowPayeeDrawer] = useState<boolean>(false);

  // Get recipient initials
  const initials = transaction.recipient_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isExceedingLimit = transaction.amount > MAX_LIMIT;

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    if (!rawVal) {
      onAmountChange(0);
      return;
    }
    const numVal = parseInt(rawVal, 10);
    onAmountChange(numVal);
  };

  // Interactive keypad handler matching user's screenshot layout
  const handleKeyClick = (val: string) => {
    let strAmount = Math.floor(transaction.amount).toString();
    if (val === "BACKSPACE") {
      if (strAmount.length <= 1) {
        onAmountChange(0);
      } else {
        onAmountChange(parseInt(strAmount.slice(0, -1), 10));
      }
    } else if (val === "+") {
      // Clear / Reset to 0
      onAmountChange(0);
    } else if (val === ".") {
      // Decimal point key in screenshot (no-op for integer UPI rupees)
      return;
    } else {
      let nextStr = strAmount === "0" ? val : strAmount + val;
      if (nextStr.length <= 9) {
        onAmountChange(parseInt(nextStr, 10));
      }
    }
  };

  const amountInWords = amountToIndianWords(transaction.amount);

  return (
    <div className="relative flex-1 flex flex-col justify-between bg-white text-slate-900 font-sans select-none overflow-hidden">
      {/* Top Bar matching Paytm Screenshot */}
      <div>
        <div className="px-4 py-2 flex items-center justify-between">
          <button className="p-1 -ml-1 text-slate-800 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          
          <button
            onClick={onViewTrustProfile}
            className="text-[11px] font-bold text-[#002E6E] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80 hover:bg-blue-100 transition"
          >
            🛡 Trust Profile
          </button>
        </div>

        {/* Recipient Profile Section with Payee Switcher */}
        <div className="flex flex-col items-center justify-center mt-1">
          {/* Avatar Circle with Lavender Background from Screenshot */}
          <div className="w-13 h-13 w-12 h-12 rounded-full bg-[#EBD5FF] text-[#9333EA] flex items-center justify-center font-bold text-sm shadow-sm border border-purple-200">
            {initials}
          </div>

          {/* Name with Verified Cyan Checkmark & Switcher Caret */}
          <button
            onClick={() => setShowPayeeDrawer(true)}
            className="flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-lg hover:bg-slate-100 transition group"
            title="Click to switch recipient from dataset"
          >
            <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
              {transaction.recipient_name}
            </h2>
            <div className="w-4 h-4 rounded-full bg-[#00BAF2] flex items-center justify-center text-white shadow-xs">
              <Check className="w-2.5 h-2.5 stroke-[3.5]" />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
          </button>

          {/* Subtitle matching Screenshot */}
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Verified Name, A/c Linked on {transaction.is_known_recipient ? "Paytm" : "PhonePe"}
          </p>
        </div>

        {/* Center Amount Display */}
        <div className="text-center my-5 px-4">
          <div className="flex items-start justify-center gap-1 text-slate-900">
            <span className="text-3xl font-bold text-slate-900 mt-1">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={transaction.amount > 0 ? transaction.amount.toLocaleString("en-IN") : ""}
              onChange={handleManualInputChange}
              placeholder="0"
              className="text-5xl font-extrabold tracking-tight text-slate-900 font-sans text-center bg-transparent border-b-2 border-transparent focus:border-cyan-400 focus:outline-none max-w-[280px] px-1"
            />
          </div>

          {/* Warning / In-Words section matching Screenshot */}
          {isExceedingLimit ? (
            <div className="mt-2 text-center animate-fadeIn">
              <p className="text-xs font-bold text-red-600 leading-tight">
                You can only send upto Rs. 1,00,000 at a time by UPI.
              </p>
              <p className="text-xs font-bold text-red-600 leading-tight mt-0.5">
                Please enter a lower amount.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium mt-2">
              {amountInWords}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Section: Category Chips + Proceed Button + Keypad */}
      <div className="flex flex-col">
        {/* Horizontal Category Chips Row matching Screenshot */}
        <div className="px-4 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2.5">
          {TAGS.map((tag) => (
            <button
              key={tag.id}
              onClick={() => {
                setSelectedTag(tag.id);
                if (onSelectTag) onSelectTag(tag.id);
              }}
              className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full transition flex items-center gap-1 ${
                tag.isDashed
                  ? "border border-dashed border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                  : selectedTag === tag.id
                  ? "bg-blue-50 border border-[#002E6E] text-[#002E6E]"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Deep Royal Blue "Proceed Securely" Button matching Screenshot */}
        <div className="px-4 pb-2">
          <button
            onClick={onProceedToPay}
            disabled={isLoading || transaction.amount <= 0 || isExceedingLimit}
            className="w-full bg-[#002E6E] hover:bg-[#002559] active:scale-[0.99] text-white font-bold py-3.5 rounded-full shadow-md flex items-center justify-center gap-2 text-sm tracking-wide transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Shield className="w-4 h-4 text-cyan-300 stroke-[2.5]" />
                <span>Proceed Securely</span>
              </>
            )}
          </button>
        </div>

        {/* Authentic Numeric Keypad matching user's exact Screenshot Layout */}
        <div className="bg-[#F8FAFC] pt-2 pb-3 px-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-slate-900">
          {/* Row 1: 1, 2, 3 */}
          <button onClick={() => handleKeyClick("1")} className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 shadow-xs flex items-center justify-center font-black text-xl text-slate-900 transition">1</button>
          <button onClick={() => handleKeyClick("2")} className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 shadow-xs flex items-center justify-center font-black text-xl text-slate-900 transition">2</button>
          <button onClick={() => handleKeyClick("3")} className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 shadow-xs flex items-center justify-center font-black text-xl text-slate-900 transition">3</button>

          {/* Row 2: 4, 5, 6 */}
          <button onClick={() => handleKeyClick("4")} className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 shadow-xs flex items-center justify-center font-black text-xl text-slate-900 transition">4</button>
          <button onClick={() => handleKeyClick("5")} className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 shadow-xs flex items-center justify-center font-black text-xl text-slate-900 transition">5</button>
          <button onClick={() => handleKeyClick("6")} className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 shadow-xs flex items-center justify-center font-black text-xl text-slate-900 transition">6</button>

          {/* Row 3: 7, 8, 9 */}
          <button onClick={() => handleKeyClick("7")} className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 shadow-xs flex items-center justify-center font-black text-xl text-slate-900 transition">7</button>
          <button onClick={() => handleKeyClick("8")} className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 shadow-xs flex items-center justify-center font-black text-xl text-slate-900 transition">8</button>
          <button onClick={() => handleKeyClick("9")} className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 shadow-xs flex items-center justify-center font-black text-xl text-slate-900 transition">9</button>

          {/* Row 4: +, ., 0, ⌫ */}
          <div className="col-span-3 grid grid-cols-4 gap-1.5">
            <button onClick={() => handleKeyClick("+")} className="h-11 rounded-2xl bg-blue-50/80 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 text-[#002E6E] font-black text-xl flex items-center justify-center transition">+</button>
            <button onClick={() => handleKeyClick(".")} className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 font-black text-2xl text-slate-900 flex items-center justify-center transition">.</button>
            <button onClick={() => handleKeyClick("0")} className="h-11 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 font-black text-xl text-slate-900 flex items-center justify-center transition">0</button>
            <button onClick={() => handleKeyClick("BACKSPACE")} className="h-11 rounded-2xl bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white flex items-center justify-center transition shadow-xs">
              <Delete className="w-5 h-5 fill-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Recipient Picker Sheet / Modal */}
      {showPayeeDrawer && (
        <div className="absolute inset-0 bg-black/50 z-40 backdrop-blur-xs flex flex-col justify-end animate-fadeIn">
          <div className="bg-white rounded-t-3xl p-4 max-h-[80%] overflow-y-auto shadow-2xl border-t border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#002E6E]" />
                <h3 className="font-extrabold text-sm text-slate-900">Select Payee (Dataset)</h3>
              </div>
              <button
                onClick={() => setShowPayeeDrawer(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 p-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {payeesList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (onSelectPayee) onSelectPayee(p);
                    if (p.regular_amount > 0) onAmountChange(p.regular_amount);
                    setShowPayeeDrawer(false);
                  }}
                  className="w-full py-2.5 px-1.5 flex items-center justify-between text-left hover:bg-blue-50/60 rounded-xl transition group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                      style={{ backgroundColor: p.avatar_color, color: "#1e293b" }}
                    >
                      {p.avatar_initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{p.name}</span>
                        {p.is_regular && (
                          <span className="w-3.5 h-3.5 rounded-full bg-[#00BAF2] text-white flex items-center justify-center text-[9px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-mono">{p.upi}</span>
                      <span className="text-[10px] text-slate-600 block mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-400" /> {p.regular_time}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {p.regular_amount > 0 ? (
                      <>
                        <span className="font-extrabold text-xs text-slate-900 block font-mono">
                          ₹{p.regular_amount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          {p.frequency}
                        </span>
                      </>
                    ) : (
                      <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                        New Payee
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
