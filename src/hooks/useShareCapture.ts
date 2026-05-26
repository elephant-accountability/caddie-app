/**
 * Deep link handler for share extension captures.
 * 
 * The Share Extension bounces content to the main app via:
 *   caddie-edc://capture?type=text|url|photo|audio&content=...
 * 
 * This hook listens for those links and routes to the right capture endpoint.
 */

import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { captureText, captureAudio, capturePhoto } from '../api/capture';

export function useShareCapture() {
  useEffect(() => {
    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep link that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);
}

async function handleDeepLink(url: string) {
  try {
    const parsed = Linking.parse(url);
    
    if (parsed.hostname !== 'capture' && parsed.path !== 'capture') {
      return; // Not a capture deep link
    }

    const type = parsed.queryParams?.type as string;
    const content = parsed.queryParams?.content as string;

    if (!type || !content) return;

    switch (type) {
      case 'text':
      case 'url': {
        const result = await captureText(content, 'share_sheet');
        const name = result.extracted?.contact_name || 'item';
        Alert.alert('Captured', `${name} saved to vault`);
        break;
      }

      case 'audio': {
        const fileName = content.split('/').pop() || 'voice_memo.m4a';
        const result = await captureAudio(content, fileName);
        Alert.alert('Captured', `Voice memo transcribed and saved`);
        break;
      }

      case 'photo': {
        const fileName = content.split('/').pop() || 'photo.jpg';
        const result = await capturePhoto(content, fileName);
        Alert.alert('Captured', `Photo analyzed and saved to vault`);
        break;
      }

      default:
        console.warn('Unknown share capture type:', type);
    }
  } catch (err) {
    console.error('Share capture failed:', err);
    Alert.alert('Capture Failed', 'Could not save to Caddie. Try again from the Chat tab.');
  }
}
