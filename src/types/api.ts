export type ActionType = 'call' | 'email' | 'sms' | 'research';
export type OutcomeType = 'completed' | 'no_answer' | 'voicemail' | 'callback' | 'not_relevant';

export interface Action {
  id: string;
  type: ActionType;
  account: string;
  contact: string | null;
  phone: string | null;
  product: string | null;
  reason: string;
  supporting: string;
  revenue: [number, number] | null;
  time: number;
}

export interface Quota {
  target: number;
  ytd: number;
  attainment_pct: number;
  pace_status: string;
}

export interface QueueResponse {
  actions: Action[];
  current_index: number;
  quota: Quota | null;
}

export interface OutcomeRequest {
  action_id: string;
  outcome: OutcomeType;
  note?: string;
  revenue?: number;
}

export interface OutcomeResponse {
  status: string;
  outcome_logged: boolean;
  next_action: Record<string, unknown> | null;
  current_index: number;
  queue_remaining: number;
}

export interface DraftResponse {
  email: { subject: string; body: string } | null;
  sms: { body: string } | null;
}

export interface HealthResponse {
  status: string;
  version?: string;
  queue_cached?: boolean;
  db_connected?: boolean;
}
