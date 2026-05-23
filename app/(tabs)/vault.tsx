import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import type { VaultUploadsResponse } from '../../src/types/api';

export default function VaultScreen() {
  const [uploads, setUploads] = useState<VaultUploadsResponse['uploads']>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVault = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getVaultUploads();
      setUploads(data.uploads || []);
      setCount(data.count || 0);
    } catch {
      // Vault list is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVault();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
        }
      >
        <View style={styles.header}>
          <Ionicons name="archivebox-outline" size={32} color={colors.white} />
          <Text style={styles.title}>Vault</Text>
          <Text style={styles.subtitle}>
            {count > 0 ? `${count} documents uploaded` : 'No documents yet'}
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.white} />
          </View>
        ) : (
          <View style={styles.stubBox}>
            <Ionicons name="cloud-upload-outline" size={40} color={colors.textMuted} />
            <Text style={styles.stubTitle}>Upload coming in Phase 2</Text>
            <Text style={styles.stubText}>
              Document upload, search, and management will be available in the next release.
            </Text>
          </View>
        )}

        {uploads.length > 0 && (
          <View style={styles.list}>
            {uploads.map((u, i) => (
              <View key={i} style={styles.uploadRow}>
                <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.uploadName} numberOfLines={1}>{u.filename || u.id}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32, gap: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.white },
  subtitle: { fontSize: sizes.sm, color: colors.textSecondary },
  loading: { paddingVertical: 80, alignItems: 'center' },
  stubBox: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stubTitle: { fontSize: sizes.base, fontWeight: '600', color: colors.white, textAlign: 'center' },
  stubText: { fontSize: sizes.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  list: { marginTop: 16, gap: 8 },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  uploadName: { fontSize: sizes.sm, color: colors.white, flex: 1 },
});
