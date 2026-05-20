export interface Action {
  id: string;
  type: 'call' | 'email' | 'sms' | 'research';
  account: string;
  contact: string | null;
  phone: string | null;
  product: string | null;
  reason: string;
  supporting: string;
  revenue: [number, number] | null;
  time: number;
}

export interface QueueResponse {
  actions: Action[];
  current_index: number;
  quota: number | null;
}

export interface OutcomeRequest {
  action_id: string;
  outcome: 'completed' | 'no_answer' | 'voicemail' | 'callback' | 'not_relevant';
  note?: string;
  revenue?: number;
}

export interface SnoozeRequest {
  hours: number;
}

export interface HealthResponse {
  status: string;
  version?: string;
}
