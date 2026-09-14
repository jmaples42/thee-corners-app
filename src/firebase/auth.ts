/**
 * Phone auth via Firebase Auth REST API for the SMS step (no native SDK/reCAPTCHA
 * required — works in plain Expo/React Native), then exchanged for a real client
 * SDK session via signInWithCredential so auth.currentUser / request.auth in
 * Firestore rules are actually populated. PhoneAuthProvider.credential() doesn't
 * care that the sessionInfo came from a raw REST call rather than the SDK's own
 * (reCAPTCHA-gated) signInWithPhoneNumber — it's the same verificationId shape.
 *
 * Development: add test phone numbers in Firebase Console →
 *   Authentication → Sign-in method → Phone → Phone numbers for testing.
 *   Test numbers skip SMS and reCAPTCHA entirely.
 */
import { signInWithCredential, PhoneAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './config';

const API_KEY = 'AIzaSyBYke6HHvcYxh-0UglHVC-pcYbdifxRBpc';
const BASE = 'https://identitytoolkit.googleapis.com/v1';

let _sessionInfo: string | null = null;

export const sendVerificationCode = async (phoneNumber: string): Promise<string> => {
  const res = await fetch(`${BASE}/accounts:sendVerificationCode?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, recaptchaToken: 'NONE' }),
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
