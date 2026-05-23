import React, { useState } from 'react';
import { SafeAreaView, ScrollView, RefreshControl, StyleSheet, View, ActivityIndicator, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { useQueue } from '../../src/context/QueueContext';
import { MorningBrief } from '../../src/components/MorningBrief';
import { QuotaBar } from '../../src/components/QuotaBar';

export default function BriefScreen() {
  const { actions, loading, refresh, quota, remaining } = useQueue();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = dayNames[new Date().getDay()];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dayText}>{today}</Text>
          <Text style={styles.actionCount}>{remaining} actions</Text>
        </View>

        <QuotaBar quota={quota} />

        {/* Quick links */}
        <View style={styles.linksRow}>
          <Pressable
            style={styles.linkBtn}
            onPress={() => router.push('/history')}
            accessibilityRole="button"
          >
            <Ionicons name="time-outline" size={18} color={colors.white} />
            <Text style={styles.linkText}>History</Text>
          </Pressable>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        ) : (
          <MorningBrief actions={actions} date={new Date()} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dayText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  actionCount: {
    fontSize: sizes.base,
    color: colors.textSecondary,
    marginTop: 2,
  },
  linksRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: {
    fontSize: sizes.sm,
    fontWeight: '600',
    color: colors.white,
  },
  loading: { paddingVertical: 80, alignItems: 'center' },
});
