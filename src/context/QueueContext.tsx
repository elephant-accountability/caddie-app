import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load queue');
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
    try {
      const result = await api.submitOutcome({
        action_id: currentAction.id,
        outcome,
        note,
      });
      setCurrentIndex(result.current_index ?? currentIndex + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log outcome');
    } finally {
      setMutating(false);
    }
  }, [currentAction, mutating, currentIndex]);

  const skip = useCallback(async () => {
    if (mutating) return;
    setMutating(true);
    setError(null);
    try {
      await api.skip();
      setCurrentIndex(i => i + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to skip');
    } finally {
      setMutating(false);
    }
  }, [mutating]);

  const snooze = useCallback(async (hours: number = 4) => {
    if (mutating) return;
    setMutating(true);
    setError(null);
    try {
      await api.snooze(hours);
      setCurrentIndex(i => i + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to snooze');
    } finally {
      setMutating(false);
    }
  }, [mutating]);

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
