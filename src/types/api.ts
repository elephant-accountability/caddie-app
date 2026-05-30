export type ActionType = 'call' | 'email' | 'sms' | 'research';
export type OutcomeType = 'completed' | 'no_answer' | 'voicemail' | 'callback' | 'not_relevant';
export type ActionCategory = 'Deal' | 'Prospect' | 'Personal' | 'Goal' | 'Stretch';
export type UrgencyLevel = 'high' | 'medium' | 'low';
export type ExecutorType = 'autonomous' | 'human';

export interface Action {
  id: string;
  type: ActionType;
  account: string;
  contact: string | null;
  contact_id?: string;
  phone: string | null;
  website: string | null;
  product: string | null;
  reason: string;
  supporting: string;
  revenue: [number, number] | null;
  time: number;
  // v2 fields
  action_type?: string;
  headline?: string;
  detail?: string;
  contact_name?: string;
  company?: string;
  evidence?: string;
  source_type?: string;
  category?: ActionCategory;
  urgency?: UrgencyLevel;
  score?: number;
  tier?: string;
  domain?: string;
  executor?: ExecutorType;
  confidence?: number;
  deadline?: string | null;
  goal_id?: string | null;
  vault_refs?: string[];
  prerequisite_card_ids?: string[];
}

export interface Quota {
  target: number;
  ytd: number;
  attainment_pct: number;
  pace_status: string;
}

export interface QueueStats {
  total: number;
  pending: number;
  acted: number;
  skipped: number;
}

export interface QueueResponse {
  actions: Action[];
  current_index: number;
  quota: Quota | null;
  stats?: QueueStats;
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

export interface AuthIssueRequest {
  rep_id: string;
  signup_secret: string;
}

export interface AuthIssueResponse {
  token: string;
  rep_id: string;
  tenant_id: string;
  expires_in: number; // seconds until expiry
}

export interface ContextResponse {
  contact_id: string;
  contact_name: string | null;
  company: string;
  role?: string;
  phone?: string;
  email?: string;
  total_revenue?: number;
  deal_count?: number;
  days_since_contact?: number;
  rsi?: number;
  products?: string[];
  why_recommended?: string;
  signals?: Array<{ type: string; description: string }>;
}

export interface AskRequest {
  question: string;
  contact_id: string;
}

export interface AskResponse {
  text: string;
  answer?: string;
  sources: Array<{ title?: string; source: string; chunk?: string }>;
}

export interface HistoryItem {
  action_id: string;
  contact_name: string;
  account_name: string;
  outcome: string;
  timestamp?: string;
}

export interface HistoryResponse {
  actions: HistoryItem[];
}

export interface QuotaResponse {
  target: number;
  ytd: number;
  attainment_pct: number;
  pace_status: string;
}

export interface ConversationIngestResponse {
  transcript?: string;
  extracted?: any[];
  stored_record_ids?: string[];
}

export interface PushTokenRequest {
  token: string;
}

export interface VaultUpload {
  id: string;
  filename?: string;
  upload_date?: string;
  chunk_count?: number;
}

export interface VaultUploadsResponse {
  uploads: VaultUpload[];
  count: number;
}

// Converse (brain chat)
export interface SuggestedAction {
  type: string;
  title: string;
  contact_id?: string;
  pattern_id?: string;
}

export interface ConverseRequest {
  text: string;
  conversation_id?: string;
  source?: 'pill' | 'voice' | 'chat';
  contact_id_hint?: string;
  mode?: 'voice' | 'text';
  intent_hint?: 'BRAINSTORM';
  pattern_id?: string;
}

export interface ConverseResponse {
  reply: string;
  intent: 'greeting' | 'question' | 'task' | 'context' | 'outcome' | 'teaching' | 'brainstorm';
  contact_id?: string;
  contact_name?: string;
  conversation_id: string;
  actions_taken: string[];
  suggested_actions: SuggestedAction[];
  confidence?: number;
  reply_type: 'answer' | 'action_list' | 'clarification' | 'error';
}
