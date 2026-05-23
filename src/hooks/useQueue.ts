import { useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import type { Action, QueueResponse, OutcomeType } from '../types/api';

export function useQueue() {
  const [actions, setActions] = useState<Action[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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
      // Use server's index if available, otherwise increment locally
      setCurrentIndex(result.current_index ?? ((i: number) => i + 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log outcome');
      // Do NOT advance — card stays so user can retry
    } finally {
      setMutating(false);
    }
  }, [currentAction, mutating]);

  const skip = useCallback(async () => {
    if (mutating) return;
    setMutating(true);
    setError(null);
    try {
      const result = await api.skip(currentAction?.id);
      setCurrentIndex(i => i + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to skip');
    } finally {
      setMutating(false);
    }
  }, [currentAction, mutating]);

  const snooze = useCallback(async (hours: number = 4) => {
    if (mutating) return;
    setMutating(true);
    setError(null);
    try {
      await api.snooze(currentAction?.id, hours);
      setCurrentIndex(i => i + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to snooze');
    } finally {
      setMutating(false);
    }
  }, [currentAction, mutating]);

  return {
    actions,
    currentAction,
    currentIndex,
    remaining,
    loading,
    error,
    mutating,
    refresh,
    complete,
    skip,
    snooze,
  };
}
