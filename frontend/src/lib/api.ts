import {
  RiskEvaluationResponse,
  UserProfile,
  IntentExtractResponse,
  DashboardMetrics,
  TransactionData,
  RegularPayee
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function getRegularPayees(): Promise<RegularPayee[]> {
  const res = await fetch(`${API_BASE}/recipients`);
  if (!res.ok) {
    throw new Error("Failed to fetch regular payees");
  }
  return res.json();
}

export async function evaluateTransaction(
  transaction: TransactionData,
  intent?: { category: string; free_text?: string }
): Promise<RiskEvaluationResponse> {
  const payload = {
    transaction_id: transaction.transaction_id || `TXN_${Date.now()}`,
    user_id: transaction.user_id || "U102",
    recipient_id: transaction.recipient_id || "R991",
    recipient_name: transaction.recipient_name || "Amit Kumar",
    recipient_upi: transaction.recipient_upi || "amit.kumar89@okaxis",
    amount: Number(transaction.amount) || 0,
    timestamp: transaction.timestamp || new Date().toISOString(),
    device_id: transaction.device_id || "DEV_UNKNOWN",
    location_region: transaction.location_region || "Mumbai",
    is_known_recipient: Boolean(transaction.is_known_recipient),
    is_known_device: Boolean(transaction.is_known_device),
    failed_attempts_recent: Number(transaction.failed_attempts_recent) || 0,
    intent: intent,
  };

  const res = await fetch(`${API_BASE}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Evaluation failed with status ${res.status}: ${errorText}`);
  }
  return res.json();
}

export async function getUserProfile(userId: string = "U102"): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/${userId}/profile`);
  if (!res.ok) {
    throw new Error(`Failed to fetch profile for user ${userId}`);
  }
  return res.json();
}

export async function extractIntent(
  freeText: string,
  transactionId?: string
): Promise<IntentExtractResponse> {
  const res = await fetch(`${API_BASE}/intent/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ free_text: freeText, transaction_id: transactionId }),
  });
  if (!res.ok) {
    throw new Error(`Intent extraction failed with status ${res.status}`);
  }
  return res.json();
}

export async function submitFeedback(payload: {
  transaction_id: string;
  user_id: string;
  user_action: string;
  is_intentional: boolean;
  note?: string;
}): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Feedback submission failed with status ${res.status}`);
  }
  return res.json();
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE}/dashboard/metrics`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard metrics`);
  }
  return res.json();
}

export async function triggerScenario(
  scenarioId: string,
  customAmount?: number
): Promise<RiskEvaluationResponse> {
  const res = await fetch(`${API_BASE}/simulation/trigger-scenario/${scenarioId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario_id: scenarioId, custom_amount: customAmount }),
  });
  if (!res.ok) {
    throw new Error(`Trigger scenario ${scenarioId} failed`);
  }
  return res.json();
}

export async function resetDemoState(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/simulation/reset`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Demo reset failed");
  }
  return res.json();
}

export async function triggerEscalationAlert(payload: {
  channel: "whatsapp" | "voice" | "sms";
  recipient_name: string;
  amount: number;
  to_phone?: string;
  user_name?: string;
  transaction_id?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/escalation/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Escalation failed: ${err}`);
  }
  return res.json();
}

export async function getEscalationStatus(): Promise<{
  is_live_configured: boolean;
  demo_user_phone: string;
  whatsapp_from: string;
  from_phone: string;
  supported_channels: string[];
}> {
  const res = await fetch(`${API_BASE}/escalation/status`);
  if (!res.ok) {
    throw new Error("Failed to fetch escalation status");
  }
  return res.json();
}

export interface EscalationSessionResponse {
  transaction_id: string;
  verification_status: "PENDING_VERIFICATION" | "VERIFYING" | "VERIFIED" | "REJECTED" | "CANCELLED" | "COMPLETED" | "EXPIRED";
  verification_method?: "WHATSAPP" | "VOICE" | "DEMO" | null;
  verification_timestamp?: string;
  verification_response?: string;
  amount?: number;
  recipient_name?: string;
  channel?: string;
  raw_input?: string;
  action_taken?: string;
  groq_decision?: "YES" | "NO" | "UNCLEAR" | null;
  groq_confidence?: number;
  groq_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getEscalationSession(transactionId?: string): Promise<EscalationSessionResponse> {
  const url = transactionId
    ? `${API_BASE}/escalation/session?transaction_id=${transactionId}`
    : `${API_BASE}/escalation/session`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch escalation session");
  }
  return res.json();
}

export async function simulateEscalationResponse(
  action: "YES" | "NO" | "UNCLEAR" | "VERIFIED" | "CANCELLED" | "REJECTED",
  channel: "voice" | "whatsapp" | "DEMO" = "DEMO",
  transactionId?: string,
  rawInput?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/escalation/simulate-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction_id: transactionId || "TXN_DEMO_D",
      action: action,
      channel: channel,
      raw_input: rawInput,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to simulate escalation response");
  }
  return res.json();
}


export async function completeVerifiedTransaction(payload: {
  transaction_id: string;
  amount?: number;
  recipient_name?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/escalation/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Transaction completion failed" }));
    throw new Error(err.detail || "Transaction completion failed");
  }
  return res.json();
}



