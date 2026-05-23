import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'caddie_auth_token';
const TOKEN_EXPIRY_KEY = 'caddie_token_expiry';

export interface AuthTokens {
  token: string;
  expiresAt: number; // epoch ms
}

export async function storeTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, tokens.token);
  await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, tokens.expiresAt.toString());
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getTokenExpiry(): Promise<number | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
  return raw ? parseInt(raw, 10) : null;
}

export async function isTokenValid(): Promise<boolean> {
  const expiry = await getTokenExpiry();
  if (!expiry) return false;
  // Consider token expired if less than 1 hour remains
  return expiry > Date.now() + 60 * 60 * 1000;
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
}

export async function refreshIfNeeded(
  refreshFn: () => Promise<AuthTokens>
): Promise<string | null> {
  const expiry = await getTokenExpiry();
  if (!expiry) return null;

  // Refresh if less than 1 hour remains
  if (expiry - Date.now() < 60 * 60 * 1000) {
    try {
      const tokens = await refreshFn();
      await storeTokens(tokens);
      return tokens.token;
    } catch {
      return null;
    }
  }

  return getToken();
}
