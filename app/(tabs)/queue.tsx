import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { useQueue } from '../../src/context/QueueContext';
import { SwipeableActionCard } from '../../src/components/SwipeableActionCard';
import { OutcomeModal } from '../../src/components/OutcomeModal';
import { QueueHeader } from '../../src/components/QueueHeader';
import type { OutcomeType } from '../../src/types/api';

export default function QueueScreen() {
  const {
    actions, currentAction, currentIndex, remaining,
    loading, error, mutating, refresh, complete, skip, snooze,
  } = useQueue();

  const [refreshing, setRefreshing] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleOutcome = async (outcome: OutcomeType, note?: string) => {
    setShowOutcome(false);
    await complete(outcome, note);
  };

  const ACTION_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
    call: 'call-outline',
    email: 'mail-outline',
    sms: 'chatbubble-outline',
    research: 'search-outline',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />
        }
      >
        <QueueHeader remaining={remaining} total={actions.length} onRefresh={onRefresh} />

        {loading && !refreshing ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.blue} />
          </View>
        ) : currentAction ? (
          <SwipeableActionCard
            key={currentAction.id}
            action={currentAction}
            onSwipeRight={() => setShowOutcome(true)}
            onSwipeLeft={skip}
            onSwipeUp={() => snooze(4)}
            onTapContact={() => {/* TODO: open contact sheet */}}
            onTapAction={() => setShowOutcome(true)}
          />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>Queue clear</Text>
            <Text style={styles.emptyText}>
              All actions handled. Pull down to refresh.
            </Text>
          </View>
        )}

        {/* Mutation indicator */}
        {mutating && (
          <View style={styles.mutating}>
            <ActivityIndicator size="small" color={colors.blue} />
            <Text style={styles.mutatingText}>Logging...</Text>
          </View>
        )}

        {/* Upcoming peek */}
        {actions.slice(currentIndex + 1, currentIndex + 4).map((action, i) => (
          <View key={action.id} style={[styles.upcoming, { opacity: 1 - (i * 0.25) }]}>
            <Ionicons
              name={ACTION_ICON_MAP[action.type] || 'ellipse-outline'}
              size={14}
              color={colors.textMuted}
            />
            <Text style={styles.upcomingName} numberOfLines={1}>
              {action.contact || action.account}
            </Text>
          </View>
        ))}

        {error && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <OutcomeModal
        visible={showOutcome}
        contactName={currentAction?.contact || currentAction?.account || ''}
        onSubmit={handleOutcome}
        onClose={() => setShowOutcome(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  loading: { paddingVertical: 60, alignItems: 'center' },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: sizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  mutating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  mutatingText: {
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
  upcoming: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  upcomingName: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  errorBanner: {
    backgroundColor: colors.danger + '20',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: sizes.sm,
    textAlign: 'center',
  },
});
