/**
 * Phone auth via Firebase Auth REST API for the SMS step (no native SDK
 * required — works in plain Expo/React Native), then exchanged for a real client
 * SDK session via signInWithCredential so auth.currentUser / request.auth in
 * Firestore rules are actually populated. PhoneAuthProvider.credential() doesn't
 * care that the sessionInfo came from a raw REST call rather than the SDK's own
 * signInWithPhoneNumber — it's the same verificationId shape.
 *
 * The REST call carries a real reCAPTCHA token (from FirebaseRecaptchaVerifierModal
 * in AuthScreen) and an X-Ios-Bundle-Identifier header. As of this writing, real SMS
 * still doesn't reliably deliver even with those in place, Blaze billing, and an
 * open SMS region policy — Google's phone-auth abuse protection appears to require
 * Firebase App Check (device attestation) now, which this REST-based approach
 * doesn't provide. Every request still returns a valid sessionInfo with no error,
 * it just never sends. See the "Wire up Firebase App Check" follow-up task.
 *
 * Until App Check is wired up, use Firebase Console → Authentication → Sign-in
 * method → Phone → "Phone numbers for testing" (fixed number + fixed code, no
 * real SMS) for TestFlight testers and local dev.
 */
import { signInWithCredential, PhoneAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './config';

const API_KEY = 'AIzaSyBYke6HHvcYxh-0UglHVC-pcYbdifxRBpc';
const BASE = 'https://identitytoolkit.googleapis.com/v1';

let _sessionInfo: string | null = null;

export const sendVerificationCode = async (
  phoneNumber: string,
  recaptchaToken: string
): Promise<string> => {
  const res = await fetch(`${BASE}/accounts:sendVerificationCode?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Identifies the request as coming from the real iOS app — without this,
      // Google's phone-auth abuse protection can accept the request (still
      // returning a valid sessionInfo) but silently drop the SMS.
      'X-Ios-Bundle-Identifier': 'com.theecorners.app',
    },
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
