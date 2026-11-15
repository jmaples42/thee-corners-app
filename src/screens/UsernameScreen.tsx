import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Font } from '../theme/typography';
import { getUserByUsername } from '../firebase/firestore';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

interface Props {
  onSubmit: (username: string) => void;
}

export default function UsernameScreen({ onSubmit }: Props) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (t: string) => {
    setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    if (error) setError('');
  };

  const handleContinue = async () => {
    if (!USERNAME_RE.test(username)) {
      setError('3-20 characters: lowercase letters, numbers, underscore.');
      return;
    }
    setLoading(true);
    try {
      const existing = await getUserByUsername(username);
      if (existing) {
        setError('That username is taken.');
        return;
      }
      onSubmit(username);
    } catch {
      setError('Could not check that username. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <View style={s.header}>
          <Text style={s.title}>Pick your</Text>
          <Text style={s.titleItalic}>handle.</Text>
          <View style={s.rule} />
          <Text style={s.sub}>THIS IS HOW OTHERS WILL SEE YOU</Text>
        </View>

        <View style={s.inputRow}>
          <Text style={s.at}>@</Text>
          <TextInput
            style={s.input}
            value={username}
            onChangeText={handleChange}
            placeholder="your_handle"
            placeholderTextColor={Colors.mutedText}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            onSubmitEditing={handleContinue}
          />
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={s.btn} onPress={handleContinue} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.onRust} /> : <Text style={s.btnText}>CONTINUE</Text>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  header: { marginBottom: 40 },
  title: { fontFamily: Font.body, fontSize: 36, color: Colors.cream },
  titleItalic: { fontFamily: Font.display, fontSize: 42, color: Colors.cream, marginTop: -8 },
  rule: { width: 80, height: 1, backgroundColor: Colors.rust, marginVertical: 14 },
  sub: { fontFamily: Font.label, fontSize: 12, color: Colors.amberText, letterSpacing: 1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 12,
  },
  at: { fontFamily: Font.label, fontSize: 20, color: Colors.mutedText, marginRight: 4, paddingBottom: 12 },
  input: {
    flex: 1, fontFamily: Font.label, fontSize: 20, color: Colors.cream, paddingBottom: 12,
  },
  error: { fontFamily: Font.body, fontSize: 15, color: Colors.rust, marginBottom: 12 },
  btn: { backgroundColor: Colors.rust, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  btnText: { fontFamily: Font.label, fontSize: 14, color: Colors.onRust, letterSpacing: 1 },
});
