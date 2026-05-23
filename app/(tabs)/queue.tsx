import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { useQueue } from '../../src/context/QueueContext';
import { ActionCard } from '../../src/components/ActionCard';
import { OutcomeModal } from '../../src/components/OutcomeModal';
import { ContactSheet } from '../../src/components/ContactSheet';
import { AskInput } from '../../src/components/AskInput';
import { QuotaBar } from '../../src/components/QuotaBar';
import { QueueHeader } from '../../src/components/QueueHeader';
import type { OutcomeType } from '../../src/types/api';

export default function QueueScreen() {
  const {
    actions, currentAction, currentIndex, remaining, quota,
    loading, error, mutating, refresh, complete, skip, snooze,
  } = useQueue();

  const [refreshing, setRefreshing] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [showSnoozeSheet, setShowSnoozeSheet] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleOutcome = async (outcome: OutcomeType, note?: string) => {
    setShowOutcome(false);
    await complete(outcome, note);
  };

  const handleSkip = async () => {
    await skip();
  };

  const handleSnooze = async () => {
    setShowSnoozeSheet(true);
  };

  const handleSnoozeConfirm = async (hours: number) => {
    setShowSnoozeSheet(false);
    await snooze(hours);
  };

  const handleTapContact = () => {
    setShowContactSheet(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
        }
      >
        <QueueHeader remaining={remaining} total={actions.length} onRefresh={onRefresh} />

        <QuotaBar quota={quota} />

        {loading && !refreshing ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        ) : currentAction ? (
          <ActionCard
            action={currentAction}
            onDone={() => setShowOutcome(true)}
            onSkip={handleSkip}
            onSnooze={handleSnooze}
            onTapContact={handleTapContact}
          />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={48} color={colors.forest} />
            <Text style={styles.emptyTitle}>Queue clear</Text>
            <Text style={styles.emptyText}>
              All actions handled.
            </Text>
          </View>
        )}

        {mutating && (
          <View style={styles.mutating}>
            <ActivityIndicator size="small" color={colors.white} />
            <Text style={styles.mutatingText}>Logging...</Text>
          </View>
        )}

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

      {/* Contact Sheet Modal */}
      <Modal
        visible={showContactSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowContactSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContainer}>
            {currentAction?.contact_id && (
              <>
                <ContactSheet
                  contactId={currentAction.contact_id}
                  contactName={currentAction.contact || currentAction.account || ''}
                  onClose={() => setShowContactSheet(false)}
                />
                <AskInput contactId={currentAction.contact_id} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
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
    color: colors.white,
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
  errorBanner: {
    backgroundColor: colors.rust + '20',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: colors.rust,
    fontSize: sizes.sm,
    textAlign: 'center',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '80%',
    backgroundColor: colors.navy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});