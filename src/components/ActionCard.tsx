import React from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  onDone: () => void;
  onSkip: () => void;
  onSnooze: () => void;
  onTapContact: () => void;
}

export function ActionCard({
  action, onDone, onSkip, onSnooze, onTapContact,
}: Props) {
  const accentColor = ACTION_COLORS[action.type] || colors.white;
  const iconName = ACTION_ICONS[action.type] || 'ellipse-outline';

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDone();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  const handleSnooze = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSnooze();
  };

  const handleCall = () => {
    if (action.phone) {
      const cleaned = action.phone.replace(/[^0-9+]/g, '');
      Linking.openURL('tel:' + cleaned);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.typeBadge, { borderColor: accentColor }]}>
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
      <Pressable onPress={onTapContact} accessibilityRole="button" accessibilityLabel={`View ${action.contact || action.account}`}>
        <Text style={styles.contactName}>{action.contact || action.account}</Text>
      </Pressable>
      {action.contact && action.account !== action.contact && (
        <Text style={styles.accountName}>{action.account}</Text>
      )}

      {/* Reason */}
      <Text style={styles.reason}>{action.reason}</Text>

      {action.supporting ? (
        <Text style={styles.supporting} numberOfLines={3}>{action.supporting}</Text>
      ) : null}

      {/* Revenue */}
      {action.revenue && action.revenue[1] > 0 && (
        <View style={styles.revBadge}>
          <Text style={styles.revText}>
            ${Math.round(action.revenue[0]).toLocaleString()}–${Math.round(action.revenue[1]).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Call button */}
      {action.type === 'call' && action.phone && (
        <Pressable
          style={[styles.callBtn, { backgroundColor: accentColor }]}
          onPress={handleCall}
          accessibilityRole="button"
          accessibilityLabel={`Call ${action.contact || action.account}`}
        >
          <Ionicons name="call" size={18} color={colors.navy} />
          <Text style={styles.callText}>{action.phone}</Text>
        </Pressable>
      )}

      {/* Action buttons */}
      <View style={styles.btnRow}>
        <Pressable
          style={[styles.btn, styles.skipBtn]}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel={`Skip ${action.contact || action.account}`}
        >
          <Ionicons name="close-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.snoozeBtn]}
          onPress={handleSnooze}
          accessibilityRole="button"
          accessibilityLabel={`Snooze ${action.contact || action.account}`}
        >
          <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.snoozeText}>Later</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.doneBtn]}
          onPress={handleDone}
          accessibilityRole="button"
          accessibilityLabel={`Done with ${action.contact || action.account}`}
        >
          <Ionicons name="checkmark-outline" size={20} color={colors.navy} />
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderWidth: 1,
  },
  typeText: { fontSize: sizes.xs, fontWeight: '700', letterSpacing: 1 },
  timeEst: { fontSize: sizes.sm, color: colors.textMuted },
  contactName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  accountName: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  reason: {
    fontSize: sizes.base,
    color: colors.white,
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
    backgroundColor: colors.forest + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  revText: { fontSize: sizes.sm, color: colors.forest, fontWeight: '600' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  callText: { fontSize: sizes.base, fontWeight: '700', color: colors.navy },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  skipBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipText: { color: colors.textSecondary, fontSize: sizes.sm, fontWeight: '600' },
  snoozeBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  snoozeText: { color: colors.textSecondary, fontSize: sizes.sm, fontWeight: '600' },
  doneBtn: {
    backgroundColor: colors.white,
  },
  doneText: { color: colors.navy, fontSize: sizes.sm, fontWeight: '700' },
});
