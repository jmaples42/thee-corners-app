/**
 * Phone auth via Firebase Auth's own signInWithPhoneNumber, using
 * FirebaseRecaptchaVerifierModal (AuthScreen) as the ApplicationVerifier.
 *
 * This replaces an earlier hand-rolled version that called the Identity
 * Toolkit REST API directly (accounts:sendVerificationCode) with manually
 * attached reCAPTCHA/App-Check/bundle-ID headers. That approach kept
 * returning a valid sessionInfo with no error, yet never actually sent an
 * SMS — even after fixing every checkable cause one at a time (a real
 * reCAPTCHA token, Blaze billing, SMS region policy, X-Ios-Bundle-Identifier,
 * and finally real App Check with App Attest enforced and 100% of tokens
 * verified server-side). With everything Google-side confirmed correct and
 * still no delivery, the REST reimplementation itself was the remaining
 * suspect — Google's delivery logic may only trust requests that go through
 * the SDK's actual code path, not a hand-built equivalent of it. See
 * appCheck.ts for how a real App Attest token still reaches this call
 * despite going through the plain JS SDK now.
 */
import {
  signInWithPhoneNumber,
  ApplicationVerifier,
  ConfirmationResult,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './config';
import './appCheck';

let _confirmationResult: ConfirmationResult | null = null;

export const sendVerificationCode = async (
  phoneNumber: string,
  verifier: ApplicationVerifier
): Promise<void> => {
  _confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export const confirmVerificationCode = async (
  code: string
): Promise<{ uid: string; phoneNumber: string }> => {
  if (!_confirmationResult) throw new Error('No pending verification — call sendVerificationCode first');

  const result = await _confirmationResult.confirm(code);

  return {
    uid: result.user.uid,
    phoneNumber: result.user.phoneNumber ?? '',
  };
};

export const signOut = async (): Promise<void> => {
  _confirmationResult = null;
  await firebaseSignOut(auth);
};
