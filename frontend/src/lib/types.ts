export type RiskBand = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type PolicyAction = "ALLOW" | "INFORM" | "CONFIRM" | "ESCALATE";

export interface SignalContribution {
  name: string;
  display_name: string;
  score: number;
  max_points: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  reason_hi?: string;
}

export interface IntentContextData {
  category: string;
  free_text?: string;
  extracted_relationship?: string;
  confidence: number;
}

export interface TransactionData {
  transaction_id: string;
  user_id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_upi: string;
  amount: number;
  timestamp?: string;
  device_id: string;
  location_region: string;
  is_known_recipient?: boolean;
  is_known_device?: boolean;
  failed_attempts_recent?: number;
}

export interface RegularPayee {
  id: string;
  name: string;
  upi: string;
  avatar_initials: string;
  avatar_color: string;
  regular_amount: number;
  regular_time: string;
  frequency: string;
  category: string;
  tx_count: number;
  is_regular: boolean;
  verified_on: string;
}

export interface RiskEvaluationResponse {
  event_id: string;
  user_id: string;
  transaction_id: string;
  risk_score: number;
  risk_band: RiskBand;
  policy_action: PolicyAction;
  signals: SignalContribution[];
  reason_codes: string[];
  explanation_en: string;
  explanation_hi: string;
  model_anomaly_score: number;
  policy_version: string;
  evaluated_at: string;
  latency_ms: number;
  is_simulation: boolean;
  disclaimer: string;
}

export interface TrustedPattern {
  pattern_id: string;
  title: string;
  category: string;
  typical_amount: number;
  frequency: string;
  recipient_id?: string;
  status: string;
}

export interface UserProfile {
  user_id: string;
  name: string;
  persona: string;
  upi_handle: string;
  median_amount: number;
  mad_amount: number;
  p90_amount: number;
  p95_amount: number;
  max_amount: number;
  usual_start_hour: number;
  usual_end_hour: number;
  known_recipient_count: number;
  known_device_count: number;
  usual_regions: string[];
  transaction_count: number;
  profile_status: string;
  trusted_patterns: TrustedPattern[];
  simulation: boolean;
}

export interface IntentExtractResponse {
  category: string;
  category_display: string;
  extracted_relationship?: string;
  extracted_keywords: string[];
  confidence: number;
  context_note: string;
}

export interface RiskEventSummary {
  event_id: string;
  transaction_id: string;
  user_id: string;
  user_name: string;
  recipient_name: string;
  amount: number;
  risk_score: number;
  risk_band: RiskBand;
  policy_action: PolicyAction;
  evaluated_at: string;
  latency_ms: number;
}

export interface DashboardMetrics {
  transactions_evaluated: number;
  warnings_shown: number;
  simulated_cancellations: number;
  simulated_continuations: number;
  escalations_triggered: number;
  avg_evaluation_latency_ms: number;
  risk_distribution: Record<RiskBand, number>;
  recent_events: RiskEventSummary[];
  is_simulation: boolean;
  note: string;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  tag: string;
  user_id: string;
  description: string;
  transaction: TransactionData;
  expected_risk_band: RiskBand;
  expected_action: PolicyAction;
  expected_score_range: [number, number];
  intent_context?: {
    category: string;
    free_text: string;
  };
}
