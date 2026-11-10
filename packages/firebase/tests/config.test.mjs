import assert from "node:assert/strict";
import test from "node:test";

import {
  readFirebaseClientConfig,
  requireFirebaseClientConfig,
} from "../src/config.ts";

test("readFirebaseClientConfig returns null when incomplete", () => {
  assert.equal(readFirebaseClientConfig({}), null);
});

test("readFirebaseClientConfig accepts NEXT_PUBLIC_ and EXPO_PUBLIC_ prefixes", () => {
  const base = {
    NEXT_PUBLIC_FIREBASE_API_KEY: "key",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "ex.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "ex",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "ex.appspot.com",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "1",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:1:web:abc",
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-TEST",
  };
  assert.deepEqual(readFirebaseClientConfig(base), {
    apiKey: "key",
    authDomain: "ex.firebaseapp.com",
    projectId: "ex",
    storageBucket: "ex.appspot.com",
    messagingSenderId: "1",
    appId: "1:1:web:abc",
    measurementId: "G-TEST",
  });

  const expo = {
    EXPO_PUBLIC_FIREBASE_API_KEY: "key2",
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: "ex2.firebaseapp.com",
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: "ex2",
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: "ex2.appspot.com",
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "2",
    EXPO_PUBLIC_FIREBASE_APP_ID: "1:2:web:def",
  };
  assert.equal(readFirebaseClientConfig(expo)?.projectId, "ex2");
});

test("requireFirebaseClientConfig throws when missing", () => {
  assert.throws(() => requireFirebaseClientConfig({}), /Firebase client config missing/);
});
