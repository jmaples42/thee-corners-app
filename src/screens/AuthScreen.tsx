import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import { sendVerificationCode, confirmVerificationCode } from '../firebase/auth';

interface Props {
  onAuthenticated: (uid: string) => void;
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState('');
  const refs = useRef<(TextInput | null)[]>([]);

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
      const id = await sendVerificationCode(`+1${digits}`);
      setConfirmId(id);
      setStep('otp');
    } catch { setError('Could not send code. Try again.'); }
    finally { setLoading(false); }
  };

  const handleOtp = (val: string, i: number) => {
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the full 6-digit code'); return; }
    setError(''); setLoading(true);
    try {
      const user = await confirmVerificationCode(confirmId, code);
      onAuthenticated(user.uid);
    } catch { setError('Invalid code. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container}>
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
              {otp.map((d, i) => (
                <TextInput
                  key={i}
                  ref={r => { refs.current[i] = r; }}
                  style={s.otpBox}
                  value={d}
                  onChangeText={v => handleOtp(v.slice(-1), i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>
            {error ? <Text style={s.error}>{error}</Text> : null}
            <TouchableOpacity style={s.btn} onPress={handleVerify} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.cream} /> : <Text style={s.btnText}>VERIFY</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); }}>
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
  wordmark: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 52, color: Colors.cream, lineHeight: 56, letterSpacing: 2 },
  rule: { width: 120, height: 1, backgroundColor: Colors.rust, marginVertical: 12 },
  tagline: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.amber, letterSpacing: 3 },
  label: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: Colors.amber, letterSpacing: 3, marginBottom: 12 },
  sub: { fontFamily: 'System', fontSize: 13, color: Colors.mutedText, marginBottom: 20, marginTop: -8 },
  phoneRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 24 },
  cc: { paddingBottom: 12, marginRight: 12, borderRightWidth: 1, borderRightColor: Colors.border, paddingRight: 12, justifyContent: 'center' },
  ccText: { fontFamily: 'SpaceMono_400Regular', fontSize: 16, color: Colors.cream },
  phoneInput: { flex: 1, fontFamily: 'SpaceMono_400Regular', fontSize: 20, color: Colors.cream, paddingBottom: 12 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  otpBox: { width: 44, height: 56, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg, textAlign: 'center', fontFamily: 'SpaceMono_400Regular', fontSize: 24, color: Colors.cream },
  btn: { backgroundColor: Colors.rust, paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  btnText: { fontFamily: 'SpaceMono_400Regular', fontSize: 13, color: Colors.cream, letterSpacing: 3 },
  disclaimer: { fontFamily: 'System', fontSize: 12, color: Colors.mutedText, textAlign: 'center', lineHeight: 18 },
  back: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: Colors.amber, textAlign: 'center', letterSpacing: 1 },
  error: { fontFamily: 'System', fontSize: 13, color: Colors.rust, marginBottom: 12 },
});
