import React, { useState } from 'react';
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

interface MorningBriefProps {
  actions: Action[];
  date: Date;
  onSkip?: (action: Action) => void;
  onSnooze?: (action: Action) => void;
  onDone?: (action: Action) => void;
}

const ACTION_COLORS_MAP: Record<string, string> = {
  call: colors.actionCall,
  email: colors.actionEmail,
  sms: colors.actionSms,
  research: colors.actionResearch,
};

function ExpandedCard({ action, onSkip, onSnooze, onDone, onCollapse }: {
  action: Action;
  onSkip?: () => void;
  onSnooze?: () => void;
  onDone?: () => void;
  onCollapse: () => void;
}) {
  const accentColor = ACTION_COLORS_MAP[action.type] || colors.actionResearch;

  const handleCall = () => {
    if (action.phone) {
      const cleaned = action.phone.replace(/[^0-9+]/g, '');
      Linking.openURL('tel:' + cleaned);
    }
  };

  return (
    <View style={[es.card, { borderLeftColor: accentColor, borderLeftWidth: 3 }]}>  
      <Pressable onPress={onCollapse} style={es.collapseHit}>
        <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
      </Pressable>

      <Text style={es.name}>{action.contact || action.account}</Text>
      {action.contact && action.account !== action.contact && (
        <Text style={es.account}>{action.account}</Text>
      )}

      <Text style={es.reason}>{action.reason}</Text>

      {action.supporting ? (
        <Text style={es.supporting} numberOfLines={4}>{action.supporting}</Text>
      ) : null}

      {action.revenue && action.revenue[1] > 0 && (
        <View style={es.revBadge}>
          <Text style={es.revText}>
            ${Math.round(action.revenue[0]).toLocaleString()}–${Math.round(action.revenue[1]).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Deep link action */}
      {action.type === 'call' && action.phone && (
        <Pressable style={[es.actionBtn, { backgroundColor: accentColor }]} onPress={handleCall}>
          <Ionicons name="call" size={18} color={colors.navy} />
          <Text style={es.actionBtnText}>{action.phone}</Text>
        </Pressable>
      )}

      {/* Skip / Later / Done */}
      <View style={es.btnRow}>
        <Pressable style={es.btn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSkip?.(); }}>
          <Text style={es.btnText}>Skip</Text>
        </Pressable>
        <Pressable style={es.btn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSnooze?.(); }}>
          <Text style={es.btnText}>Later</Text>
        </Pressable>
        <Pressable style={[es.btn, es.doneBtn]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDone?.(); }}>
          <Text style={es.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function MorningBrief({ actions, date, onSkip, onSnooze, onDone }: MorningBriefProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const calls = actions.filter(a => a.type === 'call');
  const emails = actions.filter(a => a.type === 'email');

  const tradeShow = actions.filter(a => {
    const text = (a.reason + ' ' + (a.supporting || '')).toLowerCase();
    return text.includes('trade show') || text.includes('booth') ||
           text.includes('follow-up from') || text.includes('met at');
  });

  const handleTap = (a: Action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedId(expandedId === a.id ? null : a.id);
  };

  const handleAction = (a: Action, fn?: (action: Action) => void) => {
    fn?.(a);
    setExpandedId(null);
  };

  const renderItem = (a: Action, label?: string) => {
    if (expandedId === a.id) {
      return (
        <ExpandedCard
          key={a.id}
          action={a}
          onSkip={() => handleAction(a, onSkip)}
          onSnooze={() => handleAction(a, onSnooze)}
          onDone={() => handleAction(a, onDone)}
          onCollapse={() => setExpandedId(null)}
        />
      );
    }
    return (
      <Pressable key={a.id} style={styles.briefItem} onPress={() => handleTap(a)} accessibilityRole="button">
        {label ? (
          <Text style={styles.briefIndex}>{label}</Text>
        ) : (
          <View style={[styles.dot, { backgroundColor: colors.actionEmail }]} />
        )}
        <View style={styles.briefContent}>
          <Text style={styles.briefName} numberOfLines={1}>
            {a.contact || a.account}
          </Text>
          <Text style={styles.briefReason} numberOfLines={1}>
            {a.reason.split(/[.,]/)[0]}
          </Text>
        </View>
        <View style={[styles.typePill, {
          backgroundColor: (ACTION_COLORS_MAP[a.type] || colors.actionResearch) + '20',
        }]}>
          <Text style={[styles.typeLabel, {
            color: ACTION_COLORS_MAP[a.type] || colors.actionResearch,
          }]}>{a.type}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning</Text>
        <Text style={styles.date}>{dayName}, {dateStr}</Text>
      </View>

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
      </View>

      {tradeShow.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={16} color={colors.actionEmail} />
            <Text style={styles.sectionTitle}>Trade show follow-ups</Text>
          </View>
          {tradeShow.map(a => renderItem(a))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash-outline" size={16} color={colors.amber} />
          <Text style={styles.sectionTitle}>Priority actions</Text>
        </View>
        {actions.slice(0, 5).map((a, i) => renderItem(a, String(i + 1)))}
      </View>
    </View>
  );
}

// Expanded card styles
const es = StyleSheet.create({
  card: {
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
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  account: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  reason: {
    fontSize: sizes.base,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
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
    marginBottom: 10,
  },
  revText: { fontSize: sizes.sm, color: colors.forest, fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 10,
  },
  actionBtnText: { fontSize: sizes.base, fontWeight: '700', color: colors.navy },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: { color: colors.textSecondary, fontSize: sizes.sm, fontWeight: '600' },
  doneBtn: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  doneBtnText: { color: colors.navy, fontSize: sizes.sm, fontWeight: '700' },
});

// Main brief styles
const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 8 },
  header: { marginBottom: 24 },
  greeting: { fontSize: sizes.hero, fontWeight: '800', color: colors.textPrimary },
  date: { fontSize: sizes.lg, color: colors.textSecondary, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: sizes.xl, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: sizes.xs, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: sizes.base, fontWeight: '700', color: colors.textPrimary },
  briefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  briefIndex: { fontSize: sizes.sm, fontWeight: '700', color: colors.textMuted, width: 18 },
  briefContent: { flex: 1 },
  briefName: { fontSize: sizes.sm, fontWeight: '600', color: colors.textPrimary },
  briefReason: { fontSize: sizes.xs, color: colors.textMuted, marginTop: 1 },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeLabel: { fontSize: sizes.xs, fontWeight: '700' },
});
