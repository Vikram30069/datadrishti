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
  const res = await fetch(`${API_BASE}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction, intent }),
  });
  if (!res.ok) {
    throw new Error(`Evaluation failed with status ${res.status}`);
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
