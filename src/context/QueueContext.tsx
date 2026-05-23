import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';
import { enqueueOutcome, enqueueSkip, enqueueSnooze, saveQueueCache, loadQueueCache } from '../offline/db';
import type { Action, QueueResponse, OutcomeType, Quota } from '../types/api';

interface QueueContextType {
  actions: Action[];
  currentAction: Action | null;
  currentIndex: number;
  remaining: number;
  quota: Quota | null;
  loading: boolean;
  error: string | null;
  mutating: boolean;
  refresh: () => Promise<void>;
  complete: (outcome: OutcomeType, note?: string) => Promise<void>;
  skip: () => Promise<void>;
  snooze: (hours?: number) => Promise<void>;
  /** Act on any action by reference (removes from array, fires API) */
  skipAction: (action: Action) => Promise<void>;
  snoozeAction: (action: Action, hours?: number) => Promise<void>;
  completeAction: (action: Action, outcome: OutcomeType, note?: string) => Promise<void>;
}

const QueueContext = createContext<QueueContextType | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<Action[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getQueue();
      setActions(data.actions);
      setCurrentIndex(data.current_index);
      setQuota(data.quota);
      // Cache for offline
      await saveQueueCache(data, 'current');
    } catch (e) {
      // Try offline cache fallback
      try {
        const cached = await loadQueueCache();
        if (cached) {
          setActions(cached.actions || []);
          setCurrentIndex(cached.current_index || 0);
          setQuota(cached.quota || null);
          setError('Offline mode — showing cached queue');
        } else {
          setError(e instanceof Error ? e.message : 'Failed to load queue');
        }
      } catch {
        setError(e instanceof Error ? e.message : 'Failed to load queue');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const currentAction = actions[currentIndex] ?? null;
  const remaining = Math.max(0, actions.length - currentIndex);

  const complete = useCallback(async (outcome: OutcomeType, note?: string) => {
    if (!currentAction || mutating) return;
    setMutating(true);
    setError(null);
    // Advance immediately — optimistic update
    setCurrentIndex(i => i + 1);
    try {
      await enqueueOutcome(currentAction.id, outcome, note);
      api.submitOutcome({
        action_id: currentAction.id,
        outcome,
        note,
      }).catch(() => {}); // fire-and-forget, outbox retries
    } catch {
      // Already advanced
    } finally {
      setMutating(false);
    }
  }, [currentAction, mutating]);

  const skip = useCallback(async () => {
    if (mutating) return;
    setMutating(true);
    setError(null);
    // Advance immediately — optimistic update
    setCurrentIndex(i => i + 1);
    try {
      if (currentAction) {
        await enqueueSkip(currentAction.id);
      }
      api.skip(currentAction?.id).catch(() => {}); // fire-and-forget
    } catch {
      // Already advanced — outbox will retry
    } finally {
      setMutating(false);
    }
  }, [mutating, currentAction]);

  const snooze = useCallback(async (hours: number = 4) => {
    if (mutating) return;
    setMutating(true);
    setError(null);
    // Advance immediately — optimistic update
    setCurrentIndex(i => i + 1);
    try {
      if (currentAction) {
        await enqueueSnooze(currentAction.id, hours);
      }
      api.snooze(currentAction?.id, hours).catch(() => {}); // fire-and-forget
    } catch {
      // Already advanced — outbox will retry
    } finally {
      setMutating(false);
    }
  }, [mutating, currentAction]);

  // Remove an action from the array by id (for acting on non-current items)
  const removeAction = useCallback((actionId: string) => {
    setActions(prev => {
      const idx = prev.findIndex(a => a.id === actionId);
      if (idx === -1) return prev;
      const next = prev.filter(a => a.id !== actionId);
      // If removed item was before or at currentIndex, shift index back
      if (idx < currentIndex) {
        setCurrentIndex(i => Math.max(0, i - 1));
      } else if (idx === currentIndex && currentIndex >= next.length) {
        setCurrentIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  }, [currentIndex]);

  const skipAction = useCallback(async (action: Action) => {
    removeAction(action.id);
    try {
      await enqueueSkip(action.id);
      api.skip(action.id).catch(() => {});
    } catch {}
  }, [removeAction]);

  const snoozeAction = useCallback(async (action: Action, hours: number = 4) => {
    removeAction(action.id);
    try {
      await enqueueSnooze(action.id, hours);
      api.snooze(action.id, hours).catch(() => {});
    } catch {}
  }, [removeAction]);

  const completeAction = useCallback(async (action: Action, outcome: OutcomeType, note?: string) => {
    removeAction(action.id);
    try {
      await enqueueOutcome(action.id, outcome, note);
      api.submitOutcome({ action_id: action.id, outcome, note }).catch(() => {});
    } catch {}
  }, [removeAction]);

  return (
    <QueueContext.Provider value={{
      actions,
      currentAction,
      currentIndex,
      remaining,
      quota,
      loading,
      error,
      mutating,
      refresh,
      complete,
      skip,
      snooze,
      skipAction,
      snoozeAction,
      completeAction,
    }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue(): QueueContextType {
  const ctx = useContext(QueueContext);
  if (!ctx) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return ctx;
}
