import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import { createCorner } from '../firebase/firestore';

interface Props {
  currentUid: string;
  onCreated: (cornerId: string, cornerName: string) => void;
  onCancel: () => void;
}

export default function CreateCornerScreen({ currentUid, onCreated, onCancel }: Props) {
  const [name, setName] = useState('');
  const [phones, setPhones] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (text: string, index: number) => {
    const updated = [...phones];
    updated[index] = text;
    setPhones(updated);
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const cornerId = await createCorner({
        name: trimmed,
        ownerUid: currentUid,
        memberUids: [currentUid], // TODO: resolve phone numbers → UIDs via getUserByPhone
        createdAt: Date.now(),
        isPublic: false,
        lastActivityAt: Date.now(),
      });
      onCreated(cornerId, trimmed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const canCreate = name.trim().length > 0;

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.navBar}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={s.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.navTitle}>New Corner</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.section}>
            <Text style={s.label}>CORNER NAME</Text>
            <TextInput
              style={s.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Give it a name..."
              placeholderTextColor={Colors.mutedText}
              maxLength={40}
              autoFocus
            />
          </View>

          <View style={s.section}>
            <Text style={s.label}>INVITE BY PHONE</Text>
            <Text style={s.hint}>Free corners hold up to 5 people including you.</Text>
            {phones.map((phone, i) => (
              <TextInput
                key={i}
                style={[s.phoneInput, i > 0 && s.phoneInputBorderless]}
                value={phone}
                onChangeText={t => handlePhoneChange(t, i)}
                placeholder={`+1 555 000 000${i + 1}`}
                placeholderTextColor={Colors.mutedText}
                keyboardType="phone-pad"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[s.createBtn, !canCreate && s.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!canCreate || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={Colors.cream} />
              : <Text style={s.createBtnText}>CREATE CORNER</Text>}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cancelBtn: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: Colors.mutedText, letterSpacing: 1 },
  navTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: Colors.cream },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 28 },
  label: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.amber, letterSpacing: 3, marginBottom: 8 },
  hint: { fontFamily: 'System', fontSize: 12, color: Colors.mutedText, marginBottom: 14, lineHeight: 18 },
  nameInput: {
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    padding: 16, fontFamily: 'PlayfairDisplay_400Regular', fontSize: 18, color: Colors.cream,
  },
  phoneInput: {
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    padding: 14, fontFamily: 'System', fontSize: 14, color: Colors.cream,
  },
  phoneInputBorderless: { borderTopWidth: 0 },
  createBtn: {
    backgroundColor: Colors.rust, paddingVertical: 18,
    marginHorizontal: 20, alignItems: 'center', marginTop: 36,
  },
  createBtnDisabled: { backgroundColor: Colors.border },
  createBtnText: { fontFamily: 'SpaceMono_400Regular', fontSize: 12, color: Colors.cream, letterSpacing: 3 },
});
