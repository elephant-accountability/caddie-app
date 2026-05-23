import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import { useAuth } from '../auth/AuthContext';

export function LoginScreen() {
  const { login } = useAuth();
  const [repId, setRepId] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!repId.trim() || !secret.trim()) {
      setError('Enter your rep ID and signup secret.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(repId.trim(), secret.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="briefcase-outline" size={40} color={colors.white} />
          <Text style={styles.title}>Caddie EDC</Text>
          <Text style={styles.subtitle}>Field sales assistant</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Rep ID</Text>
          <TextInput
            style={styles.input}
            value={repId}
            onChangeText={setRepId}
            placeholder="your-rep-id"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Rep ID"
          />

          <Text style={styles.label}>Signup secret</Text>
          <View style={styles.secretRow}>
            <TextInput
              style={[styles.input, styles.secretInput]}
              value={secret}
              onChangeText={setSecret}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showSecret}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Signup secret"
            />
            <Pressable
              onPress={() => setShowSecret(!showSecret)}
              style={styles.eyeBtn}
              accessibilityLabel={showSecret ? 'Hide secret' : 'Show secret'}
            >
              <Ionicons
                name={showSecret ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          {error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}

          <Pressable
            style={[styles.submitBtn, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.submitText}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginTop: 8,
  },
  subtitle: {
    fontSize: sizes.base,
    color: colors.textSecondary,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: sizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: -8,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: sizes.base,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secretInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  eyeBtn: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.border,
  },
  error: {
    fontSize: sizes.sm,
    color: colors.rust,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: sizes.base,
    fontWeight: '700',
    color: colors.navy,
  },
});
