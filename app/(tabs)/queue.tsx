import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { useQueue } from '../../src/hooks/useQueue';
import { SwipeableActionCard } from '../../src/components/SwipeableActionCard';
import { OutcomeModal } from '../../src/components/OutcomeModal';
import { QueueHeader } from '../../src/components/QueueHeader';

export default function QueueScreen() {
  const {
    actions, currentAction, currentIndex, remaining,
    loading, error, refresh, complete, skip, snooze,
  } = useQueue();

  const [refreshing, setRefreshing] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleOutcome = async (outcome: string, note?: string) => {
    setShowOutcome(false);
    await complete(outcome, note);
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

        {currentAction ? (
          <SwipeableActionCard
            action={currentAction}
            onSwipeRight={() => setShowOutcome(true)}
            onSwipeLeft={skip}
            onSwipeUp={() => snooze(4)}
            onTapContact={() => {/* TODO: open contact sheet */}}
            onTapAction={() => setShowOutcome(true)}
          />
        ) : !loading ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>Queue clear</Text>
            <Text style={styles.emptyText}>
              All actions handled. Pull down to refresh.
            </Text>
          </View>
        ) : null}

        {/* Upcoming peek */}
        {actions.slice(currentIndex + 1, currentIndex + 4).map((action, i) => (
          <View key={action.id} style={[styles.upcoming, { opacity: 1 - (i * 0.25) }]}>
            <Ionicons
              name={(
                action.type === 'call' ? 'call-outline' :
                action.type === 'email' ? 'mail-outline' : 'search-outline'
              ) as any}
              size={14}
              color={colors.textMuted}
            />
            <Text style={styles.upcomingName} numberOfLines={1}>
              {action.contact || action.account}
            </Text>
          </View>
        ))}

        {error && (
          <View style={styles.errorBanner}>
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
