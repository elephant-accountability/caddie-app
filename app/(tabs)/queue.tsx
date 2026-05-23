import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Modal,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { useQueue } from '../../src/context/QueueContext';
import { api } from '../../src/api/client';
import { ActionCard } from '../../src/components/ActionCard';
import { OutcomeModal } from '../../src/components/OutcomeModal';
import { ContactSheet } from '../../src/components/ContactSheet';
import { AskInput } from '../../src/components/AskInput';
import { QuotaBar } from '../../src/components/QuotaBar';
import { QueueHeader } from '../../src/components/QueueHeader';
import type { Action, OutcomeType } from '../../src/types/api';

const ACTION_COLORS: Record<string, string> = {
  call: colors.actionCall,
  email: colors.actionEmail,
  sms: colors.actionSms,
  research: colors.actionResearch,
};

export default function QueueScreen() {
  const {
    actions, currentAction, currentIndex, remaining, quota,
    loading, error, mutating, refresh, complete, skip, snooze,
    skipAction: skipActionCtx, snoozeAction: snoozeActionCtx, completeAction: completeActionCtx,
  } = useQueue();

  // Fallbacks in case context doesn't have the new methods yet
  const skipAction = skipActionCtx || (async (_a: Action) => { await skip(); });
  const snoozeAction = snoozeActionCtx || (async (_a: Action) => { await snooze(); });
  const completeAction = completeActionCtx || (async (_a: Action, outcome: OutcomeType, note?: string) => { await complete(outcome, note); });

  const [refreshing, setRefreshing] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Track which action the outcome modal is for (top card or list item)
  const [outcomeAction, setOutcomeAction] = useState<Action | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleOutcome = async (outcome: OutcomeType, note?: string) => {
    setShowOutcome(false);
    if (outcomeAction && outcomeAction.id !== currentAction?.id) {
      // Acting on a list item, not top card
      await completeAction(outcomeAction, outcome, note);
    } else {
      await complete(outcome, note);
    }
    setOutcomeAction(null);
    setExpandedId(null);
  };

  const handleSkip = async () => {
    if (swiping) return;
    setSwiping(true);
    try { await skip(); } finally { setSwiping(false); }
  };

  const handleSnooze = async () => {
    if (swiping) return;
    setSwiping(true);
    try { await snooze(); } finally { setSwiping(false); }
  };

  const handleTapContact = () => {
    setShowContactSheet(true);
  };

  // Remaining queue items (everything after currentIndex)
  const upcomingActions = actions.slice(currentIndex + 1);

  const handleListSkip = async (action: Action) => {
    setExpandedId(null);
    await skipAction(action);
  };

  const handleListSnooze = async (action: Action) => {
    setExpandedId(null);
    await snoozeAction(action);
  };

  const handleListDone = (action: Action) => {
    setOutcomeAction(action);
    setShowOutcome(true);
  };

  const handleListCall = (action: Action) => {
    if (action.phone) {
      const cleaned = action.phone.replace(/[^0-9+]/g, '');
      Linking.openURL('tel:' + cleaned);
    }
  };

  const handleListWebsite = (action: Action) => {
    if (action.website) {
      Linking.openURL(action.website);
    }
  };

  const handleListShare = async (action: Action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const name = action.contact || action.account;
    const lines = [name];
    if (action.account && action.contact) lines.push(action.account);
    if (action.reason) lines.push(action.reason);
    if (action.phone) lines.push(action.phone);
    if (action.website) lines.push(action.website);
    try {
      await Share.share({ message: lines.join('\n') });
      api.share(action.id, action.contact_id, action.account).catch(() => {});
    } catch {}
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
          <>
            {/* Top recommendation card */}
            <ActionCard
              action={currentAction}
              onDone={() => {
                setOutcomeAction(currentAction);
                setShowOutcome(true);
              }}
              onSkip={handleSkip}
              onSnooze={handleSnooze}
              onTapContact={handleTapContact}
              onShare={() => {
                api.share(currentAction.id, currentAction.contact_id, currentAction.account).catch(() => {});
              }}
            />

            {/* Upcoming queue list */}
            {upcomingActions.length > 0 && (
              <View style={styles.upcomingSection}>
                <Text style={styles.upcomingTitle}>Up next</Text>
                {upcomingActions.map((action) => {
                  const isExpanded = expandedId === action.id;
                  const accentColor = ACTION_COLORS[action.type] || colors.actionResearch;

                  if (isExpanded) {
                    return (
                      <View key={action.id} style={[styles.expandedCard, { borderLeftColor: accentColor, borderLeftWidth: 3 }]}>
                        <Pressable onPress={() => setExpandedId(null)} style={styles.collapseHit}>
                          <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
                        </Pressable>

                        <Text style={styles.expandedName}>{action.contact || action.account}</Text>
                        {action.contact && action.account !== action.contact && (
                          <Text style={styles.expandedAccount}>{action.account}</Text>
                        )}

                        <Text style={styles.expandedReason}>{action.reason || ''}</Text>

                        {action.supporting ? (
                          <Text style={styles.expandedSupporting} numberOfLines={4}>{action.supporting}</Text>
                        ) : null}

                        {action.revenue && action.revenue[1] > 0 && (
                          <View style={styles.revBadge}>
                            <Text style={styles.revText}>
                              ${Math.round(action.revenue[0]).toLocaleString()}–${Math.round(action.revenue[1]).toLocaleString()}
                            </Text>
                          </View>
                        )}

                        {action.type === 'call' && action.phone && (
                          <Pressable style={[styles.callBtn, { backgroundColor: accentColor }]} onPress={() => handleListCall(action)}>
                            <Ionicons name="call" size={18} color={colors.navy} />
                            <Text style={styles.callBtnText}>{action.phone}</Text>
                          </Pressable>
                        )}

                        {action.website && (
                          <Pressable style={styles.webBtn} onPress={() => handleListWebsite(action)} accessibilityRole="link">
                            <Ionicons name="globe-outline" size={16} color={colors.actionEmail} />
                            <Text style={styles.webText} numberOfLines={1}>{action.website.replace('https://', '')}</Text>
                          </Pressable>
                        )}

                        <View style={styles.expandedBtnRow}>
                          <Pressable style={styles.expandedBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleListSkip(action); }}>
                            <Text style={styles.expandedBtnText}>Skip</Text>
                          </Pressable>
                          <Pressable style={styles.expandedBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleListSnooze(action); }}>
                            <Text style={styles.expandedBtnText}>Later</Text>
                          </Pressable>
                          <Pressable style={styles.expandedBtn} onPress={() => handleListShare(action)}>
                            <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
                          </Pressable>
                          <Pressable style={[styles.expandedBtn, styles.expandedDoneBtn]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleListDone(action); }}>
                            <Text style={styles.expandedDoneBtnText}>Done</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <Pressable
                      key={action.id}
                      style={styles.listItem}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setExpandedId(action.id);
                      }}
                      accessibilityRole="button"
                    >
                      <View style={[styles.listDot, { backgroundColor: accentColor }]} />
                      <View style={styles.listContent}>
                        <Text style={styles.listName} numberOfLines={1}>
                          {action.contact || action.account}
                        </Text>
                        <Text style={styles.listReason} numberOfLines={1}>
                          {(action.reason || '').split(/[.,]/)[0] || action.account}
                        </Text>
                      </View>
                      <View style={[styles.typePill, { backgroundColor: accentColor + '20' }]}>
                        <Text style={[styles.typeLabel, { color: accentColor }]}>{action.type}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
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
        contactName={outcomeAction?.contact || outcomeAction?.account || currentAction?.contact || currentAction?.account || ''}
        onSubmit={handleOutcome}
        onClose={() => { setShowOutcome(false); setOutcomeAction(null); }}
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

  // "Up next" section
  upcomingSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  upcomingTitle: {
    fontSize: sizes.base,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },

  // Compact list item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listDot: { width: 8, height: 8, borderRadius: 4 },
  listContent: { flex: 1 },
  listName: { fontSize: sizes.sm, fontWeight: '600', color: colors.white },
  listReason: { fontSize: sizes.xs, color: colors.textMuted, marginTop: 1 },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeLabel: { fontSize: sizes.xs, fontWeight: '700' },

  // Expanded card in list
  expandedCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  collapseHit: {
    alignSelf: 'center',
    padding: 4,
    marginBottom: 4,
  },
  expandedName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  expandedAccount: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  expandedReason: {
    fontSize: sizes.base,
    color: colors.white,
    lineHeight: 22,
    marginBottom: 6,
  },
  expandedSupporting: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  revBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.forest + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  revText: { fontSize: sizes.sm, color: colors.forest, fontWeight: '600' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 10,
  },
  callBtnText: { fontSize: sizes.base, fontWeight: '700', color: colors.navy },
  webBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    marginBottom: 8,
  },
  webText: {
    fontSize: sizes.sm,
    color: colors.actionEmail,
    textDecorationLine: 'underline',
    flex: 1,
  },
  expandedBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  expandedBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expandedBtnText: { color: colors.textSecondary, fontSize: sizes.sm, fontWeight: '600' },
  expandedDoneBtn: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  expandedDoneBtnText: { color: colors.navy, fontSize: sizes.sm, fontWeight: '700' },
});
