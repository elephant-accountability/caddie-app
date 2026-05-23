import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';
import type { Quota } from '../types/api';

interface Props {
  quota: Quota | null;
  compact?: boolean;
}

export function QuotaBar({ quota, compact = false }: Props) {
  if (!quota) return null;

  const pct = Math.min(100, Math.max(0, quota.attainment_pct));
  const isBehind = quota.pace_status === 'behind';
  const barColor = isBehind ? colors.amber : colors.forest;

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={styles.row}>
        <Text style={styles.label}>
          {Math.round(pct)}% attainment
        </Text>
        <Text style={[styles.status, { color: barColor }]}>
          {isBehind ? 'Behind pace' : 'On pace'}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      {!compact && (
        <Text style={styles.detail}>
          ${Math.round(quota.ytd).toLocaleString()} of ${Math.round(quota.target).toLocaleString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  compact: {
    marginHorizontal: 0,
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  status: {
    fontSize: sizes.sm,
    fontWeight: '700',
  },
  track: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  detail: {
    fontSize: sizes.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
});
