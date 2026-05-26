import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
  Modal,
  TouchableOpacity,
  Linking,
  Pressable,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useQueue } from '../../src/context/QueueContext';
import { api } from '../../src/api/client';
import type { Action } from '../../src/types/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_UP_THRESHOLD = 120;

const BADGE_COLORS: Record<string, string> = {
  call: '#22C55E',
  email: '#3B82F6',
  sms: '#F59E0B',
  research: '#8B5CF6',
  prep: '#EC4899',
};

const BADGE_LABELS: Record<string, string> = {
  call: 'CALL',
  email: 'EMAIL',
  sms: 'TEXT',
  research: 'RESEARCH',
  prep: 'PREP',
};

// ---------- Detail Modal ----------

interface ActionDetail {
  id: string;
  action_type: string;
  headline: string;
  detail: string;
  suggested_message: string | null;
  contact_name: string;
  company: string;
  distributor: string;
  evidence: string;
  urgency: string;
  score: number;
  source_type: string;
}

function DetailModal({
  visible,
  action,
  detail,
  loading,
  onClose,
  onAct,
}: {
  visible: boolean;
  action: Action | null;
  detail: ActionDetail | null;
  loading: boolean;
  onClose: () => void;
  onAct: () => void;
}) {
  if (!action) return null;

  const badgeColor = BADGE_COLORS[action.type] || '#8B5CF6';
  const badgeLabel = BADGE_LABELS[action.type] || action.type.toUpperCase();

  const handleCall = () => {
    if (action.phone) {
      Linking.openURL(`tel:${action.phone.replace(/[^+\d]/g, '')}`);
    }
  };

  const handleText = () => {
    if (action.phone) {
      const body = detail?.suggested_message || '';
      Linking.openURL(`sms:${action.phone.replace(/[^+\d]/g, '')}${body ? `&body=${encodeURIComponent(body)}` : ''}`);
    }
  };

  const handleEmail = () => {
    const subject = detail?.headline || action.reason || '';
    const body = detail?.suggested_message || '';
    Linking.openURL(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleWebsite = () => {
    if (action.website) {
      Linking.openURL(action.website.startsWith('http') ? action.website : `https://${action.website}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
                <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color="#8888AA" />
              </TouchableOpacity>
            </View>

            {/* Contact */}
            <Text style={styles.modalContactName}>{action.contact || action.account}</Text>
            <Text style={styles.modalCompany}>
              {action.account}
              {action.territory ? ` · ${action.territory}` : ''}
            </Text>

            {/* Headline */}
            <Text style={styles.modalReason}>{action.reason}</Text>

            {/* What this advances */}
            {detail?.advances ? (
              <View style={[styles.advancesBadge, { marginBottom: 16 }]}>
                <Ionicons name="trending-up" size={14} color="#4A9EFF" />
                <Text style={styles.advancesText}>{detail.advances}</Text>
              </View>
            ) : null}

            {loading ? (
              <ActivityIndicator size="small" color="#4A9EFF" style={{ marginVertical: 20 }} />
            ) : detail ? (
              <>
                {/* Full detail */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>CONTEXT</Text>
                  <Text style={styles.detailText}>{detail.detail}</Text>
                </View>

                {/* Evidence */}
                {detail.evidence ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>EVIDENCE</Text>
                    <Text style={styles.detailText}>{detail.evidence}</Text>
                  </View>
                ) : null}

                {/* Suggested message */}
                {detail.suggested_message ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>SUGGESTED MESSAGE</Text>
                    <View style={styles.messageBox}>
                      <Text style={styles.messageText}>{detail.suggested_message}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Score + urgency */}
                <View style={styles.metaRow}>
                  <View style={[styles.urgencyBadge, { 
                    backgroundColor: detail.urgency === 'high' ? '#EF444420' : 
                                     detail.urgency === 'medium' ? '#F59E0B20' : '#22C55E20' 
                  }]}>
                    <Text style={[styles.urgencyText, {
                      color: detail.urgency === 'high' ? '#EF4444' : 
                             detail.urgency === 'medium' ? '#F59E0B' : '#22C55E'
                    }]}>{detail.urgency?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.scoreText}>Score: {Math.round(detail.score * 100)}%</Text>
                </View>
              </>
            ) : (
              <Text style={styles.detailText}>{action.supporting}</Text>
            )}

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              {(action.type === 'call' || action.type === 'sms') && action.phone ? (
                <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
                  <Ionicons name="call" size={20} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Call</Text>
                </TouchableOpacity>
              ) : null}

              {action.phone ? (
                <TouchableOpacity style={[styles.actionBtn, styles.textBtn]} onPress={handleText}>
                  <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Text</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={[styles.actionBtn, styles.emailBtn]} onPress={handleEmail}>
                <Ionicons name="mail" size={20} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Email</Text>
              </TouchableOpacity>

              {action.website ? (
                <TouchableOpacity style={[styles.actionBtn, styles.webBtn]} onPress={handleWebsite}>
                  <Ionicons name="globe" size={20} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Web</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Done / Skip */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.doneBtn} onPress={() => { onAct(); onClose(); }}>
                <Text style={styles.doneBtnText}>Done — I handled this</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------- Card View ----------

function ActionCardView({ action, onTap }: { action: Action; onTap: () => void }) {
  const badgeColor = BADGE_COLORS[action.type] || '#8B5CF6';
  const badgeLabel = BADGE_LABELS[action.type] || action.type.toUpperCase();

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onTap}>
      <View style={styles.card}>
        <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>

        <Text style={styles.contactName} numberOfLines={2}>
          {action.contact || action.account}
        </Text>

        <Text style={styles.company} numberOfLines={1}>
          {action.account}
          {action.territory ? ` · ${action.territory}` : ''}
        </Text>

        {action.revenue && action.revenue[1] > 0 && (
          <View style={styles.revBadge}>
            <Text style={styles.revText}>
              ${Math.round(action.revenue[0]).toLocaleString()}–${Math.round(action.revenue[1]).toLocaleString()}
            </Text>
          </View>
        )}

        <Text style={styles.reason}>{action.reason}</Text>

        {/* What this advances */}
        {(action as any).advances ? (
          <View style={styles.advancesBadge}>
            <Ionicons name="trending-up" size={14} color="#4A9EFF" />
            <Text style={styles.advancesText}>{(action as any).advances}</Text>
          </View>
        ) : null}

        {/* Tap hint */}
        <View style={styles.tapHint}>
          <Ionicons name="chevron-up" size={16} color="#555566" />
          <Text style={styles.tapHintText}>tap for details</Text>
        </View>

        <View style={styles.hints}>
          <Text style={styles.hint}>← skip</Text>
          <Text style={styles.hint}>↑ later</Text>
          <Text style={styles.hint}>→ done</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---------- Swipeable Card ----------

function SwipeableCard({
  action,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  onTap,
}: {
  action: Action;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onSwipeUp: () => void;
  onTap: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const scale = useSharedValue(0.95);

  React.useEffect(() => {
    translateY.value = 60;
    cardOpacity.value = 0;
    scale.value = 0.95;
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    cardOpacity.value = withTiming(1, { duration: 250 });
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
  }, [action.id]);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = Math.min(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5, { damping: 15 });
        cardOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onSwipeRight)();
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5, { damping: 15 });
        cardOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        runOnJS(onSwipeLeft)();
      } else if (e.translationY < -SWIPE_UP_THRESHOLD) {
        translateY.value = withSpring(-SCREEN_HEIGHT, { damping: 15 });
        cardOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        runOnJS(onSwipeUp)();
      } else {
        translateX.value = withSpring(0, { damping: 20 });
        translateY.value = withSpring(0, { damping: 20 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: scale.value },
      ],
      opacity: cardOpacity.value,
    };
  });

  const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const upIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-SWIPE_UP_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.cardContainer}>
      <Animated.View style={[styles.indicator, styles.indicatorLeft, leftIndicatorStyle]}>
        <Text style={styles.indicatorTextSkip}>SKIP</Text>
      </Animated.View>
      <Animated.View style={[styles.indicator, styles.indicatorRight, rightIndicatorStyle]}>
        <Text style={styles.indicatorTextDone}>DONE</Text>
      </Animated.View>
      <Animated.View style={[styles.indicator, styles.indicatorTop, upIndicatorStyle]}>
        <Text style={styles.indicatorTextLater}>LATER</Text>
      </Animated.View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.cardWrapper, animatedStyle]}>
          <ActionCardView action={action} onTap={onTap} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ---------- Main Screen ----------

export default function CardsScreen() {
  const { actions, currentAction, currentIndex, remaining, loading, error, refresh, complete, skip, snooze } = useQueue();
  const [refreshing, setRefreshing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState<ActionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleTap = useCallback(async () => {
    if (!currentAction) return;
    setShowDetail(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await api.getActionDetail(currentAction.id);
      setDetailData(data);
    } catch (err) {
      console.warn('Failed to fetch action detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, [currentAction]);

  const handleDone = useCallback(() => {
    complete('completed');
  }, [complete]);

  const handleSkip = useCallback(() => {
    skip();
  }, [skip]);

  const handleSnooze = useCallback(() => {
    snooze();
  }, [snooze]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Activity counter */}
      <View style={styles.activityBar}>
        <Text style={styles.activityText}>
          {actions.length} action{actions.length !== 1 ? 's' : ''} today
        </Text>
        {remaining > 0 && (
          <Text style={styles.remainingText}>{remaining} remaining</Text>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {currentAction ? (
        <SwipeableCard
          key={currentAction.id}
          action={currentAction}
          onSwipeRight={handleDone}
          onSwipeLeft={handleSkip}
          onSwipeUp={handleSnooze}
          onTap={handleTap}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
        >
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyTitle}>You're clear.</Text>
          <Text style={styles.emptySubtitle}>Caddie's working on more.</Text>
          {actions.length > 0 && (
            <Text style={styles.emptyStat}>
              {actions.length} action{actions.length !== 1 ? 's' : ''} processed today
            </Text>
          )}
        </ScrollView>
      )}

      {/* Detail modal */}
      <DetailModal
        visible={showDetail}
        action={currentAction}
        detail={detailData}
        loading={detailLoading}
        onClose={() => setShowDetail(false)}
        onAct={handleDone}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  activityBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  activityText: { fontSize: 13, color: '#8888AA', fontWeight: '500' },
  remainingText: { fontSize: 13, color: '#4A9EFF', fontWeight: '600' },
  errorBanner: {
    backgroundColor: '#EF444420', marginHorizontal: 16, padding: 10,
    borderRadius: 8, marginBottom: 8,
  },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center' },
  cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardWrapper: { width: SCREEN_WIDTH - 32, maxHeight: SCREEN_HEIGHT - 250 },
  card: {
    backgroundColor: '#1A1A2E', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#2A2A3E', gap: 12,
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  contactName: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', lineHeight: 34 },
  company: { fontSize: 15, color: '#8888AA', fontWeight: '500' },
  revBadge: {
    alignSelf: 'flex-start', backgroundColor: '#22C55E20',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  revText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  reason: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', lineHeight: 26, marginTop: 4 },
  advancesBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#4A9EFF15', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, alignSelf: 'flex-start', marginTop: 4,
  },
  advancesText: { fontSize: 13, color: '#4A9EFF', fontWeight: '600' },
  supporting: { fontSize: 14, color: '#8888AA', lineHeight: 21 },
  tapHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 4,
  },
  tapHintText: { fontSize: 12, color: '#555566', fontWeight: '500' },
  hints: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 8,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2A2A3E',
  },
  hint: { fontSize: 12, color: '#555566', fontWeight: '500' },
  // Indicators
  indicator: { position: 'absolute', zIndex: 10, padding: 16, borderRadius: 12 },
  indicatorLeft: { left: 20, top: '45%' },
  indicatorRight: { right: 20, top: '45%' },
  indicatorTop: { top: 20, alignSelf: 'center' },
  indicatorTextSkip: { fontSize: 20, fontWeight: '800', color: '#EF4444', letterSpacing: 2 },
  indicatorTextDone: { fontSize: 20, fontWeight: '800', color: '#22C55E', letterSpacing: 2 },
  indicatorTextLater: { fontSize: 20, fontWeight: '800', color: '#F59E0B', letterSpacing: 2 },
  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100, gap: 12 },
  emptyIcon: { fontSize: 48, color: '#22C55E', marginBottom: 8 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  emptySubtitle: { fontSize: 15, color: '#8888AA' },
  emptyStat: { fontSize: 13, color: '#555566', marginTop: 20 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: SCREEN_HEIGHT * 0.85, minHeight: SCREEN_HEIGHT * 0.5,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  modalContactName: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  modalCompany: { fontSize: 15, color: '#8888AA', fontWeight: '500', marginBottom: 16 },
  modalReason: {
    fontSize: 17, fontWeight: '600', color: '#FFFFFF', lineHeight: 24,
    marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#2A2A3E',
  },
  detailSection: { marginBottom: 20 },
  detailLabel: {
    fontSize: 11, fontWeight: '700', color: '#4A9EFF', letterSpacing: 1.5, marginBottom: 8,
  },
  detailText: { fontSize: 15, color: '#CCCCDD', lineHeight: 22 },
  messageBox: {
    backgroundColor: '#0A0A0F', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  messageText: { fontSize: 14, color: '#CCCCDD', lineHeight: 21, fontStyle: 'italic' },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  urgencyText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  scoreText: { fontSize: 13, color: '#8888AA' },
  // Action buttons
  actionButtons: {
    flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, flex: 1, minWidth: 100,
    justifyContent: 'center',
  },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  callBtn: { backgroundColor: '#22C55E' },
  textBtn: { backgroundColor: '#F59E0B' },
  emailBtn: { backgroundColor: '#3B82F6' },
  webBtn: { backgroundColor: '#8B5CF6' },
  // Done button
  modalActions: { marginTop: 4, marginBottom: 20 },
  doneBtn: {
    backgroundColor: '#2A2A3E', padding: 16, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#3A3A4E',
  },
  doneBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
