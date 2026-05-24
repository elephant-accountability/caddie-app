/**
 * useVapi — React hook wrapping the Vapi React Native SDK for in-app VoIP calls.
 *
 * Provides startCall / endCall / isActive for use in UI components.
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import Constants from 'expo-constants';
import Vapi from '@vapi-ai/react-native';

const VAPI_PUBLIC_KEY =
  Constants.expoConfig?.extra?.vapiPublicKey ??
  process.env.EXPO_PUBLIC_VAPI_KEY ??
  '46d95a26-6cd4-4aa6-8776-0f9c6f1f5cde';

const DEFAULT_ASSISTANT_ID = '0578792c-d94f-42e6-a25f-cd4cf137c941';

export type VapiCallState = 'idle' | 'connecting' | 'active' | 'error';

export function useVapi() {
  const vapiRef = useRef<Vapi | null>(null);
  const [callState, setCallState] = useState<VapiCallState>('idle');

  // Lazily initialise the Vapi singleton
  const getVapi = useCallback(() => {
    if (!vapiRef.current) {
      vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);
    }
    return vapiRef.current;
  }, []);

  // Wire up event listeners once
  useEffect(() => {
    const vapi = getVapi();

    const onCallStart = () => setCallState('active');
    const onCallEnd = () => setCallState('idle');
    const onError = (_err: any) => {
      console.warn('[useVapi] error', _err);
      setCallState('error');
      // Auto-reset after a short delay
      setTimeout(() => setCallState('idle'), 3000);
    };

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('error', onError);

    return () => {
      vapi.removeListener('call-start', onCallStart);
      vapi.removeListener('call-end', onCallEnd);
      vapi.removeListener('error', onError);
    };
  }, [getVapi]);

  const startCall = useCallback(
    async (assistantId: string = DEFAULT_ASSISTANT_ID) => {
      if (callState === 'connecting' || callState === 'active') return;
      setCallState('connecting');
      try {
        // Race VoIP start against a timeout — poor connectivity fails fast
        const VOIP_TIMEOUT_MS = 10_000;
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('VoIP connection timeout')), VOIP_TIMEOUT_MS),
        );
        await Promise.race([getVapi().start(assistantId), timeout]);
        // 'call-start' event will flip state to 'active'
      } catch (err) {
        console.warn('[useVapi] startCall failed', err);
        setCallState('error');
        // Don't auto-reset — let the caller decide (fallback to phone)
        throw err;
      }
    },
    [callState, getVapi],
  );

  const endCall = useCallback(() => {
    try {
      getVapi().stop();
    } catch {
      // already stopped
    }
    setCallState('idle');
  }, [getVapi]);

  const isActive = callState === 'active';
  const isConnecting = callState === 'connecting';

  return {
    callState,
    isActive,
    isConnecting,
    startCall,
    endCall,
  };
}
