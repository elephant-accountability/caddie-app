/**
 * CallSamButton — floating phone button that calls Sam.
 *
 * Tap        → In-app VoIP call via Vapi SDK (toggles to hang-up while active).
 * Long-press → Phone call via POST /api/call-sam (Sam calls your phone).
 *
 * Shows status: idle → connecting/calling → active/connected.
 * Green pulsing button + end-call icon when an in-app call is active.
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useVapi } from '../hooks/useVapi';

type PhoneCallState = 'idle' | 'calling' | 'error';

const colors = {
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  red: '#EF4444',
  green: '#22C55E',
  dark: '#1C1C1E',
  gray: '#6B7280',
  white: '#FFFFFF',
};

export default function CallSamButton() {
  // Phone-call state (long-press path)
  const [phoneState, setPhoneState] = useState<PhoneCallState>('idle');
  const [message, setMessage] = useState('');

  // In-app VoIP state (tap path)
  const { callState: vapiState, isActive, isConnecting, startCall, endCall } = useVapi();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = () => {
    pulseLoopRef.current?.stop();
    pulseAnim.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoopRef.current = loop;
    loop.start();
  };

  const stopPulse = () => {
    pulseLoopRef.current?.stop();
    pulseLoopRef.current = null;
    pulseAnim.setValue(1);
  };

  const showMessage = (msg: string, durationMs = 3000) => {
    setMessage(msg);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(durationMs),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setMessage(''));
  };

  // ── Tap: Try VoIP first, auto-fallback to phone call on poor connectivity ──
  const fallbackToPhone = useCallback(async () => {
    showMessage('Weak signal — Sam is calling your phone…', 5000);
    setPhoneState('calling');
    try {
      const result = await api.callSam();
      if (result.status === 'calling') {
        setTimeout(() => { setPhoneState('idle'); stopPulse(); }, 6000);
      } else {
        setPhoneState('error');
        showMessage(result.message || 'Call failed', 3000);
        setTimeout(() => { setPhoneState('idle'); stopPulse(); }, 3000);
      }
    } catch {
      setPhoneState('error');
      showMessage('Could not reach Sam', 3000);
      setTimeout(() => { setPhoneState('idle'); stopPulse(); }, 3000);
    }
  }, []);

  const handlePress = useCallback(async () => {
    if (isActive || isConnecting) {
      // End the in-app call
      endCall();
      stopPulse();
      showMessage('Call ended');
      return;
    }

    if (phoneState === 'calling') return; // phone call in progress

    startPulse();

    // Check connectivity — skip VoIP entirely if offline or cellular-only with poor signal
    const netState = await NetInfo.fetch();
    const hasGoodConnection = netState.isConnected && netState.type === 'wifi';

    if (!hasGoodConnection) {
      // Poor or no WiFi — go straight to phone call
      await fallbackToPhone();
      return;
    }

    // Try VoIP first
    showMessage('Connecting…', 5000);
    try {
      await startCall();
      // 'call-start' event on Vapi will flip isActive → true
    } catch {
      // VoIP failed (timeout, SDK error, poor connectivity) — fallback to phone
      await fallbackToPhone();
    }
  }, [isActive, isConnecting, phoneState, startCall, endCall, fallbackToPhone]);

  // ── Long-press: phone call via API ──
  const handleLongPress = useCallback(async () => {
    if (isActive || isConnecting) return; // don't mix modes
    if (phoneState === 'calling') return;

    setPhoneState('calling');
    startPulse();

    try {
      const result = await api.callSam();
      if (result.status === 'calling') {
        showMessage('Sam is calling your phone…', 5000);
        setTimeout(() => {
          setPhoneState('idle');
          stopPulse();
        }, 6000);
      } else {
        setPhoneState('error');
        showMessage(result.message || 'Call failed', 3000);
        setTimeout(() => { setPhoneState('idle'); stopPulse(); }, 3000);
      }
    } catch {
      setPhoneState('error');
      showMessage('Could not reach Sam', 3000);
      setTimeout(() => { setPhoneState('idle'); stopPulse(); }, 3000);
    }
  }, [isActive, isConnecting, phoneState]);

  // Derived visual state
  const isBusy = isActive || isConnecting || phoneState === 'calling';
  const isPulsing = isBusy;
  const isError = vapiState === 'error' || phoneState === 'error';

  // Keep pulse in sync with Vapi state changes
  React.useEffect(() => {
    if (isActive || isConnecting) {
      startPulse();
    } else if (vapiState === 'idle' && phoneState === 'idle') {
      stopPulse();
    }
  }, [isActive, isConnecting, vapiState, phoneState]);

  // Button colour
  const buttonStyle = isError
    ? styles.buttonError
    : isActive
      ? styles.buttonActive
      : isConnecting
        ? styles.buttonConnecting
        : phoneState === 'calling'
          ? styles.buttonCalling
          : undefined;

  // Icon
  const iconName = isActive
    ? 'call-sharp'       // filled "end call" look
    : isConnecting
      ? 'call'
      : 'call-outline';

  const accessLabel = isActive
    ? 'End call with Sam'
    : isConnecting
      ? 'Connecting to Sam…'
      : phoneState === 'calling'
        ? 'Sam is calling your phone…'
        : 'Tap to call Sam in-app, hold for phone call';

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Status message */}
      {message ? (
        <Animated.View style={[styles.messageBubble, { opacity: fadeAnim }]}>
          <Text style={styles.messageText}>{message}</Text>
        </Animated.View>
      ) : null}

      {/* Call button */}
      <Animated.View style={{ transform: [{ scale: isPulsing ? pulseAnim : 1 }] }}>
        <TouchableOpacity
          style={[styles.button, buttonStyle]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
          activeOpacity={0.7}
          accessibilityLabel={accessLabel}
        >
          <Ionicons
            name={iconName}
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    alignItems: 'center',
    zIndex: 50,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonActive: {
    backgroundColor: colors.green,
  },
  buttonConnecting: {
    backgroundColor: colors.blueLight,
  },
  buttonCalling: {
    backgroundColor: colors.green,
  },
  buttonError: {
    backgroundColor: colors.red,
  },
  messageBubble: {
    backgroundColor: colors.dark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 10,
    maxWidth: 200,
  },
  messageText: {
    color: colors.white,
    fontSize: 13,
    textAlign: 'center',
  },
});
