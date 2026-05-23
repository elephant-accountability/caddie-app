import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { api } from '../../src/api/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'caddie';
  text: string;
  timestamp: Date;
  type?: 'text' | 'draft_email' | 'draft_sms' | 'link';
  meta?: {
    subject?: string;
    body?: string;
    url?: string;
    label?: string;
  };
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'caddie',
      text: 'Ask me anything about your accounts, contacts, or deals.',
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Use the /api/ask endpoint — it's contact-agnostic when no contact_id
      const result = await api.ask({ question: text, contact_id: '' });
      
      const caddieMsg: ChatMessage = {
        id: `caddie-${Date.now()}`,
        role: 'caddie',
        text: result.text,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, caddieMsg]);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'caddie',
        text: 'Couldn\'t reach the server. Try again.',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === 'user';

    if (msg.type === 'draft_email' && msg.meta) {
      return (
        <View key={msg.id} style={[styles.bubble, styles.caddieBubble]}>
          <View style={styles.draftHeader}>
            <Ionicons name="mail-outline" size={14} color={colors.actionEmail} />
            <Text style={styles.draftLabel}>Email Draft</Text>
          </View>
          {msg.meta.subject && (
            <Text style={styles.draftSubject}>{msg.meta.subject}</Text>
          )}
          <Text style={styles.messageText}>{msg.meta.body || msg.text}</Text>
          <View style={styles.draftActions}>
            <Pressable style={styles.draftBtn} onPress={() => {
              if (msg.meta?.body) {
                Linking.openURL(`mailto:?subject=${encodeURIComponent(msg.meta.subject || '')}&body=${encodeURIComponent(msg.meta.body)}`);
              }
            }}>
              <Text style={styles.draftBtnText}>Open in Mail</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (msg.type === 'link' && msg.meta?.url) {
      return (
        <View key={msg.id} style={[styles.bubble, styles.caddieBubble]}>
          <Text style={styles.messageText}>{msg.text}</Text>
          <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(msg.meta!.url!)}>
            <Ionicons name="open-outline" size={14} color={colors.actionEmail} />
            <Text style={styles.linkText}>{msg.meta.label || msg.meta.url}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View key={msg.id} style={[styles.bubble, isUser ? styles.userBubble : styles.caddieBubble]}>
        <Text style={[styles.messageText, isUser && styles.userText]}>{msg.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Caddie</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(renderMessage)}
          {loading && (
            <View style={[styles.bubble, styles.caddieBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Caddie..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            editable={!loading}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="arrow-up" size={20} color={!input.trim() || loading ? colors.textMuted : colors.navy} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  messages: {
    padding: 16,
    paddingBottom: 8,
    gap: 8,
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
  messageText: {
    fontSize: sizes.base,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  userText: {
    color: colors.navy,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: sizes.sm,
    color: colors.textSecondary,
  },

  // Drafts
  draftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  draftLabel: {
    fontSize: sizes.xs,
    fontWeight: '700',
    color: colors.actionEmail,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  draftSubject: {
    fontSize: sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  draftActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  draftBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.actionEmail + '20',
  },
  draftBtnText: {
    fontSize: sizes.sm,
    fontWeight: '600',
    color: colors.actionEmail,
  },

  // Links
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  linkText: {
    fontSize: sizes.sm,
    color: colors.actionEmail,
    textDecorationLine: 'underline',
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: sizes.base,
    color: colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.bgCard,
  },
});
