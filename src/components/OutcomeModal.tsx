import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import type { OutcomeType } from '../types/api';

const OUTCOMES: ReadonlyArray<{
  key: OutcomeType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { key: 'completed', label: 'Connected', icon: 'checkmark-circle', color: colors.forest },
  { key: 'voicemail', label: 'Voicemail', icon: 'recording-outline', color: colors.actionEmail },
  { key: 'no_answer', label: 'No answer', icon: 'call-outline', color: colors.amber },
  { key: 'callback', label: 'Call back', icon: 'time-outline', color: colors.steel },
  { key: 'not_relevant', label: 'Not relevant', icon: 'close-circle-outline', color: colors.textMuted },
];

interface OutcomeModalProps {
  visible: boolean;
  contactName: string;
  onSubmit: (outcome: OutcomeType, note?: string) => void;
  onClose: () => void;
}

export function OutcomeModal({ visible, contactName, onSubmit, onClose }: OutcomeModalProps) {
  const [selected, setSelected] = useState<OutcomeType | null>(null);
  const [note, setNote] = useState('');

  const handleSelect = (key: OutcomeType) => {
    Haptics.selectionAsync();
    setSelected(key);
  };

  const handleSubmit = () => {
    if (!selected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(selected, note.trim() || undefined);
    setSelected(null);
    setNote('');
  };

  const handleClose = () => {
    setSelected(null);
    setNote('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>How'd it go with {contactName}?</Text>

          <View style={styles.outcomes}>
            {OUTCOMES.map(o => (
              <Pressable
                key={o.key}
                style={[
                  styles.outcomeBtn,
                  selected === o.key && { backgroundColor: o.color + '20', borderColor: o.color },
                ]}
                onPress={() => handleSelect(o.key)}
                accessibilityRole="button"
                accessibilityLabel={o.label}
                accessibilityState={{ selected: selected === o.key }}
              >
                <Ionicons
                  name={o.icon}
                  size={22}
                  color={selected === o.key ? o.color : colors.textSecondary}
                />
                <Text style={[
                  styles.outcomeLabel,
                  selected === o.key && { color: o.color },
                ]}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {selected && (
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Quick note (optional)..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={300}
              autoFocus
              accessibilityLabel="Add a note about this interaction"
            />
          )}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Cancel">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, !selected && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!selected}
              accessibilityRole="button"
              accessibilityLabel="Log outcome"
              accessibilityState={{ disabled: !selected }}
            >
              <Text style={styles.submitText}>Log it</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  outcomes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  outcomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.bgInput,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  outcomeLabel: {
    fontSize: sizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  noteInput: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    fontSize: sizes.base,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.bgInput,
  },
  cancelText: {
    fontSize: sizes.base,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.navyLight,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontSize: sizes.base,
    fontWeight: '700',
    color: '#fff',
  },
});
