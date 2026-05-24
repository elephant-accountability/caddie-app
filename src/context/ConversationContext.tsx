import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { getDB } from '../offline/db';
import { api } from '../api/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'caddie';
  text: string;
  timestamp: number;
  intent?: string;
  suggestedActions?: Array<{ type: string; title: string; contact_id?: string; pattern_id?: string }>;
}

interface ConversationContextType {
  messages: ChatMessage[];
  conversationId: string | null;
  isThinking: boolean;
  addUserMessage: (text: string) => ChatMessage;
  addCaddieResponse: (text: string, intent?: string, suggestedActions?: ChatMessage['suggestedActions']) => ChatMessage;
  sendToConverse: (text: string, opts?: { source?: 'pill' | 'voice' | 'chat'; intentHint?: 'BRAINSTORM'; patternId?: string }) => Promise<string>;
  startBrainstorm: (patternId: string) => Promise<void>;
  loadHistory: () => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const convIdRef = useRef<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const db = await getDB();
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          role TEXT NOT NULL,
          text TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          intent TEXT,
          suggested_actions TEXT
        );
      `);
      const rows = await db.getAllAsync<ChatMessage>(
        'SELECT id, role, text, timestamp, intent FROM chat_messages ORDER BY timestamp ASC LIMIT 500'
      );
      setMessages(rows);
    } catch {}
  }, []);

  const persist = useCallback(async (msg: ChatMessage) => {
    try {
      const db = await getDB();
      await db.runAsync(
        'INSERT OR REPLACE INTO chat_messages (id, role, text, timestamp, intent) VALUES (?, ?, ?, ?, ?)',
        [msg.id, msg.role, msg.text, msg.timestamp, msg.intent || null]
      );
    } catch {}
  }, []);

  const addUserMessage = useCallback((text: string): ChatMessage => {
    const msg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
    persist(msg);
    return msg;
  }, [persist]);

  const addCaddieResponse = useCallback((
    text: string,
    intent?: string,
    suggestedActions?: ChatMessage['suggestedActions'],
  ): ChatMessage => {
    const msg: ChatMessage = {
      id: `caddie-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'caddie',
      text,
      timestamp: Date.now(),
      intent,
      suggestedActions,
    };
    setMessages(prev => [...prev, msg]);
    persist(msg);
    return msg;
  }, [persist]);

  const sendToConverse = useCallback(async (
    text: string,
    opts?: { source?: 'pill' | 'voice' | 'chat'; intentHint?: 'BRAINSTORM'; patternId?: string },
  ): Promise<string> => {
    setIsThinking(true);
    try {
      const result = await api.converse({
        text,
        conversation_id: convIdRef.current || undefined,
        source: opts?.source || 'chat',
        intent_hint: opts?.intentHint,
        pattern_id: opts?.patternId,
      });

      // Track conversation_id from backend
      if (result.conversation_id) {
        convIdRef.current = result.conversation_id;
        setConversationId(result.conversation_id);
      }

      addCaddieResponse(result.reply, result.intent, result.suggested_actions);
      return result.reply;
    } catch (err) {
      // Fallback to /api/ask if /api/converse fails
      try {
        const fallback = await api.ask({ question: text, contact_id: '' });
        const reply = fallback.answer || fallback.text || 'Sorry, I couldn\'t process that.';
        addCaddieResponse(reply);
        return reply;
      } catch {
        const errMsg = 'Having trouble connecting. Try again in a moment.';
        addCaddieResponse(errMsg);
        return errMsg;
      }
    } finally {
      setIsThinking(false);
    }
  }, [addCaddieResponse]);

  const startBrainstorm = useCallback(async (patternId: string) => {
    // Start a fresh conversation for brainstorm
    convIdRef.current = null;
    setConversationId(null);
    addUserMessage("Let's think through that pattern");
    await sendToConverse("Let's think through that pattern", {
      source: 'chat',
      intentHint: 'BRAINSTORM',
      patternId,
    });
  }, [addUserMessage, sendToConverse]);

  return (
    <ConversationContext.Provider value={{
      messages, conversationId, isThinking,
      addUserMessage, addCaddieResponse, sendToConverse, startBrainstorm, loadHistory,
    }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation(): ConversationContextType {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error('useConversation must be inside ConversationProvider');
  return ctx;
}
