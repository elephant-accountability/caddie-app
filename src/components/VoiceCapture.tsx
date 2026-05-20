import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import { api } from '../api/client';

interface VoiceCaptureProps {
  onComplete?: () => void;
  placeholder?: string;
}

export function VoiceCapture({ onComplete, placeholder }: VoiceCaptureProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true);
    try {
      await api.ingestConversation(text.trim());
      setSubmitted(true);
      setText('');
      setTimeout(() => {
        setSubmitted(false);
        onComplete?.();
      }, 1500);
    } catch (e) {
      // TODO: show error
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
        placeholder={placeholder || "Just called Jesse, he wants the LPM demo Tuesday..."}
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={500}
        editable={!submitting}
      />
      <View style={styles.footer}>
        <Text style={styles.charCount}>{text.length}/500</Text>
        <Pressable
          style={[
            styles.submitBtn,
            (!text.trim() || submitting) && styles.submitBtnDisabled,
            submitted && styles.submitBtnSuccess,
          ]}
          onPress={handleSubmit}
          disabled={!text.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : submitted ? (
            <Ionicons name="checkmark" size={20} color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={styles.submitText}>Log</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  input: {
    color: colors.textPrimary,
    fontSize: sizes.base,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  charCount: {
    fontSize: sizes.xs,
    color: colors.textMuted,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnSuccess: {
    backgroundColor: colors.success,
  },
  submitText: {
    color: '#fff',
    fontSize: sizes.sm,
    fontWeight: '700',
  },
});
