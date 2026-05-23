import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import { api } from '../api/client';
import type { ContextResponse } from '../types/api';

interface Props {
  contactId: string;
  contactName: string;
  onClose: () => void;
}

export function ContactSheet({ contactId, contactName, onClose }: Props) {
  const [context, setContext] = useState<ContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContext = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getContext(contactId);
      setContext(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load context');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  React.useEffect(() => {
    loadContext();
  }, [loadContext]);

  const handlePhone = () => {
    if (context?.phone) {
      Linking.openURL('tel:' + context.phone.replace(/[^0-9+]/g, ''));
    }
  };

  const handleEmail = () => {
    if (context?.email) {
      Linking.openURL('mailto:' + context.email);
    }
  };

  return (
    <View style={styles.container}>
      {/* Drag handle */}
      <View style={styles.handleRow}>
        <View style={styles.handle} />
        <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
          <Ionicons name="close-outline" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.white} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadContext} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : context ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <Text style={styles.name}>{context.contact_name || contactName}</Text>
          <Text style={styles.company}>{context.company}</Text>
          {context.role && <Text style={styles.role}>{context.role}</Text>}

          {/* Contact actions */}
          <View style={styles.contactRow}>
            {context.phone && (
              <Pressable style={styles.contactBtn} onPress={handlePhone} accessibilityLabel="Call">
                <Ionicons name="call-outline" size={20} color={colors.navy} />
                <Text style={styles.contactBtnText}>Call</Text>
              </Pressable>
            )}
            {context.email && (
              <Pressable style={styles.contactBtn} onPress={handleEmail} accessibilityLabel="Email">
                <Ionicons name="mail-outline" size={20} color={colors.navy} />
                <Text style={styles.contactBtnText}>Email</Text>
              </Pressable>
            )}
          </View>

          {/* Revenue */}
          {context.total_revenue !== undefined && (
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>
                  ${Math.round(context.total_revenue).toLocaleString()}
                </Text>
                <Text style={styles.metricLabel}>Total revenue</Text>
              </View>
              {context.deal_count !== undefined && (
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{context.deal_count}</Text>
                  <Text style={styles.metricLabel}>Deals</Text>
                </View>
              )}
              {context.days_since_contact !== undefined && (
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{context.days_since_contact}</Text>
                  <Text style={styles.metricLabel}>Days since contact</Text>
                </View>
              )}
            </View>
          )}

          {/* RSI */}
          {context.rsi !== undefined && (
            <View style={styles.rsiRow}>
              <Text style={styles.rsiLabel}>RSI</Text>
              <Text style={[styles.rsiValue, { color: context.rsi >= 70 ? colors.forest : context.rsi >= 40 ? colors.amber : colors.textSecondary }]}>
                {context.rsi}
              </Text>
              <Text style={styles.rsiTier}>
                {context.rsi >= 70 ? 'Hot' : context.rsi >= 40 ? 'Warm' : 'Cold'}
              </Text>
            </View>
          )}

          {/* Products */}
          {context.products && context.products.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Products</Text>
              <View style={styles.tagRow}>
                {context.products.map((p: string, i: number) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Why recommended */}
          {context.why_recommended && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Why recommended</Text>
              <Text style={styles.sectionText}>{context.why_recommended}</Text>
            </View>
          )}

          {/* Signals */}
          {context.signals && context.signals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Signals</Text>
              {context.signals.map((s: any, i: number) => (
                <View key={i} style={styles.signalCard}>
                  <Text style={styles.signalType}>{s.type}</Text>
                  <Text style={styles.signalText}>{s.description}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loading: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  errorText: {
    fontSize: sizes.base,
    color: colors.rust,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.bgCard,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  company: {
    fontSize: sizes.base,
    color: colors.textSecondary,
    marginTop: 2,
  },
  role: {
    fontSize: sizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  contactBtnText: {
    fontSize: sizes.sm,
    fontWeight: '700',
    color: colors.navy,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rsiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  rsiLabel: {
    fontSize: sizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rsiValue: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  rsiTier: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: sizes.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: sizes.base,
    color: colors.white,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: sizes.sm,
    color: colors.white,
    fontWeight: '500',
  },
  signalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signalType: {
    fontSize: sizes.xs,
    fontWeight: '700',
    color: colors.amber,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  signalText: {
    fontSize: sizes.sm,
    color: colors.white,
  },
});
