/**
 * useSiriShortcuts — Register Siri Shortcuts for Caddie actions.
 *
 * Shortcuts registered:
 *   "Call Sam"         → caddie-edc://call-sam
 *   "Open Caddie"      → caddie-edc://cards
 *   "Caddie Chat"      → caddie-edc://chat
 *   "Caddie Capture"   → caddie-edc://capture
 *
 * How reps use it:
 *   1. "Hey Siri, Call Sam" → triggers outbound Vapi call
 *   2. Back Tap (double/triple) → set in Settings → Accessibility → Touch → Back Tap
 *      → Choose a Shortcut → "Call Sam"
 *   3. Shortcuts app → automation → on tap of NFC tag → "Call Sam"
 *
 * Implementation:
 *   Uses expo-shortcuts (react-native-siri-shortcut under the hood).
 *   Falls back gracefully if the native module isn't available.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';

// Shortcut definitions — these appear in the Shortcuts app
const CADDIE_SHORTCUTS = [
  {
    activityType: 'com.elephantaccountability.caddie.callsam',
    title: 'Call Sam',
    suggestedInvocationPhrase: 'Call Sam',
    urlToOpen: 'caddie-edc://call-sam',
    isEligibleForSearch: true,
    isEligibleForPrediction: true,
    description: 'Have Sam call your phone for a voice conversation',
  },
  {
    activityType: 'com.elephantaccountability.caddie.chat',
    title: 'Caddie Chat',
    suggestedInvocationPhrase: 'Open Caddie Chat',
    urlToOpen: 'caddie-edc://chat',
    isEligibleForSearch: true,
    isEligibleForPrediction: true,
    description: 'Open Caddie voice chat',
  },
  {
    activityType: 'com.elephantaccountability.caddie.capture',
    title: 'Caddie Capture',
    suggestedInvocationPhrase: 'Caddie Capture',
    urlToOpen: 'caddie-edc://capture',
    isEligibleForSearch: true,
    isEligibleForPrediction: true,
    description: 'Capture a voice note or meeting notes',
  },
];

/**
 * Donate shortcuts to Siri on mount.
 *
 * This makes them available in:
 * - Siri voice commands
 * - Shortcuts app
 * - Back Tap configuration (Settings → Accessibility → Touch → Back Tap)
 * - Spotlight search
 */
export function useSiriShortcuts() {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    // Try to use expo-shortcuts or react-native-siri-shortcut
    // Fall back to NSUserActivity via native module if available
    try {
      const SiriShortcuts = requireSiriModule();
      if (!SiriShortcuts) {
        console.log('[SiriShortcuts] Module not available — shortcuts will work via URL scheme only');
        return;
      }

      // Donate each shortcut
      for (const shortcut of CADDIE_SHORTCUTS) {
        SiriShortcuts.donateShortcut({
          activityType: shortcut.activityType,
          title: shortcut.title,
          suggestedInvocationPhrase: shortcut.suggestedInvocationPhrase,
          isEligibleForSearch: shortcut.isEligibleForSearch,
          isEligibleForPrediction: shortcut.isEligibleForPrediction,
          userInfo: {
            url: shortcut.urlToOpen,
          },
        });
      }

      console.log(`[SiriShortcuts] Donated ${CADDIE_SHORTCUTS.length} shortcuts`);
    } catch (err) {
      // Non-fatal — shortcuts still work via URL scheme
      console.log('[SiriShortcuts] Could not donate:', err);
    }
  }, []);
}

function requireSiriModule(): any {
  try {
    // Try react-native-siri-shortcut first
    return require('react-native-siri-shortcut');
  } catch {
    try {
      // Try expo-shortcuts
      return require('expo-shortcuts');
    } catch {
      return null;
    }
  }
}

/**
 * Setup instructions for the rep (shown in onboarding or settings).
 */
export const SIRI_SETUP_INSTRUCTIONS = {
  backTap: {
    title: 'Set up Back Tap',
    steps: [
      'Open Settings',
      'Go to Accessibility → Touch → Back Tap',
      'Choose Double Tap or Triple Tap',
      'Select "Call Sam" from the Shortcuts list',
      'Now double/triple tap the back of your phone to call Sam',
    ],
  },
  siriVoice: {
    title: 'Set up Siri',
    steps: [
      'Say "Hey Siri, Call Sam"',
      'Siri will ask to confirm the shortcut',
      'Tap "Add to Siri"',
      'Now you can say "Hey Siri, Call Sam" anytime',
    ],
  },
  actionButton: {
    title: 'Set up Action Button (iPhone 15 Pro+)',
    steps: [
      'Open Settings → Action Button',
      'Select "Shortcut"',
      'Choose "Call Sam"',
      'Press and hold the Action Button to call Sam',
    ],
  },
};
