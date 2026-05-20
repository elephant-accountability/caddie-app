import { useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import type { Action, QueueResponse } from '../types/api';

export function useQueue() {
  const [actions, setActions] = useState<Action[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getQueue();
      setActions(data.actions);
      setCurrentIndex(data.current_index);
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
  const remaining = actions.length - currentIndex;

  const complete = useCallback(async (outcome: string, note?: string) => {
    if (!currentAction) return;
    await api.submitOutcome({
      action_id: currentAction.id,
      outcome: outcome as any,
      note,
    });
    setCurrentIndex(i => i + 1);
  }, [currentAction]);

  const skip = useCallback(async () => {
    await api.skip();
    setCurrentIndex(i => i + 1);
  }, []);

  const snooze = useCallback(async (hours: number = 4) => {
    await api.snooze(hours);
    setCurrentIndex(i => i + 1);
  }, []);

  return {
    actions,
    currentAction,
    currentIndex,
    remaining,
    loading,
    error,
    refresh,
    complete,
    skip,
    snooze,
  };
}
