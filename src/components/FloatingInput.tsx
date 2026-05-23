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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import { api } from '../api/client';

/**
 * Persistent floating input — always visible above the tab bar.
 * Tap the mic pill to expand into a text/voice input.
 * Submit sends to /api/conversation/ingest.
 */
export function FloatingInput() {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [expanded, fadeAnim]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append('text', trimmed);
      await api.ingestConversation(fd);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFeedback('Got it');
      setText('');
      setTimeout(() => {
        setFeedback(null);
        setExpanded(false);
      }, 1500);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedback(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setExpanded(false);
    setText('');
    setFeedback(null);
  };

  if (!expanded) {
    return (
      <View style={styles.pillContainer}>
        <Pressable
          style={styles.pill}
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel="Talk to Caddie"
        >
          <Ionicons name="mic" size={20} color={colors.white} />
          <Text style={styles.pillText}>Caddie</Text>
        </Pressable>
      </View>
    );
  }

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
        <View style={styles.inputRow}>
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
          <View style={styles.btnCol}>
            <Pressable
              style={[styles.sendBtn, (!text.trim() || submitting) && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={!text.trim() || submitting}
              accessibilityRole="button"
              accessibilityLabel="Send to Caddie"
            >
              <Ionicons name="arrow-up" size={20} color={colors.white} />
            </Pressable>
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
    bottom: 90, // sits above tab bar
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
  btnCol: {
    alignItems: 'center',
    gap: 6,
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
