import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  fetchPaymentSheetSession,
  presentCareInvoicePaymentSheet,
} from '../../payments/payInvoice';
import { MapAbleApiError, isMapAbleApiConfigured } from '../../runtime/mapableApi';

const colours = {
  background: '#F7F7F5',
  surface: '#FFFFFF',
  border: '#D8DAD6',
  text: '#171A1B',
  muted: '#5D6264',
  primary: '#243B53',
  accent: '#0B6B67',
  danger: '#8B1E1E',
};

/**
 * Prototype care invoice pay screen — Google Pay / Apple Pay / card via Stripe PaymentSheet.
 * Requires EAS/dev build (not Expo Go), API URL, publishable key, and session token.
 */
export function CarePayScreen() {
  const [invoiceId, setInvoiceId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configured = isMapAbleApiConfigured();
  const publishableKey = (process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '').trim();

  async function onPay() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const session = await fetchPaymentSheetSession({
        invoiceId: invoiceId.trim(),
        accessToken: accessToken.trim(),
      });
      const result = await presentCareInvoicePaymentSheet(session);
      if (result.ok) {
        setStatus('Payment submitted. Entitlements update when Stripe webhooks confirm.');
      } else if (result.cancelled) {
        setStatus('Payment cancelled.');
      } else {
        setError(result.message);
      }
    } catch (err) {
      const message =
        err instanceof MapAbleApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Payment failed.';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>CARE PAY</Text>
      <Text style={styles.title}>Pay care invoice</Text>
      <Text style={styles.subtitle}>
        Uses Stripe PaymentSheet (Google Pay, Apple Pay, and card). Plan-managed NDIS invoices
        stay export-only.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connection</Text>
        <Text style={styles.muted}>
          API: {configured ? 'configured' : 'set EXPO_PUBLIC_MAPABLE_API_URL'}
        </Text>
        <Text style={styles.muted}>
          Stripe publishable key: {publishableKey ? 'configured' : 'missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'}
        </Text>
        <Text style={styles.muted}>
          Native wallets require an EAS or local development build — not Expo Go.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Invoice</Text>
        <TextInput
          style={styles.input}
          accessibilityLabel="Billing invoice ID"
          placeholder="Billing invoice ID"
          placeholderTextColor={colours.muted}
          autoCapitalize="none"
          autoCorrect={false}
          value={invoiceId}
          onChangeText={setInvoiceId}
        />
        <TextInput
          style={styles.input}
          accessibilityLabel="Session access token"
          placeholder="Session access token (Bearer)"
          placeholderTextColor={colours.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          value={accessToken}
          onChangeText={setAccessToken}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pay with card or wallet"
          disabled={
            busy ||
            !configured ||
            !publishableKey ||
            !invoiceId.trim() ||
            !accessToken.trim()
          }
          onPress={() => {
            void onPay();
          }}
          style={({ pressed }) => [
            styles.button,
            styles.buttonPrimary,
            (busy || !configured || !publishableKey) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonTextPrimary}>Pay with card or wallet</Text>
          )}
        </Pressable>
        {status ? <Text style={styles.success}>{status}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colours.background },
  content: { padding: 18, paddingBottom: 36, gap: 16 },
  eyebrow: { fontSize: 12, letterSpacing: 1.2, fontWeight: '800', color: colours.accent },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '800', color: colours.text },
  subtitle: { fontSize: 17, lineHeight: 24, color: colours.muted },
  card: {
    gap: 12,
    padding: 16,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 14,
  },
  cardTitle: { fontSize: 17, lineHeight: 24, fontWeight: '800', color: colours.text },
  muted: { fontSize: 14, lineHeight: 20, color: colours.muted },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colours.surface,
    color: colours.text,
    fontSize: 16,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.surface,
  },
  buttonPrimary: { backgroundColor: colours.primary, borderColor: colours.primary },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.75 },
  buttonTextPrimary: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  success: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: colours.accent },
  error: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: colours.danger },
});
