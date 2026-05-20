import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Text,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { sizes } from '../src/theme/typography';
import { useQueue } from '../src/hooks/useQueue';
import { ActionCard } from '../src/components/ActionCard';
import { QueueHeader } from '../src/components/QueueHeader';
import { VoiceCapture } from '../src/components/VoiceCapture';

export default function QueueScreen() {
  const {
    actions,
    currentAction,
    currentIndex,
    remaining,
    loading,
    error,
    refresh,
    complete,
    skip,
    snooze,
  } = useQueue();

  const [showVoice, setShowVoice] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.blue}
          />
        }
      >
        <QueueHeader
          remaining={remaining}
          total={actions.length}
          onRefresh={onRefresh}
        />

        {/* Current action card */}
        {currentAction ? (
          <ActionCard
            action={currentAction}
            onComplete={() => complete('completed')}
            onSkip={skip}
            onSnooze={() => snooze(4)}
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

        {/* Upcoming actions (collapsed) */}
        {actions.slice(currentIndex + 1, currentIndex + 4).map((action, i) => (
          <View key={action.id} style={[styles.upcoming, { opacity: 1 - (i * 0.25) }]}>
            <View style={styles.upcomingRow}>
              <Ionicons
                name={(
                  action.type === 'call' ? 'call-outline' :
                  action.type === 'email' ? 'mail-outline' :
                  action.type === 'sms' ? 'chatbubble-outline' : 'search-outline'
                ) as any}
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.upcomingText} numberOfLines={1}>
                {action.contact || action.account}
              </Text>
              <Text style={styles.upcomingReason} numberOfLines={1}>
                {action.reason.split(',')[0]}
              </Text>
            </View>
          </View>
        ))}

        {/* Voice capture toggle */}
        <Pressable
          style={styles.voiceToggle}
          onPress={() => setShowVoice(!showVoice)}
        >
          <Ionicons
            name={showVoice ? 'chevron-up' : 'mic-outline'}
            size={20}
            color={colors.blue}
          />
          <Text style={styles.voiceToggleText}>
            {showVoice ? 'Hide' : 'Log a touch'}
          </Text>
        </Pressable>

        {showVoice && (
          <VoiceCapture
            onComplete={() => {
              setShowVoice(false);
              refresh();
            }}
          />
        )}

        {/* Error state */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
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
    marginHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upcomingText: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 0,
  },
  upcomingReason: {
    fontSize: sizes.sm,
    color: colors.textMuted,
    flex: 1,
  },
  voiceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 12,
  },
  voiceToggleText: {
    fontSize: sizes.base,
    color: colors.blue,
    fontWeight: '600',
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
