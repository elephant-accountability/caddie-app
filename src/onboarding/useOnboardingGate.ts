/**
 * useOnboardingGate — first-run gate using SecureStore.
 *
 * Returns { needsOnboarding, completeOnboarding }.
 * Once completeOnboarding() is called, the sweep screen never shows again
 * for this device (persisted in iOS Keychain via expo-secure-store).
 */

import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

const ONBOARDING_KEY = "caddie_onboarding_complete";

export function useOnboardingGate() {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
      setNeedsOnboarding(value !== "true");
      setChecked(true);
    })();
  }, []);

  const completeOnboarding = useCallback(async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
    setNeedsOnboarding(false);
  }, []);

  return {
    needsOnboarding: checked ? needsOnboarding : false,
    completeOnboarding,
  };
}
