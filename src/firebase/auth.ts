/**
 * Phone auth via Firebase Auth REST API.
 * No native SDK required — works in plain Expo/React Native.
 *
 * Development: add test phone numbers in Firebase Console →
 *   Authentication → Sign-in method → Phone → Phone numbers for testing.
 *   Test numbers skip SMS and reCAPTCHA entirely.
 */

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
  const res = await fetch(`${BASE}/accounts:signInWithPhoneNumber?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionInfo: info, code }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  // Store the idToken for Firestore auth if needed later
  return {
    uid: data.localId,
    phoneNumber: data.phoneNumber ?? '',
  };
};

export const signOut = async (): Promise<void> => {
  _sessionInfo = null;
};
