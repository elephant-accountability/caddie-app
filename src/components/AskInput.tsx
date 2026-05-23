import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import { api } from '../api/client';
import type { AskResponse } from '../types/api';

interface Props {
  contactId: string;
}

export function AskInput({ contactId }: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const result = await api.ask({ question: question.trim(), contact_id: contactId });
      setAnswer(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} style={styles.icon} />
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask about this contact..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          accessibilityLabel="Ask a question"
        />
        <Pressable
          onPress={handleSubmit}
          disabled={loading || !question.trim()}
          style={[styles.sendBtn, loading && styles.sendDisabled]}
          accessibilityLabel="Send question"
        >
          <Ionicons name="arrow-forward" size={20} color={colors.navy} />
        </Pressable>
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.white} />
        </View>
      )}

      {error && (
        <Text style={styles.error} accessibilityRole="alert">{error}</Text>
      )}

      {answer && (
        <View style={styles.answerBox}>
          <Text style={styles.answerText}>{answer.text}</Text>
          {answer.sources && answer.sources.length > 0 && (
            <View style={styles.sources}>
              <Text style={styles.sourcesTitle}>Sources</Text>
              {answer.sources.map((s, i) => (
                <View key={i} style={styles.sourceRow}>
                  <Ionicons name="document-text-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.sourceText}>{s.title || s.source}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: sizes.base,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  loading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  error: {
    fontSize: sizes.sm,
    color: colors.rust,
    marginTop: 10,
  },
  answerBox: {
    marginTop: 12,
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  answerText: {
    fontSize: sizes.base,
    color: colors.white,
    lineHeight: 22,
  },
  sources: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  sourcesTitle: {
    fontSize: sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sourceText: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
  },
});
