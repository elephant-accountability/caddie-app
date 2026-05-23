import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import { api } from '../api/client';
import type { HistoryResponse, HistoryItem } from '../types/api';

export function HistoryScreen({ navigation }: { navigation?: any }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getHistory();
      setHistory(data.actions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const OUTCOME_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    completed: 'checkmark-circle-outline',
    no_answer: 'call-outline',
    voicemail: 'recording-outline',
    callback: 'time-outline',
    not_relevant: 'close-circle-outline',
  };

  const OUTCOME_COLORS: Record<string, string> = {
    completed: colors.forest,
    no_answer: colors.amber,
    voicemail: colors.amber,
    callback: colors.actionEmail,
    not_relevant: colors.textMuted,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.title}>History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.white} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={loadHistory} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No actions completed today.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {history.map((item, i) => {
              const iconName = OUTCOME_ICONS[item.outcome] || 'ellipse-outline';
              const iconColor = OUTCOME_COLORS[item.outcome] || colors.textMuted;
              return (
                <View key={item.action_id || i} style={styles.row}>
                  <Ionicons name={iconName} size={20} color={iconColor} />
                  <View style={styles.rowText}>
                    <Text style={styles.contactName}>{item.contact_name || item.account_name}</Text>
                    <Text style={styles.outcome}>{item.outcome}</Text>
                  </View>
                  <Text style={styles.time}>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700', color: colors.white },
  placeholder: { width: 32 },
  content: { paddingBottom: 40 },
  loading: { paddingVertical: 80, alignItems: 'center' },
  center: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  errorText: { fontSize: sizes.base, color: colors.rust, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.bgCard, borderRadius: 8 },
  retryText: { color: colors.white, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: sizes.base, color: colors.textSecondary },
  list: { paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1 },
  contactName: { fontSize: sizes.base, fontWeight: '600', color: colors.white },
  outcome: { fontSize: sizes.sm, color: colors.textSecondary, textTransform: 'capitalize' },
  time: { fontSize: sizes.sm, color: colors.textMuted, fontVariant: ['tabular-nums'] },
});
