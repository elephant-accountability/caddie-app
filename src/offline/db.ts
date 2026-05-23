import * as SQLite from 'expo-sqlite';
import type { Action, OutcomeType } from '../types/api';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('caddie.db');
    await initSchema(db);
  }
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempt_count INTEGER NOT NULL DEFAULT 0,
      next_attempt_at INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      last_error TEXT
    );
    
    CREATE UNIQUE INDEX IF NOT EXISTS outbox_idem_idx ON outbox(idempotency_key);
    CREATE INDEX IF NOT EXISTS outbox_status_next_idx ON outbox(status, next_attempt_at);
    
    CREATE TABLE IF NOT EXISTS queue_cache (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data_json TEXT NOT NULL,
      fetched_at INTEGER NOT NULL,
      rep_id TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS history_cache (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data_json TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS contact_cache (
      contact_id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS voice_queue (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempt_count INTEGER NOT NULL DEFAULT 0,
      next_attempt_at INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);
}

function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function enqueueOutcome(
  actionId: string,
  outcome: OutcomeType,
  note?: string,
  revenue?: number
): Promise<void> {
  const database = await getDB();
  const now = Date.now();
  const idemKey = `outcome:${actionId}:${Math.floor(now / 1000)}`;
  
  await database.runAsync(
    `INSERT OR IGNORE INTO outbox (id, type, payload_json, idempotency_key, status, attempt_count, next_attempt_at, created_at)
     VALUES (?, 'outcome', ?, ?, 'pending', 0, ?, ?)`,
    [randomUUID(), JSON.stringify({ action_id: actionId, outcome, note, revenue }), idemKey, now, now]
  );
}

export async function enqueueSkip(actionId: string): Promise<void> {
  const database = await getDB();
  const now = Date.now();
  const idemKey = `skip:${actionId}:${Math.floor(now / 1000)}`;
  
  await database.runAsync(
    `INSERT OR IGNORE INTO outbox (id, type, payload_json, idempotency_key, status, attempt_count, next_attempt_at, created_at)
     VALUES (?, 'skip', ?, ?, 'pending', 0, ?, ?)`,
    [randomUUID(), JSON.stringify({ action_id: actionId }), idemKey, now, now]
  );
}

export async function enqueueSnooze(actionId: string, hours: number): Promise<void> {
  const database = await getDB();
  const now = Date.now();
  const idemKey = `snooze:${actionId}:${Math.floor(now / 1000)}`;
  
  await database.runAsync(
    `INSERT OR IGNORE INTO outbox (id, type, payload_json, idempotency_key, status, attempt_count, next_attempt_at, created_at)
     VALUES (?, 'snooze', ?, ?, 'pending', 0, ?, ?)`,
    [randomUUID(), JSON.stringify({ action_id: actionId, hours }), idemKey, now, now]
  );
}

export async function getPendingOutbox() {
  const database = await getDB();
  const now = Date.now();
  return database.getAllAsync(
    `SELECT * FROM outbox WHERE status = 'pending' AND next_attempt_at <= ? ORDER BY created_at ASC LIMIT 10`,
    [now]
  );
}

export async function markOutboxDone(id: string): Promise<void> {
  const database = await getDB();
  await database.runAsync(`UPDATE outbox SET status = 'done' WHERE id = ?`, [id]);
}

export async function markOutboxError(id: string, error: string, attemptCount: number): Promise<void> {
  const database = await getDB();
  const nextAttempt = Date.now() + Math.min(15 * 60_000, 30_000 * (attemptCount + 1));
  await database.runAsync(
    `UPDATE outbox SET attempt_count = ?, next_attempt_at = ?, last_error = ? WHERE id = ?`,
    [attemptCount + 1, nextAttempt, error, id]
  );
}

export async function saveQueueCache(data: any, repId: string): Promise<void> {
  const database = await getDB();
  const now = Date.now();
  await database.runAsync(
    `INSERT OR REPLACE INTO queue_cache (id, data_json, fetched_at, rep_id) VALUES (1, ?, ?, ?)`,
    [JSON.stringify(data), now, repId]
  );
}

export async function loadQueueCache(): Promise<any | null> {
  const database = await getDB();
  const row = await database.getFirstAsync<{ data_json: string }>(`SELECT data_json FROM queue_cache WHERE id = 1`);
  return row ? JSON.parse(row.data_json) : null;
}

export async function saveContactCache(contactId: string, data: any): Promise<void> {
  const database = await getDB();
  const now = Date.now();
  await database.runAsync(
    `INSERT OR REPLACE INTO contact_cache (contact_id, data_json, fetched_at) VALUES (?, ?, ?)`,
    [contactId, JSON.stringify(data), now]
  );
}

export async function loadContactCache(contactId: string): Promise<any | null> {
  const database = await getDB();
  const row = await database.getFirstAsync<{ data_json: string; fetched_at: number }>(
    `SELECT data_json, fetched_at FROM contact_cache WHERE contact_id = ?`,
    [contactId]
  );
  if (!row) return null;
  // 24-hour TTL
  if (Date.now() - row.fetched_at > 24 * 60 * 60 * 1000) return null;
  return JSON.parse(row.data_json);
}

export async function getPendingOutboxCount(): Promise<number> {
  const database = await getDB();
  const row = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM outbox WHERE status = 'pending'`
  );
  return row?.count || 0;
}