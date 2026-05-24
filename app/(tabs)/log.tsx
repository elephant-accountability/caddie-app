import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../src/theme/colors';
import { sizes } from '../../src/theme/typography';
import { useConversation, type ChatMessage } from '../../src/context/ConversationContext';

export default function ChatScreen() {
  const { messages, isThinking, sendToConverse, addUserMessage, loadHistory } = useConversation();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    addUserMessage(text);
    try { await sendToConverse(text, { source: 'chat' }); }
    finally { setSending(false); }
  };

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
      <KeyboardAvoidingView style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}>
        <View style={styles.header}>
          <Text style={styles.title}>Caddie</Text>
        </View>
        <ScrollView ref={scrollRef} style={styles.flex}
          contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
          {messages.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>What\'s on your mind?</Text>
            </View>
          ) : messages.map(renderMessage)}
          {isThinking && (
            <View style={[styles.bubble, styles.caddieBubble, { marginBottom: 8 }]}>
              <ActivityIndicator size="small" color="#999" />
              <Text style={[styles.msgText, { marginLeft: 8, color: '#999' }]}>Thinking...</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={input} onChangeText={setInput}
            placeholder="Ask Caddie..." placeholderTextColor="#999"
            returnKeyType="send" onSubmitEditing={handleSend} editable={!sending} />
          <TouchableOpacity style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend} disabled={!input.trim() || sending}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  messages: { padding: 16, paddingBottom: 16, gap: 4 },
  msgRow: { marginBottom: 4 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.white, borderBottomRightRadius: 4 },
  caddieBubble: { alignSelf: 'flex-start', backgroundColor: colors.bgCard, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  msgText: { fontSize: sizes.base, color: colors.textPrimary, lineHeight: 22 },
  userText: { color: colors.navy },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  timeRight: { alignSelf: 'flex-end', marginRight: 4 },
  timeLeft: { alignSelf: 'flex-start', marginLeft: 4 },
  empty: { paddingVertical: 60, paddingHorizontal: 40, alignItems: 'center' },
  emptyText: { fontSize: sizes.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  inputRow: { flexDirection: 'row', padding: 12, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.bg, alignItems: 'center', gap: 8 },
  input: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: sizes.base, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  sendBtn: { backgroundColor: colors.navy, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: colors.white, fontWeight: '600', fontSize: sizes.sm },
});
