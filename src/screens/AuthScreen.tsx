import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { Colors } from '../theme/colors';
import { app } from '../firebase/config';
import { sendVerificationCode, confirmVerificationCode } from '../firebase/auth';

interface Props {
  onAuthenticated: (uid: string, phoneNumber: string) => void;
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRef = useRef<TextInput>(null);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const formatPhone = (t: string) => {
    const d = t.replace(/\D/g, '');
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
  };

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit number'); return; }
    setError(''); setLoading(true);
    try {
      await sendVerificationCode(`+1${digits}`, recaptchaVerifier.current!);
      setStep('otp');
    } catch (e) {
      console.error('sendVerificationCode failed:', e);
      setError('Could not send code. Try again.');
    }
    finally { setLoading(false); }
  };

  const handleOtpChange = (val: string) => {
    setError('');
    setOtp(val.replace(/\D/g, '').slice(0, 6));
  };

  const handleVerify = async (code: string) => {
    if (code.length < 6) { setError('Enter the full 6-digit code'); return; }
    setError(''); setLoading(true);
    try {
      const user = await confirmVerificationCode(code);
      onAuthenticated(user.uid, user.phoneNumber);
    } catch (e) {
      console.error('confirmVerificationCode failed:', e);
      setError('Invalid code. Try again.');
    }
    finally { setLoading(false); }
  };

  // iOS offers the code from Messages as a QuickType suggestion (via
  // textContentType="oneTimeCode" below) and fills it into the hidden input
  // in one shot — auto-submit as soon as all 6 digits land, from typing or
  // that autofill.
  useEffect(() => {
    if (otp.length === 6) handleVerify(otp);
  }, [otp]);

  return (
    <SafeAreaView style={s.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <View style={s.logo}>
          <Text style={s.wordmark}>Thee</Text>
          <Text style={s.wordmark}>Corners</Text>
          <View style={s.rule} />
          <Text style={s.tagline}>WHERE MUSIC FINDS ITS PEOPLE</Text>
        </View>

        {step === 'phone' ? (
          <View>
            <Text style={s.label}>YOUR NUMBER</Text>
            <View style={s.phoneRow}>
              <View style={s.cc}><Text style={s.ccText}>+1</Text></View>
              <TextInput
                style={s.phoneInput}
                value={phone}
                onChangeText={t => setPhone(formatPhone(t))}
                placeholder="(555) 000-0000"
                placeholderTextColor={Colors.mutedText}
                keyboardType="phone-pad"
                maxLength={14}
                onSubmitEditing={handleSend}
              />
            </View>
            {error ? <Text style={s.error}>{error}</Text> : null}
            <TouchableOpacity style={s.btn} onPress={handleSend} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.cream} /> : <Text style={s.btnText}>SEND CODE</Text>}
            </TouchableOpacity>
            <Text style={s.disclaimer}>No passwords. No algorithm. Just your number.</Text>
          </View>
        ) : (
          <View>
            <Text style={s.label}>ENTER CODE</Text>
            <Text style={s.sub}>Sent to {phone}</Text>
            <View style={s.otpRow}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <View key={i} style={s.otpBox}>
                  <Text style={s.otpDigit}>{otp[i] || ''}</Text>
                </View>
              ))}
              <TextInput
                ref={otpRef}
                style={s.otpHiddenInput}
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={6}
                caretHidden
                autoFocus
              />
            </View>
            {error ? <Text style={s.error}>{error}</Text> : null}
            <TouchableOpacity style={s.btn} onPress={() => handleVerify(otp)} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.cream} /> : <Text style={s.btnText}>VERIFY</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); setError(''); }}>
              <Text style={s.back}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  logo: { alignItems: 'center', marginBottom: 56 },
  wordmark: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 52, color: Colors.cream, lineHeight: 56, letterSpacing: 2 },
  rule: { width: 120, height: 1, backgroundColor: Colors.rust, marginVertical: 12 },
  tagline: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber, letterSpacing: 3 },
  label: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.amber, letterSpacing: 3, marginBottom: 12 },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.mutedText, marginBottom: 20, marginTop: -8 },
  phoneRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 24 },
  cc: { paddingBottom: 12, marginRight: 12, borderRightWidth: 1, borderRightColor: Colors.border, paddingRight: 12, justifyContent: 'center' },
  ccText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 16, color: Colors.cream },
  phoneInput: { flex: 1, fontFamily: 'JetBrainsMono_500Medium', fontSize: 20, color: Colors.cream, paddingBottom: 12 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, position: 'relative' },
  otpBox: { width: 44, height: 56, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg, alignItems: 'center', justifyContent: 'center' },
  otpDigit: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 24, color: Colors.cream },
  otpHiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  btn: { backgroundColor: Colors.rust, paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  btnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 13, color: Colors.cream, letterSpacing: 3 },
  disclaimer: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.mutedText, textAlign: 'center', lineHeight: 18 },
  back: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: Colors.amber, textAlign: 'center', letterSpacing: 1 },
  error: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.rust, marginBottom: 12 },
});
