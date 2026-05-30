/**
 * useDeepLink — Handle caddie-edc:// deep links.
 *
 * Supported URLs:
 *   caddie-edc://call-sam       → Trigger Sam voice call
 *   caddie-edc://chat           → Open chat tab with mic active
 *   caddie-edc://capture        → Open capture (mic recording)
 *   caddie-edc://cards          → Open cards tab
 *
 * Works with:
 *   - Siri Shortcuts ("Hey Siri, call Sam")
 *   - iOS Back Tap (Settings → Accessibility → Touch → Back Tap)
 *   - Spotlight / Shortcuts app
 *   - Other apps via Linking.openURL()
 */
import { useEffect, useCallback, useRef } from 'react';
import { Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../api/client';

type DeepLinkAction = 'call-sam' | 'chat' | 'capture' | 'cards';

interface DeepLinkCallbacks {
  onCallSam?: () => void;
  onOpenChat?: () => void;
}

export function useDeepLink(callbacks?: DeepLinkCallbacks) {
  const router = useRouter();
  const processedUrls = useRef(new Set<string>());

  const handleUrl = useCallback(
    (url: string) => {
      // Dedupe — don't process same URL twice in quick succession
      if (processedUrls.current.has(url)) return;
      processedUrls.current.add(url);
      setTimeout(() => processedUrls.current.delete(url), 2000);

      // Parse: caddie-edc://call-sam?context=driving
      const parsed = parseDeepLink(url);
      if (!parsed) return;

      console.log('[DeepLink] Action:', parsed.action, 'Params:', parsed.params);

      switch (parsed.action) {
        case 'call-sam':
          triggerCallSam(parsed.params?.context);
          callbacks?.onCallSam?.();
          break;

        case 'chat':
          router.push('/(tabs)/log');
          callbacks?.onOpenChat?.();
          break;

        case 'capture':
          // Navigate to chat tab which has the mic
          router.push('/(tabs)/log');
          break;

        case 'cards':
          router.push('/(tabs)/index');
          break;

        default:
          console.log('[DeepLink] Unknown action:', parsed.action);
      }
    },
    [router, callbacks]
  );

  useEffect(() => {
    // Handle URL that launched the app (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Handle URL while app is running (warm start)
    const sub = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => sub.remove();
  }, [handleUrl]);
}

function parseDeepLink(url: string): { action: DeepLinkAction; params: Record<string, string> } | null {
  try {
    // caddie-edc://call-sam?context=driving
    const match = url.match(/caddie-edc:\/\/([a-z-]+)(\?.*)?/);
    if (!match) return null;

    const action = match[1] as DeepLinkAction;
    const params: Record<string, string> = {};

    if (match[2]) {
      const searchParams = new URLSearchParams(match[2].substring(1));
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    return { action, params };
  } catch {
    return null;
  }
}

async function triggerCallSam(context?: string) {
  try {
    console.log('[DeepLink] Triggering Call Sam...');
    const result = await api.callSam(context);
    console.log('[DeepLink] Call Sam result:', result);
  } catch (err) {
    console.error('[DeepLink] Call Sam failed:', err);
  }
}
