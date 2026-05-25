import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import type { VaultUploadsResponse } from '../../src/types/api';

export default function VaultScreen() {
  const [uploads, setUploads] = useState<VaultUploadsResponse['uploads']>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadVault = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getVaultUploads();
      setUploads(data.uploads || []);
      setCount(data.count || 0);
    } catch {
      // Non-critical
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

  const filteredUploads = search.trim()
    ? uploads.filter(u => 
        (u.filename || u.id).toLowerCase().includes(search.toLowerCase())
      )
    : uploads;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vault</Text>
        <Text style={styles.subtitle}>
          {count > 0 ? `${count} items` : 'Your files & recordings'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#555566" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vault..."
          placeholderTextColor="#555566"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : (
          <>
            {/* Recent section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent</Text>
              {filteredUploads.length > 0 ? (
                filteredUploads.map((u, i) => (
                  <View key={u.id || i} style={styles.fileRow}>
                    <View style={styles.fileIcon}>
                      <Ionicons name="document-text-outline" size={20} color="#4A9EFF" />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {u.filename || u.id}
                      </Text>
                      {u.upload_date && (
                        <Text style={styles.fileDate}>
                          {new Date(u.upload_date).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#555566" />
                  </View>
                ))
              ) : (
                <View style={styles.emptySection}>
                  <Ionicons name="folder-open-outline" size={32} color="#555566" />
                  <Text style={styles.emptyText}>No recent files</Text>
                  <Text style={styles.emptySubtext}>
                    Recordings and documents will appear here
                  </Text>
                </View>
              )}
            </View>

            {/* Projects section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projects</Text>
              <View style={styles.projectGrid}>
                {['Accounts', 'Recordings', 'Notes', 'Reports'].map((name) => (
                  <Pressable key={name} style={styles.projectCard}>
                    <Ionicons
                      name={
                        name === 'Accounts' ? 'people-outline' :
                        name === 'Recordings' ? 'mic-outline' :
                        name === 'Notes' ? 'create-outline' :
                        'bar-chart-outline'
                      }
                      size={24}
                      color="#8888AA"
                    />
                    <Text style={styles.projectName}>{name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB upload button */}
      <Pressable style={styles.fab} onPress={() => { /* Upload action stub */ }}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8888AA',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  searchIcon: {
    paddingLeft: 14,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8888AA',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
    gap: 12,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#4A9EFF15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fileDate: {
    fontSize: 12,
    color: '#555566',
    marginTop: 2,
  },
  emptySection: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8888AA',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#555566',
    textAlign: 'center',
  },
  projectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  projectCard: {
    width: '47%',
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A9EFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A9EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
