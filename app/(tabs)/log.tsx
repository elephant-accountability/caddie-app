import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { VoiceCapture } from '../../src/components/VoiceCapture';
import { api } from '../../src/api/client';

export default function LogScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showText, setShowText] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      anim.start();
      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
      return () => {
        anim.stop();
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      pulse.setValue(1);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microphone access needed', 'Enable mic access in Settings to record voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setRecordingDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (err) {
      Alert.alert('Recording failed', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        // TODO: send to transcription endpoint, then ingest
        // For now, log that we captured audio
        Alert.alert(
          'Voice captured',
          `${recordingDuration}s recorded. Transcription coming in v1.1 — use text input for now.`,
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save recording.');
    }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Log a touch</Text>
        <Text style={styles.subtitle}>
          Voice capture or quick text note
        </Text>

        {/* Voice recording button */}
        <View style={styles.micSection}>
          <Animated.View style={[
            styles.micRing,
            isRecording && { transform: [{ scale: pulse }] },
          ]}>
            <Pressable
              style={[styles.micBtn, isRecording && styles.micBtnActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={32}
                color={isRecording ? colors.danger : '#fff'}
              />
            </Pressable>
          </Animated.View>
          <Text style={styles.micLabel}>
            {isRecording
              ? formatDuration(recordingDuration)
              : 'Tap to record'
            }
          </Text>
          {isRecording && (
            <Text style={styles.micHint}>Tap again to stop</Text>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or type it</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Text capture */}
        <VoiceCapture
          placeholder='"Just called Jesse, he wants the LPM demo next Tuesday"'
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingTop: 16 },
  title: {
    fontSize: sizes.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: sizes.base,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 30,
  },
  micSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  micRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.danger + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: colors.danger + '30',
  },
  micLabel: {
    fontSize: sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14,
  },
  micHint: {
    fontSize: sizes.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
});
