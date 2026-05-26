import React, { useRef, useEffect, useCallback, useMemo } from 'react';
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

const ACTION_ICONS: Record<Action['type'], keyof typeof Ionicons.glyphMap> = {
  call: 'call-outline',
  email: 'mail-outline',
  sms: 'chatbubble-outline',
  research: 'search-outline',
};

const ACTION_COLORS: Record<Action['type'], string> = {
  call: colors.actionCall,
  email: colors.actionEmail,
  sms: colors.actionSms,
  research: colors.actionResearch,
};

interface Props {
  action: Action;
  onSwipeRight: () => void;  // opens outcome picker
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
  const screenWidth = useRef(Dimensions.get('window').width).current;
  const swipeThreshold = screenWidth * 0.3;
  const swipeUpThreshold = 120;

  // Reset animated values when the action changes (new card appears)
  // Use action.id + a reset counter to force reset even if same action
  const [resetCount, setResetCount] = React.useState(0);
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    opacity.setValue(1);
  }, [action.id, resetCount, pan, opacity]);

  // Store callbacks in refs to avoid stale closures in PanResponder
  const callbacksRef = useRef({ onSwipeRight, onSwipeLeft, onSwipeUp });
  useEffect(() => {
    callbacksRef.current = { onSwipeRight, onSwipeLeft, onSwipeUp };
  }, [onSwipeRight, onSwipeLeft, onSwipeUp]);

  const swipingRef = useRef(false);

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        if (swipingRef.current) return false;
        const absX = Math.abs(g.dx);
        const absY = Math.abs(g.dy);
        // Only claim gesture if:
        // - Horizontal movement dominates (swipe left/right to act/skip)
        // - OR a fast upward flick (swipe up to snooze) — velocity check prevents
        //   stealing normal scroll. Must be clearly intentional.
        const isHorizontalSwipe = absX > 15 && absX > absY * 1.5;
        const isUpwardFlick = g.dy < -30 && absY > absX * 2 && g.vy < -0.3;
        return isHorizontalSwipe || isUpwardFlick;
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, g) => {
        if (swipingRef.current) return;
        if (g.dx > swipeThreshold) {
          swipingRef.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.parallel([
            Animated.timing(pan.x, { toValue: screenWidth, duration: 200, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: false }),
          ]).start(() => { swipingRef.current = false; callbacksRef.current.onSwipeRight(); });
        } else if (g.dx < -swipeThreshold) {
          swipingRef.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.parallel([
            Animated.timing(pan.x, { toValue: -screenWidth, duration: 200, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: false }),
          ]).start(() => { swipingRef.current = false; callbacksRef.current.onSwipeLeft(); });
        } else if (g.dy < -swipeUpThreshold) {
          swipingRef.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.parallel([
            Animated.timing(pan.y, { toValue: -600, duration: 250, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: false }),
          ]).start(() => { swipingRef.current = false; callbacksRef.current.onSwipeUp(); });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 6,
          }).start();
        }
      },
    }),
    [pan, opacity, screenWidth, swipeThreshold, swipeUpThreshold]
  );

  const accentColor = ACTION_COLORS[action.type] || colors.actionEmail;
  const iconName = ACTION_ICONS[action.type] || 'ellipse-outline';

  // Swipe indicators
  const rightOpacity = pan.x.interpolate({
    inputRange: [0, swipeThreshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const leftOpacity = pan.x.interpolate({
    inputRange: [-swipeThreshold, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const upOpacity = pan.y.interpolate({
    inputRange: [-swipeUpThreshold, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const cardRotation = pan.x.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  const supportLines = (action.supporting || '').split('\n').filter((l: string) => l.trim());
  const timingLine = supportLines.find((l: string) => l.includes('\u23f0'));
  const mainSupport = supportLines.filter((l: string) => !l.includes('\u23f0')).join(' ');

  const handleCall = useCallback(() => {
    if (action.phone) {
      const cleaned = action.phone.replace(/[^0-9+]/g, '');
      Linking.openURL('tel:' + cleaned);
    }
  }, [action.phone]);

  return (
    <View style={styles.wrapper}>
      {/* Background indicators */}
      <Animated.View style={[styles.indicator, styles.rightIndicator, { opacity: rightOpacity }]}>
        <Ionicons name="checkmark-circle" size={40} color={colors.forest} />
        <Text style={[styles.indicatorText, { color: colors.forest }]}>Done</Text>
      </Animated.View>
      <Animated.View style={[styles.indicator, styles.leftIndicator, { opacity: leftOpacity }]}>
        <Ionicons name="close-circle" size={40} color={colors.textMuted} />
        <Text style={[styles.indicatorText, { color: colors.textMuted }]}>Skip</Text>
      </Animated.View>
      <Animated.View style={[styles.indicator, styles.upIndicator, { opacity: upOpacity }]}>
        <Ionicons name="time" size={40} color={colors.amber} />
        <Text style={[styles.indicatorText, { color: colors.amber }]}>Later</Text>
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
            <Ionicons name={iconName} size={16} color={accentColor} />
            <Text style={[styles.typeText, { color: accentColor }]}>
              {action.type.toUpperCase()}
            </Text>
          </View>
          {action.time ? (
            <Text style={styles.timeEst}>{action.time}m</Text>
          ) : null}
        </View>

        {/* Contact */}
        <Pressable onPress={onTapContact} accessibilityRole="button" accessibilityLabel={'View ' + (action.contact || action.account)}>
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
              ${Math.round(action.revenue[0]).toLocaleString()}\u2013${Math.round(action.revenue[1]).toLocaleString()}
            </Text>
          </View>
        )}

        {timingLine && (
          <Text style={styles.timing}>{timingLine.replace('\u23f0 ', '')}</Text>
        )}

        {/* Bottom action buttons — tap alternatives to swipe */}
        <View style={styles.btnRow}>
          {action.type === 'call' && action.phone && (
            <Pressable
              style={[styles.btn, { backgroundColor: accentColor }]}
              onPress={handleCall}
              accessibilityRole="button"
              accessibilityLabel={'Call ' + (action.contact || action.account)}
            >
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.btnTextLight}>Call now</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.btn, styles.btnOutline]}
            onPress={onTapAction}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
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
  rightIndicator: { right: 30, top: 120 },
  leftIndicator: { left: 30, top: 120 },
  upIndicator: { alignSelf: 'center', top: 20, width: '100%', alignItems: 'center' },
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
    backgroundColor: colors.forest + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  revText: { fontSize: sizes.sm, color: colors.forest, fontWeight: '600' },
  timing: { fontSize: sizes.xs, color: colors.amber, marginBottom: 12 },
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
