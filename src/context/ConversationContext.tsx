import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getDB } from '../offline/db';

export interface ChatMessage {
  id: string;
  role: 'user' | 'caddie';
  text: string;
  timestamp: number;
}

interface ConversationContextType {
  messages: ChatMessage[];
  addUserMessage: (text: string) => ChatMessage;
  addCaddieResponse: (text: string) => ChatMessage;
  loadHistory: () => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const db = await getDB();
      // Create table if not exists
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          role TEXT NOT NULL,
          text TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
      `);
      const rows = await db.getAllAsync<ChatMessage>(
        'SELECT id, role, text, timestamp FROM chat_messages ORDER BY timestamp ASC LIMIT 500'
      );
      setMessages(rows);
    } catch {}
  }, []);

  const persist = useCallback(async (msg: ChatMessage) => {
    try {
      const db = await getDB();
      await db.runAsync(
        'INSERT OR REPLACE INTO chat_messages (id, role, text, timestamp) VALUES (?, ?, ?, ?)',
        [msg.id, msg.role, msg.text, msg.timestamp]
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

  const addCaddieResponse = useCallback((text: string): ChatMessage => {
    const msg: ChatMessage = {
      id: `caddie-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'caddie',
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
    persist(msg);
    return msg;
  }, [persist]);

  return (
    <ConversationContext.Provider value={{ messages, addUserMessage, addCaddieResponse, loadHistory }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation(): ConversationContextType {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error('useConversation must be inside ConversationProvider');
  return ctx;
}
