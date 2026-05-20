import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { sizes } from '../theme/typography';

interface QueueHeaderProps {
  remaining: number;
  total: number;
  onRefresh: () => void;
}

export function QueueHeader({ remaining, total, onRefresh }: QueueHeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Your queue</Text>
        <Text style={styles.subtitle}>
          {remaining} of {total} actions remaining
        </Text>
      </View>
      <Pressable onPress={onRefresh} style={styles.refreshBtn}>
        <Ionicons name="refresh" size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: sizes.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
  },
});
