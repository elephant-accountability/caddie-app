import Constants from 'expo-constants';
import type {
  QueueResponse, OutcomeRequest, OutcomeResponse,
  DraftResponse, HealthResponse
} from '../types/api';

const API_BASE = Constants.expoConfig?.extra?.apiUrl
  || process.env.EXPO_PUBLIC_API_URL
  || 'https://caddie-core.fly.dev';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

class CaddieAPI {
  private baseUrl: string;
  private repId: string;

  constructor(baseUrl: string = API_BASE, repId: string = 'chris-kenney') {
    this.baseUrl = baseUrl;
    this.repId = repId;
  }

  private async fetchWithTimeout<T>(
    path: string,
    options: RequestInit = {},
    retries: number = 0,
  ): Promise<T> {
    const url = this.baseUrl + path;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const headers: Record<string, string> = {
      'X-Caddie-Rep-Id': this.repId,
      ...((options.headers as Record<string, string>) || {}),
    };

    // Only set Content-Type for JSON bodies
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
      // Retry on network errors (not 4xx/5xx)
      if (retries < MAX_RETRIES && err instanceof TypeError) {
        await new Promise(r => setTimeout(r, 1000 * (retries + 1)));
        return this.fetchWithTimeout<T>(path, options, retries + 1);
      }
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // Queue
  async getQueue(): Promise<QueueResponse> {
    return this.fetchWithTimeout<QueueResponse>('/api/queue');
  }

  // Mark action done
  async submitOutcome(data: OutcomeRequest): Promise<OutcomeResponse> {
    return this.fetchWithTimeout<OutcomeResponse>('/api/outcome', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Skip current action
  async skip(): Promise<{ status: string }> {
    return this.fetchWithTimeout<{ status: string }>('/api/skip', { method: 'POST' });
  }

  // Snooze current action
  async snooze(hours: number = 4): Promise<{ status: string }> {
    return this.fetchWithTimeout<{ status: string }>('/api/snooze', {
      method: 'POST',
      body: JSON.stringify({ hours }),
    });
  }

  // Voice / text touch logging — backend expects FormData, not JSON
  async ingestConversation(text: string): Promise<{ status: string }> {
    const formData = new FormData();
    formData.append('text', text);
    return this.fetchWithTimeout<{ status: string }>('/api/conversation/ingest', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type — fetch auto-sets multipart boundary
    });
  }

  // Health check
  async health(): Promise<HealthResponse> {
    return this.fetchWithTimeout<HealthResponse>('/api/health');
  }

  // Get action context
  async getContext(contactId: string): Promise<Record<string, unknown>> {
    return this.fetchWithTimeout<Record<string, unknown>>('/api/context/' + contactId);
  }

  // Get action draft (email/sms)
  async getDraft(actionId: string): Promise<DraftResponse> {
    return this.fetchWithTimeout<DraftResponse>('/api/actions/' + actionId + '/draft');
  }
}

export const api = new CaddieAPI();
