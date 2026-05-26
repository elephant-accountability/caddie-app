/**
 * Caddie API capture methods — audio, photo, email, text.
 * 
 * These wrap the new /api/capture/* endpoints so any surface
 * (Share Sheet, Camera, File Picker, etc.) can push data to the vault.
 */

import Constants from 'expo-constants';
import { getToken } from '../auth/tokens';

const API_BASE = Constants.expoConfig?.extra?.apiUrl
  || process.env.EXPO_PUBLIC_API_URL
  || 'https://caddie-core.fly.dev';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return { 'X-Caddie-Rep-Id': 'chris-kenney' };
}

// ---------------------------------------------------------------------------
// Text capture (existing /api/capture)
// ---------------------------------------------------------------------------

export interface CaptureTextResult {
  id: string;
  raw_text: string;
  source: string;
  extracted: {
    contact_name: string | null;
    company: string | null;
    items_discussed: string[];
    action_items: { description: string; due_hint: string | null }[];
    sentiment: string | null;
  };
  stored: boolean;
}

export async function captureText(text: string, source: string = 'share_sheet'): Promise<CaptureTextResult> {
  const headers = await getAuthHeaders();
  const resp = await fetch(`${API_BASE}/api/capture`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source }),
  });
  if (!resp.ok) throw new Error(`Capture failed: ${resp.status}`);
  return resp.json();
}

// ---------------------------------------------------------------------------
// Audio capture (POST /api/capture/audio)
// ---------------------------------------------------------------------------

export interface CaptureAudioResult {
  id: string;
  transcription: string;
  extracted: {
    contact_name: string | null;
    company: string | null;
    items_discussed: string[];
    action_items: { description: string; due_hint: string | null }[];
    sentiment: string | null;
  };
  stored: boolean;
}

export async function captureAudio(fileUri: string, fileName: string): Promise<CaptureAudioResult> {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  
  // React Native FormData accepts { uri, name, type }
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: getMimeType(fileName),
  } as any);

  const resp = await fetch(`${API_BASE}/api/capture/audio`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!resp.ok) throw new Error(`Audio capture failed: ${resp.status}`);
  return resp.json();
}

// ---------------------------------------------------------------------------
// Photo capture (POST /api/capture/photo)
// ---------------------------------------------------------------------------

export interface CapturePhotoResult {
  id: string;
  model_used: string;
  extraction: {
    text_content: string;
    contacts: string[];
    action_items: string[];
    context: string;
  };
  stored: boolean;
}

export async function capturePhoto(
  fileUri: string,
  fileName: string,
  model: 'claude' | 'gemini' = 'claude',
): Promise<CapturePhotoResult> {
  const headers = await getAuthHeaders();
  const formData = new FormData();

  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: getImageMimeType(fileName),
  } as any);

  const resp = await fetch(`${API_BASE}/api/capture/photo?model=${model}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!resp.ok) throw new Error(`Photo capture failed: ${resp.status}`);
  return resp.json();
}

// ---------------------------------------------------------------------------
// Email capture (POST /api/capture/email/json)
// ---------------------------------------------------------------------------

export interface CaptureEmailResult {
  id: string;
  from_email: string;
  subject: string;
  extracted: {
    contact_name: string | null;
    company: string | null;
    items_discussed: string[];
    action_items: { description: string; due_hint: string | null }[];
    sentiment: string | null;
  };
  stored: boolean;
}

export async function captureEmail(rawEmailText: string): Promise<CaptureEmailResult> {
  const headers = await getAuthHeaders();
  const resp = await fetch(`${API_BASE}/api/capture/email/json`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawEmailText }),
  });
  if (!resp.ok) throw new Error(`Email capture failed: ${resp.status}`);
  return resp.json();
}

// ---------------------------------------------------------------------------
// Bulk import (POST /api/bulk-import)
// ---------------------------------------------------------------------------

export interface BulkImportResult {
  total_received: number;
  imported: number;
  duplicates: number;
  errors: number;
  items: {
    opportunity_name: string;
    contact_name: string;
    company: string;
    vault_stored: boolean;
    action_queued: boolean;
    status: string;
    detail: string;
  }[];
}

export async function bulkImportRaw(rawText: string, sourceLabel: string = 'share_sheet'): Promise<BulkImportResult> {
  const headers = await getAuthHeaders();
  const resp = await fetch(`${API_BASE}/api/bulk-import`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText, source_label: sourceLabel }),
  });
  if (!resp.ok) throw new Error(`Bulk import failed: ${resp.status}`);
  return resp.json();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
  };
  return map[ext || ''] || 'audio/mpeg';
}

function getImageMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    heic: 'image/heic',
    webp: 'image/webp',
  };
  return map[ext || ''] || 'image/jpeg';
}
