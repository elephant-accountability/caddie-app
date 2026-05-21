import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import type { Action } from '../types/api';

interface MorningBriefProps {
  actions: Action[];
  date: Date;
}

export function MorningBrief({ actions, date }: MorningBriefProps) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const calls = actions.filter(a => a.type === 'call');
  const emails = actions.filter(a => a.type === 'email');
  const totalTime = actions.reduce((s, a) => s + (a.time || 0), 0);
  const totalRevMin = actions.reduce((s, a) => s + (a.revenue?.[0] || 0), 0);
  const totalRevMax = actions.reduce((s, a) => s + (a.revenue?.[1] || 0), 0);

  // Detect trade show follow-ups — look for common trigger patterns
  const tradeShow = actions.filter(a => {
    const text = (a.reason + ' ' + a.supporting).toLowerCase();
    return text.includes('trade show') || text.includes('booth') ||
           text.includes('follow-up from') || text.includes('met at');
  });

  const ACTION_COLORS_MAP: Record<string, string> = {
    call: colors.actionCall,
    email: colors.actionEmail,
    sms: colors.actionSms,
    research: colors.actionResearch,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning</Text>
        <Text style={styles.date}>{dayName}, {dateStr}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{actions.length}</Text>
          <Text style={styles.statLabel}>actions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{calls.length}</Text>
          <Text style={styles.statLabel}>calls</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{emails.length}</Text>
          <Text style={styles.statLabel}>emails</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalTime}m</Text>
          <Text style={styles.statLabel}>est. time</Text>
        </View>
      </View>

      {/* Revenue opportunity */}
      {totalRevMax > 0 && (
        <View style={styles.revCard}>
          <Ionicons name="trending-up" size={18} color={colors.success} />
          <Text style={styles.revText}>
            ${Math.round(totalRevMin).toLocaleString()}\u2013${Math.round(totalRevMax).toLocaleString()} in pipeline across today's actions
          </Text>
        </View>
      )}

      {/* Trade show section */}
      {tradeShow.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={16} color={colors.actionEmail} />
            <Text style={styles.sectionTitle}>Trade show follow-ups</Text>
          </View>
          {tradeShow.map(a => (
            <View key={a.id} style={styles.briefItem}>
              <View style={[styles.dot, { backgroundColor: colors.actionEmail }]} />
              <Text style={styles.briefText} numberOfLines={2}>
                {a.contact || a.account} \u2014 {a.reason.split('.')[0]}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Top actions preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash-outline" size={16} color={colors.warning} />
          <Text style={styles.sectionTitle}>Priority actions</Text>
        </View>
        {actions.slice(0, 5).map((a, i) => (
          <View key={a.id} style={styles.briefItem}>
            <Text style={styles.briefIndex}>{i + 1}</Text>
            <View style={styles.briefContent}>
              <Text style={styles.briefName}>
                {a.contact || a.account}
              </Text>
              <Text style={styles.briefReason} numberOfLines={1}>
                {a.reason.split(',')[0]}
              </Text>
            </View>
            <View style={[styles.typePill, {
              backgroundColor: (ACTION_COLORS_MAP[a.type] || colors.actionResearch) + '20',
            }]}>
              <Text style={[styles.typeLabel, {
                color: ACTION_COLORS_MAP[a.type] || colors.actionResearch,
              }]}>{a.type}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: sizes.hero,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  date: {
    fontSize: sizes.lg,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: sizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  revCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.success + '10',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  revText: {
    fontSize: sizes.sm,
    color: colors.success,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: sizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  briefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  briefText: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  briefIndex: {
    fontSize: sizes.sm,
    fontWeight: '700',
    color: colors.textMuted,
    width: 18,
  },
  briefContent: {
    flex: 1,
  },
  briefName: {
    fontSize: sizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  briefReason: {
    fontSize: sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeLabel: {
    fontSize: sizes.xs,
    fontWeight: '700',
  },
});
