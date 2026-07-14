import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import {
  buildAuthorizeUrl,
  isAccessTokenExpired,
  type AuthoritySnapshot,
  type DeviceSession,
  type TokenSet,
} from "@mapable/auth-client";
import { secureTokenStore } from "@/storage/secure-token-store";
import { loadMobilePublicEnv } from "@/types/env";

type AuthState = {
  ready: boolean;
  authenticated: boolean;
  tokens: TokenSet | null;
  authority: AuthoritySnapshot | null;
  sessions: DeviceSession[];
  biometricUnlockRequired: boolean;
};

type AuthContextValue = AuthState & {
  signIn: () => Promise<void>;
  handleAuthRedirect: (url: string) => Promise<void>;
  signOutCurrentDevice: () => Promise<void>;
  signOutAllSessions: () => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  switchOrganisation: (organisationId: string) => Promise<void>;
  enterParticipantContext: (participantId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  // Prefer global btoa when available (Hermes/browser); fallback for tests.
  const encode =
    typeof globalThis.btoa === "function"
      ? globalThis.btoa
      : (value: string) => Buffer.from(value, "binary").toString("base64");
  return encode(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createPkce() {
  const random = await Crypto.getRandomBytesAsync(32);
  const codeVerifier = toBase64Url(random);
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  const codeChallenge = digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const state = toBase64Url(await Crypto.getRandomBytesAsync(16));
  const nonce = toBase64Url(await Crypto.getRandomBytesAsync(16));
  return { codeVerifier, codeChallenge, state, nonce };
}

const defaultAuthority = (participantId: string | null): AuthoritySnapshot => ({
  kinds: ["authenticated_identity"],
  participantId,
  organisationId: null,
  role: "participant",
  expiresAt: null,
  revoked: false,
  stepUpRequiredFor: ["financial", "clinical", "high_impact"],
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const env = loadMobilePublicEnv();
  const [state, setState] = useState<AuthState>({
    ready: false,
    authenticated: false,
    tokens: null,
    authority: null,
    sessions: [],
    biometricUnlockRequired: false,
  });
  const [pkceVerifier, setPkceVerifier] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokens = await secureTokenStore.get();
      if (cancelled) return;
      if (tokens && !isAccessTokenExpired(tokens)) {
        setState({
          ready: true,
          authenticated: true,
          tokens,
          authority: defaultAuthority(null),
          sessions: [
            {
              id: "current",
              deviceLabel: "This device",
              createdAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
              current: true,
            },
          ],
          biometricUnlockRequired: true,
        });
      } else {
        if (tokens) await secureTokenStore.clear();
        setState((s) => ({ ...s, ready: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async () => {
    if (!env.oauthClientId || !env.oauthIssuer) {
      const tokens: TokenSet = {
        accessToken: "dev-access-token",
        refreshToken: "dev-refresh-token",
        expiresAt: Date.now() + 60 * 60 * 1000,
        tokenType: "Bearer",
        scope: "openid profile offline_access",
      };
      await secureTokenStore.set(tokens);
      setState({
        ready: true,
        authenticated: true,
        tokens,
        authority: defaultAuthority("participant_dev"),
        sessions: [
          {
            id: "current",
            deviceLabel: "This device",
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            current: true,
          },
        ],
        biometricUnlockRequired: false,
      });
      return;
    }
    const challenge = await createPkce();
    setPkceVerifier(challenge.codeVerifier);
    const redirectUri = Linking.createURL("auth/callback");
    const url = buildAuthorizeUrl(
      {
        issuer: env.oauthIssuer,
        clientId: env.oauthClientId,
        redirectUri,
        scopes: ["openid", "profile", "offline_access"],
        tokenStore: secureTokenStore,
      },
      challenge,
    );
    await Linking.openURL(url);
  }, [env.oauthClientId, env.oauthIssuer]);

  const handleAuthRedirect = useCallback(
    async (url: string) => {
      const parsed = Linking.parse(url);
      const code =
        typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;
      if (!code || !pkceVerifier) return;
      const tokenEndpoint = `${env.oauthIssuer.replace(/\/$/, "")}/oauth/token`;
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env.oauthClientId,
        code,
        redirect_uri: Linking.createURL("auth/callback"),
        code_verifier: pkceVerifier,
      });
      const res = await fetch(tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!res.ok) throw new Error("Token exchange failed");
      const json = (await res.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        token_type: string;
        scope?: string;
      };
      const tokens: TokenSet = {
        accessToken: json.access_token,
        refreshToken: json.refresh_token ?? null,
        expiresAt: Date.now() + json.expires_in * 1000,
        tokenType: "Bearer",
        scope: json.scope,
      };
      await secureTokenStore.set(tokens);
      setPkceVerifier(null);
      setState({
        ready: true,
        authenticated: true,
        tokens,
        authority: defaultAuthority(null),
        sessions: [
          {
            id: "current",
            deviceLabel: "This device",
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            current: true,
          },
        ],
        biometricUnlockRequired: false,
      });
    },
    [env.oauthClientId, env.oauthIssuer, pkceVerifier],
  );

  const signOutCurrentDevice = useCallback(async () => {
    await secureTokenStore.clear();
    setState({
      ready: true,
      authenticated: false,
      tokens: null,
      authority: null,
      sessions: [],
      biometricUnlockRequired: false,
    });
  }, []);

  const signOutAllSessions = useCallback(async () => {
    await secureTokenStore.clear();
    setState({
      ready: true,
      authenticated: false,
      tokens: null,
      authority: null,
      sessions: [],
      biometricUnlockRequired: false,
    });
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock MapAble",
      cancelLabel: "Use another way",
      disableDeviceFallback: false,
    });
    if (result.success) {
      setState((s) => ({ ...s, biometricUnlockRequired: false }));
      return true;
    }
    return false;
  }, []);

  const switchOrganisation = useCallback(async (organisationId: string) => {
    setState((s) =>
      s.authority
        ? {
            ...s,
            authority: {
              ...s.authority,
              organisationId,
              kinds: Array.from(
                new Set([...s.authority.kinds, "organisation_membership" as const]),
              ),
            },
          }
        : s,
    );
  }, []);

  const enterParticipantContext = useCallback(async (participantId: string) => {
    setState((s) =>
      s.authority
        ? {
            ...s,
            authority: {
              ...s.authority,
              participantId,
              kinds: Array.from(
                new Set([...s.authority.kinds, "participant_authority" as const]),
              ),
            },
          }
        : s,
    );
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      handleAuthRedirect,
      signOutCurrentDevice,
      signOutAllSessions,
      unlockWithBiometrics,
      switchOrganisation,
      enterParticipantContext,
    }),
    [
      state,
      signIn,
      handleAuthRedirect,
      signOutCurrentDevice,
      signOutAllSessions,
      unlockWithBiometrics,
      switchOrganisation,
      enterParticipantContext,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
