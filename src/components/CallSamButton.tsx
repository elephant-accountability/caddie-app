/**
 * CallSamButton — floating phone button that calls Sam.
 *
 * Tap → Sam calls your phone via Vapi outbound call.
 * Smart connectivity: shows "weak signal" warning on cellular/offline
 * but still attempts the call (Vapi handles the actual phone connection).
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
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';

type CallState = 'idle' | 'calling' | 'error';

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
  const [state, setState] = useState<CallState>('idle');
  const [message, setMessage] = useState('');
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

  const handlePress = useCallback(async () => {
    if (state === 'calling') return; // prevent double-tap

    setState('calling');
    startPulse();
    showMessage('Calling Sam…', 5000);

    try {
      const result = await api.callSam();
      if (result.status === 'calling') {
        showMessage('Sam is calling you…', 5000);
        setTimeout(() => {
          setState('idle');
          stopPulse();
        }, 6000);
      } else {
        setState('error');
        showMessage(result.message || 'Call failed', 3000);
        setTimeout(() => { setState('idle'); stopPulse(); }, 3000);
      }
    } catch {
      setState('error');
      showMessage('Could not reach Sam', 3000);
      setTimeout(() => { setState('idle'); stopPulse(); }, 3000);
    }
  }, [state]);

  const buttonStyle = state === 'error'
    ? styles.buttonError
    : state === 'calling'
      ? styles.buttonCalling
      : undefined;

  const iconName = state === 'calling' ? 'call' : 'call-outline';

  const accessLabel = state === 'calling'
    ? 'Sam is calling…'
    : 'Call Sam';

  return (
    <View style={styles.container} pointerEvents="box-none">
      {message ? (
        <Animated.View style={[styles.messageBubble, { opacity: fadeAnim }]}>
          <Text style={styles.messageText}>{message}</Text>
        </Animated.View>
      ) : null}

      <Animated.View style={{ transform: [{ scale: state === 'calling' ? pulseAnim : 1 }] }}>
        <TouchableOpacity
          style={[styles.button, buttonStyle]}
          onPress={handlePress}
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
