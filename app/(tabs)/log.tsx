import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { useConversation, type ChatMessage } from '../../src/context/ConversationContext';

export default function ChatScreen() {
  const { messages, loadHistory } = useConversation();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === 'user';
    return (
      <View key={msg.id} style={styles.msgRow}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.caddieBubble]}>
          <Text style={[styles.msgText, isUser && styles.userText]}>{msg.text}</Text>
        </View>
        <Text style={[styles.time, isUser ? styles.timeRight : styles.timeLeft]}>
          {formatTime(msg.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Caddie</Text>
        <Text style={styles.subtitle}>Conversation history</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.messages}
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Your conversations with Caddie will appear here. Use the Caddie button to start.
            </Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  messages: {
    padding: 16,
    paddingBottom: 100,
    gap: 4,
  },
  msgRow: {
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.white,
    borderBottomRightRadius: 4,
  },
  caddieBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgText: {
    fontSize: sizes.base,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  userText: {
    color: colors.navy,
  },
  time: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  timeRight: { alignSelf: 'flex-end', marginRight: 4 },
  timeLeft: { alignSelf: 'flex-start', marginLeft: 4 },
  empty: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
