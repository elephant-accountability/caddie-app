import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import { api } from '../api/client';

/**
 * Persistent floating input — always visible above the tab bar.
 * Tap pill → expand. Mic button → hold to record, release to send.
 * Text fallback always available.
 */
export function FloatingInput() {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false); // brief checkmark on pill
  const inputRef = useRef<TextInput>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (expanded && !recording) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [expanded, fadeAnim, recording]);

  const showConfirmation = () => {
    // Double haptic — unmistakable
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
    setExpanded(false);
    setConfirmed(true);
    setText('');
    setFeedback(null);
    setTimeout(() => setConfirmed(false), 2000);
  };

  // --- Text submit ---
  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append('text', trimmed);
      await api.ingestConversation(fd);
      showConfirmation();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedback(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Voice recording ---
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setFeedback('Mic permission needed');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = rec;
      setRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      setFeedback('Could not start recording');
    }
  };

  const stopAndSend = async () => {
    if (!recordingRef.current) return;
    setRecording(false);
    setSubmitting(true);
    setFeedback(null);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        setFeedback('No audio captured');
        setSubmitting(false);
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const fd = new FormData();
      fd.append('audio', {
        uri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as any);
      fd.append('source', 'manual');
      await api.ingestConversation(fd);
      showConfirmation();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedback(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setRecording(false);
    Keyboard.dismiss();
    setExpanded(false);
    setText('');
    setFeedback(null);
  };

  // --- Collapsed pill ---
  if (!expanded) {
    return (
      <View style={styles.pillContainer}>
        <Pressable
          style={[styles.pill, confirmed && styles.pillConfirmed]}
          onPress={() => !confirmed && setExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel="Talk to Caddie"
        >
          <Ionicons
            name={confirmed ? 'checkmark' : 'mic'}
            size={20}
            color={confirmed ? colors.forest : colors.white}
          />
          <Text style={[styles.pillText, confirmed && styles.pillTextConfirmed]}>
            {confirmed ? 'Got it' : 'Caddie'}
          </Text>
        </Pressable>
      </View>
    );
  }

  // --- Expanded input ---
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
      style={styles.expandedContainer}
    >
      <Animated.View style={[styles.expandedCard, { opacity: fadeAnim }]}>
        {feedback && (
          <Text style={styles.feedback}>{feedback}</Text>
        )}

        {submitting ? (
          <View style={styles.processingRow}>
            <ActivityIndicator size="small" color={colors.textSecondary} />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        ) : recording ? (
          <View style={styles.recordingRow}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording... tap mic to send</Text>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          {!recording && (
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Tell Caddie..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={2000}
              blurOnSubmit={false}
              onSubmitEditing={handleSubmit}
            />
          )}
          {recording && (
            <View style={styles.recordingFill} />
          )}
          <View style={styles.btnCol}>
            {/* Mic / stop button */}
            <Pressable
              style={[styles.micBtn, recording && styles.micBtnRecording]}
              onPress={recording ? stopAndSend : startRecording}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel={recording ? 'Stop and send recording' : 'Start voice recording'}
            >
              <Ionicons
                name={recording ? 'stop' : 'mic'}
                size={20}
                color={recording ? colors.rust : colors.white}
              />
            </Pressable>
            {/* Send text button (only when text entered, not recording) */}
            {!recording && text.trim() ? (
              <Pressable
                style={[styles.sendBtn, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Send text to Caddie"
              >
                <Ionicons name="arrow-up" size={20} color={colors.white} />
              </Pressable>
            ) : null}
            {/* Close */}
            <Pressable
              style={styles.closeBtn}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close input"
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.navyLight,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pillText: {
    color: colors.white,
    fontSize: sizes.sm,
    fontWeight: '700',
  },
  pillConfirmed: {
    backgroundColor: colors.forest + '30',
    borderWidth: 1,
    borderColor: colors.forest,
  },
  pillTextConfirmed: {
    color: colors.forest,
  },
  expandedContainer: {
    position: 'absolute',
    bottom: 90,
    left: 12,
    right: 12,
    zIndex: 100,
  },
  expandedCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  feedback: {
    fontSize: sizes.sm,
    fontWeight: '600',
    color: colors.forest,
    textAlign: 'center',
    marginBottom: 8,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  processingText: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.rust,
  },
  recordingText: {
    fontSize: sizes.sm,
    color: colors.rust,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: sizes.base,
    maxHeight: 120,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  recordingFill: {
    flex: 1,
    minHeight: 44,
  },
  btnCol: {
    alignItems: 'center',
    gap: 6,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnRecording: {
    backgroundColor: colors.rust + '30',
    borderWidth: 2,
    borderColor: colors.rust,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.3,
  },
});
