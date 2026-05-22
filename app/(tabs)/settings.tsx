import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
  Alert,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { api } from '../../src/api/client';

const APP_VERSION = Constants.expoConfig?.version || '0.1.0';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    api.health()
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('offline'));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Server status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Server</Text>
            <View style={styles.statusBadge} accessibilityLabel={'Server ' + (serverStatus === 'online' ? 'connected' : serverStatus === 'checking' ? 'checking' : 'offline')}>
              <View style={[
                styles.statusDot,
                { backgroundColor: serverStatus === 'online' ? colors.success : serverStatus === 'checking' ? colors.warning : colors.danger },
              ]} />
              <Text style={[
                styles.statusText,
                { color: serverStatus === 'online' ? colors.success : serverStatus === 'checking' ? colors.warning : colors.danger },
              ]}>
                {serverStatus === 'checking' ? 'Checking...' :
                 serverStatus === 'online' ? 'Connected' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Push notifications</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: colors.border, true: colors.blue + '60' }}
              thumbColor={pushEnabled ? colors.blue : colors.textMuted}
              accessibilityLabel="Toggle push notifications"
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Pressable
            style={styles.row}
            onPress={() => {
              Alert.alert(
                'Export data',
                'Your Career OS is portable. Export all contacts, touches, and deal history as JSON.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Export', onPress: () => Alert.alert('Coming soon', 'Data export in v1.1') },
                ]
              );
            }}
            accessibilityRole="button"
            accessibilityLabel="Export your data"
          >
            <Text style={styles.rowLabel}>Export your data</Text>
            <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Build</Text>
            <Text style={styles.rowValue}>Caddie EDC by EA LLC</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Your relationships belong to you.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  title: {
    fontSize: sizes.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: sizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: sizes.base,
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: sizes.base,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: sizes.sm,
    fontWeight: '600',
  },
  footer: {
    fontSize: sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
  },
});
