/**
 * Outbox flush — sends pending skip/outcome/snooze items to the server.
 * Call before refresh to ensure server state is up-to-date.
 */
import { getPendingOutbox, markOutboxDone, markOutboxError } from './db';
import { api } from '../api/client';

interface OutboxRow {
  id: string;
  type: string;
  payload_json: string;
  attempt_count: number;
}

export async function flushOutbox(): Promise<number> {
  const pending = (await getPendingOutbox()) as OutboxRow[];
  if (!pending || pending.length === 0) return 0;

  let flushed = 0;

  for (const item of pending) {
    try {
      const payload = JSON.parse(item.payload_json);

      switch (item.type) {
        case 'outcome':
          await api.submitOutcome({
            action_id: payload.action_id,
            outcome: payload.outcome,
            note: payload.note,
          });
          break;
        case 'skip':
          await api.skip(payload.action_id);
          break;
        case 'snooze':
          await api.snooze(payload.action_id, payload.hours);
          break;
        default:
          console.warn(`Unknown outbox type: ${item.type}`);
      }

      await markOutboxDone(item.id);
      flushed++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      await markOutboxError(item.id, msg, item.attempt_count);
    }
  }

  return flushed;
}
