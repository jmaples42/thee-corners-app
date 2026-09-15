/**
 * Firebase App Check via App Attest (iOS) — a separate native Firebase app
 * instance from the JS SDK used everywhere else (Firestore/Auth), configured
 * via GoogleService-Info.plist. This exists specifically to attach a real
 * X-Firebase-AppCheck token to the phone-auth REST call in auth.ts: Google's
 * phone-auth abuse protection accepts requests without one but silently drops
 * the SMS instead of sending it.
 *
 * App Attest only works on a real device — never in the iOS Simulator.
 */
import { getApp } from '@react-native-firebase/app';
import { initializeAppCheck, ReactNativeFirebaseAppCheckProvider, getToken } from '@react-native-firebase/app-check';

const provider = new ReactNativeFirebaseAppCheckProvider({
  apple: { provider: 'appAttestWithDeviceCheckFallback' },
});

const appCheckInstance = initializeAppCheck(getApp(), {
  provider,
  isTokenAutoRefreshEnabled: true,
});

export const getAppCheckToken = async (): Promise<string> => {
  const { token } = await getToken(appCheckInstance);
  return token;
};
