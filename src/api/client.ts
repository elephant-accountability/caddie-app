import Constants from 'expo-constants';
import { getToken } from '../auth/tokens';
import type {
  QueueResponse, OutcomeRequest, OutcomeResponse,
  DraftResponse, HealthResponse, AuthIssueRequest, AuthIssueResponse,
  ContextResponse, AskRequest, AskResponse, HistoryResponse,
  QuotaResponse, ConversationIngestResponse, PushTokenRequest,
  VaultUploadsResponse,
  ConverseRequest, ConverseResponse,
} from '../types/api';

const API_BASE = Constants.expoConfig?.extra?.apiUrl
  || process.env.EXPO_PUBLIC_API_URL
  || 'https://caddie-core.fly.dev';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

class CaddieAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async fetchWithTimeout<T>(
    path: string,
    options: RequestInit = {},
    retries: number = 0,
  ): Promise<T> {
    const url = this.baseUrl + path;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const authHeaders = await this.getAuthHeaders();
    const headers: Record<string, string> = {
      ...authHeaders,
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMsg: string;
        try {
          const errBody = await response.json();
          errorMsg = errBody.detail || JSON.stringify(errBody);
        } catch {
          errorMsg = await response.text().catch(() => 'Unknown error');
        }
        throw new Error(errorMsg);
      }

      return response.json();
    } catch (err) {
      if (retries < MAX_RETRIES && err instanceof TypeError) {
        await new Promise(r => setTimeout(r, 1000 * (retries + 1)));
        return this.fetchWithTimeout<T>(path, options, retries + 1);
      }
      // AbortError from timeout — DOMException doesn't exist in React Native
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // Auth
  async issueToken(data: AuthIssueRequest): Promise<AuthIssueResponse> {
    return this.fetchWithTimeout<AuthIssueResponse>('/api/auth/issue', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Queue
  async getQueue(): Promise<QueueResponse> {
    return this.fetchWithTimeout<QueueResponse>('/api/queue');
  }

  // Outcome
  async submitOutcome(data: OutcomeRequest): Promise<OutcomeResponse> {
    return this.fetchWithTimeout<OutcomeResponse>('/api/outcome', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Skip
  async skip(actionId?: string): Promise<{ status: string }> {
    return this.fetchWithTimeout<{ status: string }>('/api/skip', {
      method: 'POST',
      body: JSON.stringify({ action_id: actionId }),
    });
  }

  // Snooze
  async snooze(actionId?: string, hours: number = 4): Promise<{ status: string }> {
    return this.fetchWithTimeout<{ status: string }>('/api/snooze', {
      method: 'POST',
      body: JSON.stringify({ action_id: actionId, hours }),
    });
  }

  async share(actionId: string, contactId?: string, account?: string): Promise<{ status: string; follow_up: string }> {
    return this.fetchWithTimeout<{ status: string; follow_up: string }>('/api/share', {
      method: 'POST',
      body: JSON.stringify({ action_id: actionId, contact_id: contactId, account, shared_via: 'native' }),
    });
  }

  // Context
  async getContext(contactId: string): Promise<ContextResponse> {
    return this.fetchWithTimeout<ContextResponse>(`/api/context/${contactId}`);
  }

  // Ask
  async ask(data: AskRequest): Promise<AskResponse> {
    return this.fetchWithTimeout<AskResponse>('/api/ask', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // History
  async getHistory(): Promise<HistoryResponse> {
    return this.fetchWithTimeout<HistoryResponse>('/api/history');
  }

  // Quota
  async getQuota(): Promise<QuotaResponse> {
    return this.fetchWithTimeout<QuotaResponse>('/api/quota');
  }

  // Voice / text ingest
  async ingestConversation(formData: FormData): Promise<ConversationIngestResponse> {
    return this.fetchWithTimeout<ConversationIngestResponse>('/api/conversation/ingest', {
      method: 'POST',
      body: formData,
    });
  }

  // Draft
  async getDraft(actionId: string): Promise<DraftResponse> {
    return this.fetchWithTimeout<DraftResponse>(`/api/actions/${actionId}/draft`);
  }

  // Push token
  async registerPushToken(token: string): Promise<{ status: string }> {
    return this.fetchWithTimeout<{ status: string }>('/api/push-token', {
      method: 'POST',
      body: JSON.stringify({ token } as PushTokenRequest),
    });
  }

  // Vault uploads list
  async getVaultUploads(): Promise<VaultUploadsResponse> {
    return this.fetchWithTimeout<VaultUploadsResponse>('/api/vault/uploads');
  }


  // Converse (brain chat — /api/converse)
  async converse(data: ConverseRequest): Promise<ConverseResponse> {
    return this.fetchWithTimeout<ConverseResponse>('/api/converse', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health
  async health(): Promise<HealthResponse> {
    return this.fetchWithTimeout<HealthResponse>('/api/health');
  }
}

export const api = new CaddieAPI();
