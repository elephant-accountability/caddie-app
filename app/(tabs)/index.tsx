import React, { useState } from 'react';
import { SafeAreaView, ScrollView, RefreshControl, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { useQueue } from '../../src/context/QueueContext';
import { MorningBrief } from '../../src/components/MorningBrief';
import { QuotaBar } from '../../src/components/QuotaBar';

export default function BriefScreen() {
  const { actions, loading, refresh, quota, remaining, skip, snooze, complete } = useQueue();
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
        }
      >
        <QuotaBar quota={quota} />

        {loading && !refreshing ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        ) : (
          <MorningBrief
            actions={actions}
            date={new Date()}
            onSkip={() => skip()}
            onSnooze={() => snooze()}
            onDone={() => complete('completed')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  content: { paddingBottom: 40 },
  loading: { paddingVertical: 80, alignItems: 'center' },
});
