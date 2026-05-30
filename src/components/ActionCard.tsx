import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Share,
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
  onShare?: () => void;
}

export function ActionCard({
  action, onDone, onSkip, onSnooze, onTapContact, onShare,
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

  const handleWebsite = () => {
    if (action.website) {
      Linking.openURL(action.website);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const name = action.contact || action.account;
    const lines = [name];
    if (action.account && action.contact) lines.push(action.account);
    if (action.reason) lines.push(action.reason);
    if (action.phone) lines.push(action.phone);
    if (action.website) lines.push(action.website);
    try {
      await Share.share({ message: lines.join('\n') });
      onShare?.();
    } catch {}
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadges}>
          <View style={[styles.typeBadge, { borderColor: accentColor }]}>
            <Ionicons name={iconName} size={16} color={accentColor} />
            <Text style={[styles.typeText, { color: accentColor }]}>
              {action.type.toUpperCase()}
            </Text>
          </View>
          {action.urgency === 'high' && (
            <View style={[styles.urgencyDot, { backgroundColor: '#EF4444' }]} />
          )}
          {action.urgency === 'medium' && (
            <View style={[styles.urgencyDot, { backgroundColor: '#F59E0B' }]} />
          )}
        </View>
        <View style={styles.headerRight}>
          {action.executor === 'autonomous' && (
            <View style={styles.autonomousBadge}>
              <Ionicons name="flash-outline" size={12} color={colors.textMuted} />
              <Text style={styles.autonomousText}>Caddie handled</Text>
            </View>
          )}
          {action.time ? (
            <Text style={styles.timeEst}>{action.time}m</Text>
          ) : null}
        </View>
      </View>

      {/* Contact */}
      <Pressable onPress={onTapContact} accessibilityRole="button" accessibilityLabel={`View ${action.contact || action.account}`}>
        <Text style={styles.contactName}>{action.contact || action.contact_name || action.account}</Text>
      </Pressable>
      {action.category && (
        <Text style={styles.categoryLabel}>{action.category}</Text>
      )}
      {action.contact && action.account !== action.contact && (
        <Text style={styles.accountName}>{action.account}</Text>
      )}

      {/* Reason */}
      <Text style={styles.reason}>{action.reason}</Text>

      {action.supporting ? (
        <Text style={styles.supporting} numberOfLines={3}>{action.supporting}</Text>
      ) : null}

      {/* Vault references */}
      {action.vault_refs && action.vault_refs.length > 0 && (
        <View style={styles.vaultRefRow}>
          <Ionicons name="document-text-outline" size={13} color={colors.textMuted} />
          <Text style={styles.vaultRefText}>
            Grounded in {action.vault_refs.length} source{action.vault_refs.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

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

      {/* Website link */}
      {action.website && (
        <Pressable style={styles.webBtn} onPress={handleWebsite} accessibilityRole="link">
          <Ionicons name="globe-outline" size={16} color={colors.actionEmail} />
          <Text style={styles.webText} numberOfLines={1}>{action.website.replace('https://', '')}</Text>
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
          style={[styles.btn, styles.shareBtn]}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share lead"
        >
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.shareText}>Share</Text>
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
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  autonomousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    opacity: 0.7,
  },
  autonomousText: {
    fontSize: sizes.xs,
    color: colors.textMuted,
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
  categoryLabel: {
    fontSize: sizes.xs,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  vaultRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  vaultRefText: {
    fontSize: sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
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
  shareBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareText: { color: colors.textSecondary, fontSize: sizes.sm, fontWeight: '600' },
  webBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 8,
  },
  webText: {
    fontSize: sizes.sm,
    color: colors.actionEmail,
    textDecorationLine: 'underline',
    flex: 1,
  },
});
