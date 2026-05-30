/**
 * OAuth flow shells — one per wired connector.
 *
 * Each startOAuth function:
 *  1. POSTs to /api/onboarding/oauth_init/<connector> to get the auth URL
 *  2. Opens the URL via Linking (system browser)
 *  3. App captures the redirect via the caddie-edc:// scheme
 *  4. Exchange code for token happens server-side via /api/onboarding/oauth_callback
 *
 * Token storage: iOS Keychain via expo-secure-store, scoped to rep_id.
 */

import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { CaddieAPI } from "@/api/client";

const REDIRECT_BASE = "com.elephantaccountability.caddie://oauth";

// ── Gmail ──────────────────────────────────────────────────────────
// Uses the iOS client ID already configured per
// OneDrive/sales_edc_google_oauth_2026_05_28.md
export async function startGmailOAuth(repId: string): Promise<void> {
  const { data } = await CaddieAPI.post("/api/onboarding/oauth_init/gmail", {
    rep_id: repId,
    redirect_uri: `${REDIRECT_BASE}/gmail`,
  });

  if (!data?.auth_url) {
    throw new Error("Backend did not return an auth URL for Gmail.");
  }

  await Linking.openURL(data.auth_url);
  // Token exchange happens via the redirect → /api/onboarding/oauth_callback
}

// ── Outlook (Microsoft Graph) ──────────────────────────────────────
export async function startOutlookOAuth(repId: string): Promise<void> {
  const { data } = await CaddieAPI.post("/api/onboarding/oauth_init/outlook", {
    rep_id: repId,
    redirect_uri: `${REDIRECT_BASE}/outlook`,
  });

  if (!data?.auth_url) {
    throw new Error("Backend did not return an auth URL for Outlook.");
  }

  await Linking.openURL(data.auth_url);
}

// ── HubSpot ────────────────────────────────────────────────────────
export async function startHubSpotOAuth(repId: string): Promise<void> {
  const { data } = await CaddieAPI.post("/api/onboarding/oauth_init/hubspot", {
    rep_id: repId,
    redirect_uri: `${REDIRECT_BASE}/hubspot`,
  });

  if (!data?.auth_url) {
    throw new Error("Backend did not return an auth URL for HubSpot.");
  }

  await Linking.openURL(data.auth_url);
}

// ── Router — maps connector ID to the right OAuth function ─────────
const OAUTH_MAP: Record<string, (repId: string) => Promise<void>> = {
  gmail: startGmailOAuth,
  outlook: startOutlookOAuth,
  hubspot: startHubSpotOAuth,
};

export async function startOAuth(
  connectorId: string,
  repId: string
): Promise<void> {
  const fn = OAUTH_MAP[connectorId];
  if (!fn) {
    throw new Error(
      `No OAuth flow for connector "${connectorId}". This connector may not be wired yet.`
    );
  }
  return fn(repId);
}
