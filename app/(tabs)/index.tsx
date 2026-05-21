import React, { useState } from 'react';
import { SafeAreaView, ScrollView, RefreshControl, StyleSheet, View, ActivityIndicator } from 'react-native';
import { colors } from '../../src/theme/colors';
import { useQueue } from '../../src/hooks/useQueue';
import { MorningBrief } from '../../src/components/MorningBrief';

export default function BriefScreen() {
  const { actions, loading, refresh } = useQueue();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.blue} />
          </View>
        ) : (
          <MorningBrief actions={actions} date={new Date()} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  loading: { paddingVertical: 80, alignItems: 'center' },
});
