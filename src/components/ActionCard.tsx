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

interface ActionCardProps {
  action: Action;
  onComplete: () => void;
  onSkip: () => void;
  onSnooze: () => void;
}

export function ActionCard({ action, onComplete, onSkip, onSnooze }: ActionCardProps) {
  const iconName = ACTION_ICONS[action.type] || 'ellipse-outline';
  const accentColor = ACTION_COLORS[action.type] || colors.blue;

  const handleCall = () => {
    if (action.phone) {
      const cleaned = action.phone.replace(/[^0-9+]/g, '');
      Linking.openURL(`tel:${cleaned}`);
    }
  };

  const handleEmail = () => {
    // TODO: open email composer with draft
  };

  const primaryAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (action.type === 'call' && action.phone) {
      handleCall();
    }
    onComplete();
  };

  // Parse supporting text into lines, strip timing notes for main display
  const supportLines = (action.supporting || '').split('\n').filter(l => l.trim());
  const timingLine = supportLines.find(l => l.includes('⏰'));
  const mainSupport = supportLines.filter(l => !l.includes('⏰')).join(' ');

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      {/* Header: type badge + account */}
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: accentColor + '20' }]}>
          <Ionicons name={iconName as any} size={16} color={accentColor} />
          <Text style={[styles.typeText, { color: accentColor }]}>
            {action.type.toUpperCase()}
          </Text>
        </View>
        {action.time && (
          <Text style={styles.timeEstimate}>{action.time}m</Text>
        )}
      </View>

      {/* Contact / Account */}
      <Text style={styles.contactName}>
        {action.contact || action.account}
      </Text>
      {action.contact && action.account !== action.contact && (
        <Text style={styles.accountName}>{action.account}</Text>
      )}

      {/* Reason — the context string */}
      <Text style={styles.reason}>{action.reason}</Text>

      {/* Supporting detail */}
      {mainSupport ? (
        <Text style={styles.supporting} numberOfLines={3}>
          {mainSupport}
        </Text>
      ) : null}

      {/* Revenue range */}
      {action.revenue && action.revenue[1] > 0 && (
        <View style={styles.revenueBadge}>
          <Text style={styles.revenueText}>
            ${Math.round(action.revenue[0]).toLocaleString()}–${Math.round(action.revenue[1]).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Timing advisory */}
      {timingLine && (
        <Text style={styles.timing}>{timingLine.replace('⏰ ', '')}</Text>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, styles.skipBtn]}
          onPress={() => { Haptics.selectionAsync(); onSkip(); }}
        >
          <Ionicons name="close" size={20} color={colors.textMuted} />
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.snoozeBtn]}
          onPress={() => { Haptics.selectionAsync(); onSnooze(); }}
        >
          <Ionicons name="time-outline" size={20} color={colors.warning} />
          <Text style={styles.snoozeText}>Later</Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.doneBtn, { backgroundColor: accentColor }]}
          onPress={primaryAction}
        >
          <Ionicons
            name={action.type === 'call' ? 'call' : 'checkmark'}
            size={20}
            color="#fff"
          />
          <Text style={styles.doneText}>
            {action.type === 'call' ? 'Call' : 'Done'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
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
  typeText: {
    fontSize: sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  timeEstimate: {
    fontSize: sizes.sm,
    color: colors.textMuted,
  },
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
  revenueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  revenueText: {
    fontSize: sizes.sm,
    color: colors.success,
    fontWeight: '600',
  },
  timing: {
    fontSize: sizes.xs,
    color: colors.warning,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  skipBtn: {
    backgroundColor: colors.bgInput,
  },
  snoozeBtn: {
    backgroundColor: colors.warning + '15',
  },
  doneBtn: {},
  skipText: {
    color: colors.textMuted,
    fontSize: sizes.sm,
    fontWeight: '600',
  },
  snoozeText: {
    color: colors.warning,
    fontSize: sizes.sm,
    fontWeight: '600',
  },
  doneText: {
    color: '#fff',
    fontSize: sizes.sm,
    fontWeight: '700',
  },
});
