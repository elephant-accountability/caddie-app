import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import type { Action } from '../types/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_UP_THRESHOLD = 120;

const ACTION_ICONS: Record<string, string> = {
  call: 'call-outline',
  email: 'mail-outline',
  sms: 'chatbubble-outline',
  research: 'search-outline',
};

const ACTION_COLORS: Record<string, string> = {
  call: colors.actionCall,
  email: colors.actionEmail,
  sms: colors.actionSms,
  research: colors.actionResearch,
};

interface Props {
  action: Action;
  onSwipeRight: () => void;  // complete
  onSwipeLeft: () => void;   // skip
  onSwipeUp: () => void;     // snooze
  onTapContact: () => void;
  onTapAction: () => void;   // opens outcome picker
}

export function SwipeableActionCard({
  action, onSwipeRight, onSwipeLeft, onSwipeUp, onTapContact, onTapAction,
}: Props) {
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const accentColor = ACTION_COLORS[action.type] || colors.blue;
  const iconName = ACTION_ICONS[action.type] || 'ellipse-outline';

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          // Swipe right → complete
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.parallel([
            Animated.timing(pan.x, { toValue: SCREEN_WIDTH, duration: 200, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: false }),
          ]).start(onSwipeRight);
        } else if (g.dx < -SWIPE_THRESHOLD) {
          // Swipe left → skip
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.parallel([
            Animated.timing(pan.x, { toValue: -SCREEN_WIDTH, duration: 200, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: false }),
          ]).start(onSwipeLeft);
        } else if (g.dy < -SWIPE_UP_THRESHOLD) {
          // Swipe up → snooze
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.parallel([
            Animated.timing(pan.y, { toValue: -600, duration: 250, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: false }),
          ]).start(onSwipeUp);
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 6,
          }).start();
        }
      },
    })
  ).current;

  // Swipe indicators
  const rightOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const leftOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const upOpacity = pan.y.interpolate({
    inputRange: [-SWIPE_UP_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const cardRotation = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  const supportLines = (action.supporting || '').split('\n').filter(l => l.trim());
  const timingLine = supportLines.find(l => l.includes('⏰'));
  const mainSupport = supportLines.filter(l => !l.includes('⏰')).join(' ');

  const handleCall = () => {
    if (action.phone) {
      const cleaned = action.phone.replace(/[^0-9+]/g, '');
      Linking.openURL(`tel:${cleaned}`);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Background indicators */}
      <Animated.View style={[styles.indicator, styles.rightIndicator, { opacity: rightOpacity }]}>
        <Ionicons name="checkmark-circle" size={40} color={colors.success} />
        <Text style={[styles.indicatorText, { color: colors.success }]}>Done</Text>
      </Animated.View>
      <Animated.View style={[styles.indicator, styles.leftIndicator, { opacity: leftOpacity }]}>
        <Ionicons name="close-circle" size={40} color={colors.textMuted} />
        <Text style={[styles.indicatorText, { color: colors.textMuted }]}>Skip</Text>
      </Animated.View>
      <Animated.View style={[styles.indicator, styles.upIndicator, { opacity: upOpacity }]}>
        <Ionicons name="time" size={40} color={colors.warning} />
        <Text style={[styles.indicatorText, { color: colors.warning }]}>Later</Text>
      </Animated.View>

      {/* The card */}
      <Animated.View
        style={[
          styles.card,
          { borderLeftColor: accentColor },
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { rotate: cardRotation },
            ],
            opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: accentColor + '20' }]}>
            <Ionicons name={iconName as any} size={16} color={accentColor} />
            <Text style={[styles.typeText, { color: accentColor }]}>
              {action.type.toUpperCase()}
            </Text>
          </View>
          {action.time ? (
            <Text style={styles.timeEst}>{action.time}m</Text>
          ) : null}
        </View>

        {/* Contact — tappable */}
        <Pressable onPress={onTapContact}>
          <Text style={styles.contactName}>
            {action.contact || action.account}
          </Text>
        </Pressable>
        {action.contact && action.account !== action.contact && (
          <Text style={styles.accountName}>{action.account}</Text>
        )}

        {/* Reason */}
        <Text style={styles.reason}>{action.reason}</Text>

        {mainSupport ? (
          <Text style={styles.supporting} numberOfLines={3}>{mainSupport}</Text>
        ) : null}

        {/* Revenue */}
        {action.revenue && action.revenue[1] > 0 && (
          <View style={styles.revBadge}>
            <Text style={styles.revText}>
              ${Math.round(action.revenue[0]).toLocaleString()}–${Math.round(action.revenue[1]).toLocaleString()}
            </Text>
          </View>
        )}

        {timingLine && (
          <Text style={styles.timing}>{timingLine.replace('⏰ ', '')}</Text>
        )}

        {/* Bottom action buttons — tap alternatives to swipe */}
        <View style={styles.btnRow}>
          {action.type === 'call' && action.phone && (
            <Pressable style={[styles.btn, { backgroundColor: accentColor }]} onPress={handleCall}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.btnTextLight}>Call now</Text>
            </Pressable>
          )}
          <Pressable style={[styles.btn, styles.btnOutline]} onPress={onTapAction}>
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
            <Text style={styles.btnTextMuted}>More</Text>
          </Pressable>
        </View>

        {/* Swipe hint */}
        <Text style={styles.swipeHint}>swipe → done · ← skip · ↑ later</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    minHeight: 280,
  },
  indicator: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rightIndicator: { right: 30, top: '40%' },
  leftIndicator: { left: 30, top: '40%' },
  upIndicator: { alignSelf: 'center', top: 20, left: '42%' },
  indicatorText: { fontSize: sizes.sm, fontWeight: '700' },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  typeText: { fontSize: sizes.xs, fontWeight: '700', letterSpacing: 1 },
  timeEst: { fontSize: sizes.sm, color: colors.textMuted },
  contactName: {
    fontSize: sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  accountName: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  reason: {
    fontSize: sizes.base,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  supporting: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  revBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  revText: { fontSize: sizes.sm, color: colors.success, fontWeight: '600' },
  timing: { fontSize: sizes.xs, color: colors.warning, marginBottom: 12 },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  btnOutline: {
    backgroundColor: colors.bgInput,
  },
  btnTextLight: { color: '#fff', fontSize: sizes.sm, fontWeight: '700' },
  btnTextMuted: { color: colors.textSecondary, fontSize: sizes.sm, fontWeight: '600' },
  swipeHint: {
    fontSize: sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 0.5,
  },
});
