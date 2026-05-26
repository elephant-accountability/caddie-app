/**
 * PostCallCapture — Modal shown after a phone call ends.
 * 
 * Displays the caller info and lets the user type quick notes
 * or record a voice memo, then sends to the Caddie capture API.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { captureText, captureAudio } from '../api/capture';
import type { CallEndedEvent } from '../hooks/useCallCapture';

// Try to import expo-av for voice recording (optional)
let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch {
  // expo-av not available — voice recording disabled
}

interface PostCallCaptureProps {
  visible: boolean;
  callInfo: CallEndedEvent | null;
  onDismiss: () => void;
}

export function PostCallCapture({ visible, callInfo, onDismiss }: PostCallCaptureProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const recordingRef = useRef<any>(null);

  if (!callInfo) return null;

  const displayName = callInfo.callerName !== 'unknown' 
    ? callInfo.callerName 
    : callInfo.callerId !== 'unknown' 
      ? callInfo.callerId 
      : (callInfo.incoming ? 'Incoming Call' : 'Outgoing Call');

  const durationText = formatDuration(callInfo.duration);
  const directionIcon = callInfo.incoming ? '📞 Incoming' : '📱 Outgoing';

  const handleSave = async () => {
    if (!notes.trim() && !recordingUri) {
      onDismiss();
      return;
    }

    setIsSaving(true);
    try {
      if (recordingUri) {
        // Send voice recording
        await captureAudio(recordingUri, 'call_note.m4a');
      }
      
      if (notes.trim()) {
        // Build context-enriched text
        const captureContent = [
          `Phone call with: ${displayName}`,
          `Direction: ${callInfo.incoming ? 'Incoming' : 'Outgoing'}`,
          `Duration: ${durationText}`,
          `---`,
          notes.trim(),
        ].join('\n');

        await captureText(captureContent, 'phone_call');
      }

      setNotes('');
      setRecordingUri(null);
      onDismiss();
    } catch (err) {
      console.error('[PostCallCapture] Save failed:', err);
      // Still dismiss — don't block the user
      onDismiss();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    setNotes('');
    setRecordingUri(null);
    stopRecording();
    onDismiss();
  };

  const toggleRecording = async () => {
    if (!Audio) return;

    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    if (!Audio) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingUri(null);
    } catch (err) {
      console.error('[PostCallCapture] Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setRecordingUri(uri);
      recordingRef.current = null;
      setIsRecording(false);

      await Audio?.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (err) {
      console.error('[PostCallCapture] Failed to stop recording:', err);
      setIsRecording(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.handle} />
          
          <Text style={styles.title}>Call Ended</Text>
          
          <View style={styles.callerRow}>
            <Text style={styles.callerName}>{displayName}</Text>
            <Text style={styles.callMeta}>
              {directionIcon} · {durationText}
            </Text>
          </View>

          <Text style={styles.prompt}>
            Capture quick notes about this call?
          </Text>

          {/* Notes Input */}
          <TextInput
            style={styles.textInput}
            placeholder="What was discussed? Any action items?"
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoFocus
          />

          {/* Voice Recording Option */}
          {Audio && (
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={toggleRecording}
              activeOpacity={0.7}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? '⏹ Stop Recording' : '🎙 Record Voice Note'}
              </Text>
            </TouchableOpacity>
          )}

          {recordingUri && !isRecording && (
            <Text style={styles.recordingReady}>✓ Voice note ready</Text>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.steel,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.actionCall,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  callerRow: {
    marginBottom: 12,
  },
  callerName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  callMeta: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  prompt: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: colors.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 16,
    padding: 16,
    minHeight: 100,
    marginBottom: 12,
  },
  recordButton: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  recordButtonActive: {
    borderColor: colors.rust,
    backgroundColor: 'rgba(229, 62, 62, 0.15)',
  },
  recordButtonText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  recordingReady: {
    fontSize: 13,
    color: colors.forest,
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  skipButton: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.actionCall,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
