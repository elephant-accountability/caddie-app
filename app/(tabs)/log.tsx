import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import { api } from '../api/client';
import type { ConversationIngestResponse } from '../types/api';

export function LogScreen() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with actual expo-av recording implementation
  const startRecording = useCallback(async () => {
    setRecording(true);
    setError(null);
    setTranscript(null);
    setEntities([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Placeholder: actual recording would start here
  }, []);

  const stopRecording = useCallback(async () => {
    setRecording(false);
    setLoading(true);
    try {
      // Placeholder: submit recorded audio as FormData
      const formData = new FormData();
      formData.append('source', 'manual');
      // formData.append('audio', { uri: recordingUri, name: 'recording.m4a', type: 'audio/m4a' });
      const result = await api.ingestConversation(formData);
      setTranscript(result.transcript || null);
      setEntities(result.extracted || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process recording');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Log</Text>
          <Text style={styles.subtitle}>Record a voice note about a customer interaction.</Text>
        </View>

        {/* Record button */}
        <View style={styles.recordArea}>
          <Pressable
            style={[styles.recordBtn, recording && styles.recordingBtn]}
            onPress={recording ? stopRecording : startRecording}
            accessibilityRole="button"
            accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
          >
            <Ionicons
              name={recording ? 'stop' : 'mic'}
              size={40}
              color={recording ? colors.rust : colors.navy}
            />
          </Pressable>
          <Text style={styles.recordHint}>
            {recording ? 'Recording... Tap to stop' : 'Tap to record'}
          </Text>
        </View>

        {/* Text input fallback */}
        <View style={styles.textFallback}>
          <Text style={styles.fallbackLabel}>Or type a note</Text>
          {/* Text input would go here — placeholder for now */}
        </View>

        {/* Results */}
        {loading && (
          <View style={styles.loadingArea}>
            <Text style={styles.loadingText}>Transcribing...</Text>
          </View>
        )}

        {error && (
          <Text style={styles.error} accessibilityRole="alert">{error}</Text>
        )}

        {transcript && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Transcript</Text>
            <Text style={styles.resultText}>{transcript}</Text>
          </View>
        )}

        {entities.length > 0 && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Extracted</Text>
            <View style={styles.entityRow}>
              {entities.map((e, i) => (
                <View key={i} style={styles.entityChip}>
                  <Text style={styles.entityText}>{e.text || e.value || JSON.stringify(e)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 32, gap: 4 },
  title: { fontSize: 24, fontWeight: '700', color: colors.white },
  subtitle: { fontSize: sizes.sm, color: colors.textSecondary, textAlign: 'center' },
  recordArea: { alignItems: 'center', marginBottom: 32 },
  recordBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  recordingBtn: {
    backgroundColor: colors.rust + '30',
    borderWidth: 3,
    borderColor: colors.rust,
  },
  recordHint: { fontSize: sizes.sm, color: colors.textSecondary },
  textFallback: { marginBottom: 24, alignItems: 'center' },
  fallbackLabel: { fontSize: sizes.sm, color: colors.textMuted, marginBottom: 8 },
  loadingArea: { marginVertical: 20 },
  loadingText: { fontSize: sizes.base, color: colors.textSecondary },
  error: { fontSize: sizes.base, color: colors.rust, textAlign: 'center', marginTop: 16 },
  resultBox: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultLabel: {
    fontSize: sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  resultText: { fontSize: sizes.base, color: colors.white, lineHeight: 22 },
  entityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  entityChip: {
    backgroundColor: colors.forest + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  entityText: { fontSize: sizes.sm, color: colors.forest, fontWeight: '500' },
});
