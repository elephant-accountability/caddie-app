import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import { api } from '../api/client';

interface VoiceCaptureProps {
  placeholder?: string;
}

export function VoiceCapture({ placeholder }: VoiceCaptureProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append('text', text.trim());
      await api.ingestConversation(fd);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFeedback({ type: 'success', msg: 'Logged' });
      setText('');
      // Clear success message after 3s
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Failed to log',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder || 'What happened?'}
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={1000}
        accessibilityLabel="Touch note"
        accessibilityHint="Describe the interaction you just had"
      />
      {feedback && (
        <Text style={[
          styles.feedback,
          { color: feedback.type === 'success' ? colors.forest : colors.rust },
        ]}>
          {feedback.msg}
        </Text>
      )}
      <Pressable
        style={[styles.btn, (!text.trim() || submitting) && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={!text.trim() || submitting}
        accessibilityRole="button"
        accessibilityLabel="Submit touch note"
        accessibilityState={{ disabled: !text.trim() || submitting }}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={16} color="#fff" />
            <Text style={styles.btnText}>Log it</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    fontSize: sizes.base,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  feedback: {
    fontSize: sizes.sm,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.navyLight,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: '#fff',
    fontSize: sizes.base,
    fontWeight: '700',
  },
});
