/**
 * Phone auth via Firebase Auth REST API for the SMS step (no native SDK
 * required — works in plain Expo/React Native), then exchanged for a real client
 * SDK session via signInWithCredential so auth.currentUser / request.auth in
 * Firestore rules are actually populated. PhoneAuthProvider.credential() doesn't
 * care that the sessionInfo came from a raw REST call rather than the SDK's own
 * signInWithPhoneNumber — it's the same verificationId shape.
 *
 * The REST call carries a real reCAPTCHA token (from FirebaseRecaptchaVerifierModal
 * in AuthScreen), an X-Ios-Bundle-Identifier header, and an X-Firebase-AppCheck
 * token (see appCheck.ts, backed by App Attest). Without App Check specifically,
 * Google's phone-auth abuse protection accepted every request here (valid
 * sessionInfo, no error) but silently dropped the SMS instead of sending it —
 * confirmed by process of elimination against Blaze billing, SMS region policy,
 * and the bundle identifier header, none of which alone fixed it.
 *
 * App Attest only works on a real device, never the Simulator. Firebase Console
 * → Authentication → Sign-in method → Phone → "Phone numbers for testing" (fixed
 * number + fixed code, no real SMS) remains the way to test in the Simulator.
 */
import { signInWithCredential, PhoneAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './config';
import { getAppCheckToken } from './appCheck';

const API_KEY = 'AIzaSyBYke6HHvcYxh-0UglHVC-pcYbdifxRBpc';
const BASE = 'https://identitytoolkit.googleapis.com/v1';

let _sessionInfo: string | null = null;

export const sendVerificationCode = async (
  phoneNumber: string,
  recaptchaToken: string
): Promise<string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Identifies the request as coming from the real iOS app.
    'X-Ios-Bundle-Identifier': 'com.theecorners.app',
  };
  try {
    // Device attestation — the piece that actually unlocks real SMS sending.
    // Unavailable in the Simulator (App Attest is real-device-only) and on
    // devices where attestation transiently fails — degrade to no header
    // rather than blocking sign-in entirely (test phone numbers don't need it).
    headers['X-Firebase-AppCheck'] = await getAppCheckToken();
  } catch {
    // no-op — see comment above
  }
  const res = await fetch(`${BASE}/accounts:sendVerificationCode?key=${API_KEY}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phoneNumber, recaptchaToken }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  _sessionInfo = data.sessionInfo;
  return data.sessionInfo;
};

export const confirmVerificationCode = async (
  sessionInfo: string,
  code: string
): Promise<{ uid: string; phoneNumber: string }> => {
  const info = sessionInfo || _sessionInfo;
  if (!info) throw new Error('No session info — call sendVerificationCode first');

  // Establish a real Firebase Auth session (populates auth.currentUser and,
  // via that, request.auth in Firestore security rules) instead of just
  // trusting the REST response's uid/phoneNumber locally.
  const credential = PhoneAuthProvider.credential(info, code);
  const result = await signInWithCredential(auth, credential);

  return {
    uid: result.user.uid,
    phoneNumber: result.user.phoneNumber ?? '',
  };
};

export const signOut = async (): Promise<void> => {
  _sessionInfo = null;
  await firebaseSignOut(auth);
};
