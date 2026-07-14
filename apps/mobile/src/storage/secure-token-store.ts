
import * as SecureStore from "expo-secure-store";
import {
  tokenSetSchema,
  type SecureTokenStore,
  type TokenSet,
} from "@mapable/auth-client";

const KEY = "mapable.auth.tokens.v1";

/**
 * Tokens live only in the platform keychain/keystore — never AsyncStorage or SQLite.
 */
export const secureTokenStore: SecureTokenStore = {
  async get(): Promise<TokenSet | null> {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    try {
      return tokenSetSchema.parse(JSON.parse(raw));
    } catch {
      await SecureStore.deleteItemAsync(KEY);
      return null;
    }
  },
  async set(tokens: TokenSet): Promise<void> {
    tokenSetSchema.parse(tokens);
    await SecureStore.setItemAsync(KEY, JSON.stringify(tokens), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY);
  },
};
