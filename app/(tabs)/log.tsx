import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useConversation, type ChatMessage } from '../../src/context/ConversationContext';
import { api } from '../../src/api/client';
import { useRouter } from 'expo-router';

export default function ChatScreen() {
  const { messages, isThinking, sendToConverse, addUserMessage, loadHistory } = useConversation();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [callingVapi, setCallingVapi] = useState(false);
  const router = useRouter();

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

  const handleMicPress = async () => {
    if (isRecording && recording) {
      // Stop recording
      try {
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        if (uri) {
          // Send recording to ingest
          setSending(true);
          addUserMessage('🎤 Voice message');
          try {
            const formData = new FormData();
            formData.append('audio', {
              uri,
              type: 'audio/m4a',
              name: 'recording.m4a',
            } as any);
            const result = await api.ingestConversation(formData);
            if (result.transcript) {
              await sendToConverse(result.transcript, { source: 'voice' });
            }
          } catch {
            await sendToConverse('I just sent a voice message', { source: 'voice' });
          } finally {
            setSending(false);
          }
        }
      } catch {
        setIsRecording(false);
        setRecording(null);
      }
    } else {
      // Start recording
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) return;

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
        setIsRecording(true);
      } catch {
        // Recording failed to start
      }
    }
  };

  const handleCallSam = async () => {
    if (callingVapi) return;
    setCallingVapi(true);
    try {
      await api.callSam();
      addUserMessage('📞 Called Sam');
    } catch {
      // Silent fail
    } finally {
      setCallingVapi(false);
    }
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Caddie</Text>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.headerBtn}
              onPress={handleCallSam}
              disabled={callingVapi}
            >
              <Ionicons
                name="call-outline"
                size={20}
                color={callingVapi ? '#555566' : '#4A9EFF'}
              />
            </Pressable>
            <Pressable
              style={styles.headerBtn}
              onPress={() => router.push('/settings' as any)}
            >
              <Ionicons name="settings-outline" size={20} color="#8888AA" />
            </Pressable>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>What's on your mind?</Text>
            </View>
          ) : messages.map(renderMessage)}

          {isThinking && (
            <View style={[styles.bubble, styles.caddieBubble, { marginBottom: 8 }]}>
              <ActivityIndicator size="small" color="#8888AA" />
              <Text style={[styles.msgText, { marginLeft: 8, color: '#8888AA' }]}>
                Thinking...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input row */}
        <View style={styles.inputRow}>
          {/* Mic button */}
          <Pressable
            style={[styles.micBtn, isRecording && styles.micBtnRecording]}
            onPress={handleMicPress}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={22}
              color={isRecording ? '#FFFFFF' : '#8888AA'}
            />
          </Pressable>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Caddie..."
            placeholderTextColor="#555566"
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!sending}
          />

          <Pressable
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  headerBtn: {
    padding: 4,
  },
  messages: {
    padding: 16,
    paddingBottom: 16,
    gap: 4,
  },
  msgRow: { marginBottom: 4 },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A9EFF',
    borderBottomRightRadius: 4,
  },
  caddieBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A2E',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  msgText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  time: {
    fontSize: 10,
    color: '#555566',
    marginTop: 2,
  },
  timeRight: { alignSelf: 'flex-end', marginRight: 4 },
  timeLeft: { alignSelf: 'flex-start', marginLeft: 4 },
  empty: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8888AA',
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    gap: 8,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  micBtnRecording: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A9EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.3,
  },
});
