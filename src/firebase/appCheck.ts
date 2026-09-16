/**
 * Firebase App Check via App Attest (iOS). Two separate Firebase App Check
 * instances exist here, both backed by the same real App Attest attestation:
 *
 * 1. A native one (@react-native-firebase/app + app-check, configured via
 *    GoogleService-Info.plist) — this is what can actually talk to
 *    DCAppAttestService.
 * 2. The plain JS SDK's App Check (firebase/app-check), initialized on the
 *    same `app` instance auth.ts's `auth` uses, via a CustomProvider that
 *    just forwards a token from #1. This is what makes firebase/auth's own
 *    signInWithPhoneNumber automatically attach a valid X-Firebase-AppCheck
 *    header — the JS SDK has no App Attest bridge of its own on RN.
 *
 * App Attest only works on a real device — never in the iOS Simulator.
 */
import { getApp as getNativeApp } from '@react-native-firebase/app';
import {
  initializeAppCheck as initializeNativeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
  getToken as getNativeAppCheckToken,
} from '@react-native-firebase/app-check';
import { initializeAppCheck, CustomProvider } from 'firebase/app-check';
import { app } from './config';

const nativeAppCheck = initializeNativeAppCheck(getNativeApp(), {
  provider: new ReactNativeFirebaseAppCheckProvider({
    apple: { provider: 'appAttestWithDeviceCheckFallback' },
  }),
  isTokenAutoRefreshEnabled: true,
});

initializeAppCheck(app, {
  provider: new CustomProvider({
    getToken: async () => {
      const { token } = await getNativeAppCheckToken(nativeAppCheck);
      // The native module doesn't expose the real expiry, so give the JS SDK
      // a conservative one for its own caching — it'll just re-fetch sooner
      // than strictly necessary rather than serve a stale token too long.
      return { token, expireTimeMillis: Date.now() + 30 * 60 * 1000 };
    },
  }),
  isTokenAutoRefreshEnabled: true,
});

// Still exported for the diagnostic status line in AuthScreen — this reads
// straight from the native App Attest module, not the JS SDK bridge above.
export const getAppCheckToken = async (): Promise<string> => {
  const { token } = await getNativeAppCheckToken(nativeAppCheck);
  return token;
};
