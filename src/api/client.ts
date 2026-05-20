import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://caddie-core.fly.dev';

class CaddieAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      throw new Error(`API ${response.status}: ${text}`);
    }

    return response.json();
  }

  // Queue
  async getQueue() {
    return this.fetch<import('../types/api').QueueResponse>('/api/queue');
  }

  // Mark action done
  async submitOutcome(data: import('../types/api').OutcomeRequest) {
    return this.fetch<{ status: string }>('/api/outcome', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Skip current action
  async skip() {
    return this.fetch<{ status: string }>('/api/skip', { method: 'POST' });
  }

  // Snooze current action
  async snooze(hours: number = 4) {
    return this.fetch<{ status: string }>('/api/snooze', {
      method: 'POST',
      body: JSON.stringify({ hours }),
    });
  }

  // Voice / text touch logging
  async ingestConversation(text: string) {
    return this.fetch<{ status: string }>('/api/conversation/ingest', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // Health check
  async health() {
    return this.fetch<import('../types/api').HealthResponse>('/api/health');
  }

  // Get action context
  async getContext(contactId: string) {
    return this.fetch<Record<string, unknown>>(`/api/context/${contactId}`);
  }

  // Get action draft (email/sms)
  async getDraft(actionId: string) {
    return this.fetch<{ draft: string }>(`/api/actions/${actionId}/draft`);
  }
}

export const api = new CaddieAPI();
