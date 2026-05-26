/**
 * useCallCapture — React hook for post-call note capture.
 * 
 * Listens for 'onCallEnded' events from the native CaddieCallObserver module,
 * then prompts the user to capture notes about the call.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export interface CallEndedEvent {
  callerId: string;
  callerName: string;
  duration: number;
  incoming: boolean;
  timestamp: string;
}

export interface UseCallCaptureReturn {
  /** The most recent ended call info, if a prompt is active */
  pendingCall: CallEndedEvent | null;
  /** Whether the post-call modal should be visible */
  isModalVisible: boolean;
  /** Dismiss the modal without saving */
  dismissModal: () => void;
}

export function useCallCapture(): UseCallCaptureReturn {
  const [pendingCall, setPendingCall] = useState<CallEndedEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissModal = useCallback(() => {
    setIsModalVisible(false);
    setPendingCall(null);
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }
  }, []);

  useEffect(() => {
    // Only works on iOS
    if (Platform.OS !== 'ios') return;

    const CaddieCallObserver = NativeModules.CaddieCallObserver;
    if (!CaddieCallObserver) {
      console.warn('[useCallCapture] CaddieCallObserver native module not found');
      return;
    }

    const emitter = new NativeEventEmitter(CaddieCallObserver);

    const subscription = emitter.addListener('onCallEnded', (event: CallEndedEvent) => {
      // Only prompt for calls that lasted at least 5 seconds
      if (event.duration < 5) return;

      setPendingCall(event);
      setIsModalVisible(true);

      // Auto-dismiss after 30 seconds if no user response
      autoDismissTimer.current = setTimeout(() => {
        setIsModalVisible(false);
        setPendingCall(null);
      }, 30_000);
    });

    return () => {
      subscription.remove();
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, []);

  return { pendingCall, isModalVisible, dismissModal };
}
