import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { createCorner, createInvites } from '../firebase/firestore';
import { normalizePhone, formatPhone, phoneOptions } from '../utils/phone';
import { APP_INVITE_URL } from '../config/invite';

// Free corners hold 5 people including the creator.
const MAX_INVITEES = 4;

interface Invitee {
  phone: string; // E.164
  name?: string; // from the contact, if picked from contacts
}

interface Props {
  currentUid: string;
  currentPhone: string;
  username: string;
  onCreated: (cornerId: string, cornerName: string) => void;
  onCancel: () => void;
}

export default function CreateCornerScreen({ currentUid, currentPhone, username, onCreated, onCancel }: Props) {
  const [name, setName] = useState('');
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [numberInput, setNumberInput] = useState('');
  const [numberError, setNumberError] = useState('');
  const [loading, setLoading] = useState(false);

  const atLimit = invitees.length >= MAX_INVITEES;

  const addInvitee = (invitee: Invitee) => {
    if (invitee.phone === currentPhone) {
      Alert.alert("That's you", "You're already in the corner.");
      return;
    }
    if (invitees.some(i => i.phone === invitee.phone)) return;
    if (invitees.length >= MAX_INVITEES) return;
    setInvitees(prev => [...prev, invitee]);
  };

  const removeInvitee = (phone: string) => setInvitees(prev => prev.filter(i => i.phone !== phone));

  const addTypedNumber = () => {
    const phone = normalizePhone(numberInput);
    if (!phone) {
      setNumberError('Enter a valid US or Canadian phone number.');
      return;
    }
    setNumberError('');
    addInvitee({ phone });
    setNumberInput('');
  };

  // The iOS system picker needs no contacts permission: the app only receives
  // the one contact the user taps.
  const addFromContacts = async () => {
    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return;
      const contactName =
        contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Contact';

      const options = phoneOptions(contact.phoneNumbers);

      if (options.length === 0) {
        Alert.alert('No usable number', `${contactName} doesn't have a US or Canadian phone number saved.`);
      } else if (options.length === 1) {
        addInvitee({ phone: options[0].phone, name: contactName });
      } else {
        Alert.alert(
          `Which number for ${contactName}?`,
          'Use the one they sign in to Corners with.',
          [
            ...options.slice(0, 4).map(o => ({
              text: `${o.label} · ${formatPhone(o.phone)}`,
              onPress: () => addInvitee({ phone: o.phone, name: contactName }),
            })),
            { text: 'Cancel', style: 'cancel' as const },
          ]
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn't open contacts", 'You can still enter a phone number below.');
    }
  };

  const sendInviteText = (cornerName: string, phones: string[]) => {
    const link = APP_INVITE_URL ? ` ${APP_INVITE_URL}` : '';
    const body = `${username} invited you to "${cornerName}" on Corners. Open the app and sign in with this number to join.${link}`;
    Linking.openURL(`sms:${phones.join(',')}&body=${encodeURIComponent(body)}`).catch(console.error);
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const cornerId = await createCorner({
        name: trimmed,
        ownerUid: currentUid,
        memberUids: [currentUid], // everyone else joins by accepting an invite
        createdAt: Date.now(),
        isPublic: false,
        lastActivityAt: Date.now(),
      });

      const finish = () => onCreated(cornerId, trimmed);
      if (invitees.length === 0) {
        finish();
        return;
      }

      const phones = invitees.map(i => i.phone);
      try {
        await createInvites({ id: cornerId, name: trimmed }, { uid: currentUid, username }, phones);
      } catch (e) {
        console.error(e);
        Alert.alert('Corner created', "We couldn't send the invites. Check your connection and try again later.", [
          { text: 'OK', onPress: finish },
        ]);
        return;
      }
      Alert.alert(
        'Invites sent',
        'They can join from their Connect tab. Want to text them too, so they know to look?',
        [
          { text: 'Not now', style: 'cancel', onPress: finish },
          { text: 'Send text', onPress: () => { sendInviteText(trimmed, phones); finish(); } },
        ]
      );
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
            <Text style={s.label}>INVITE PEOPLE</Text>
            <Text style={s.hint}>
              Free corners hold up to 5 people including you. Invitees tap to accept — nobody is added without saying yes.
            </Text>

            {invitees.map(i => (
              <View key={i.phone} style={s.chip}>
                <View style={{ flex: 1 }}>
                  <Text style={s.chipName}>{i.name ?? formatPhone(i.phone)}</Text>
                  {i.name ? <Text style={s.chipPhone}>{formatPhone(i.phone)}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => removeInvitee(i.phone)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={18} color={Colors.mutedText} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[s.contactsBtn, atLimit && s.contactsBtnDisabled]}
              onPress={addFromContacts}
              disabled={atLimit}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={16} color={atLimit ? Colors.mutedText : Colors.rust} />
              <Text style={[s.contactsBtnText, atLimit && { color: Colors.mutedText }]}>
                {atLimit ? 'CORNER IS FULL' : 'ADD FROM CONTACTS'}
              </Text>
            </TouchableOpacity>

            {!atLimit && (
              <>
                <Text style={s.orText}>or enter a number</Text>
                <View style={s.numberRow}>
                  <TextInput
                    style={s.phoneInput}
                    value={numberInput}
                    onChangeText={t => { setNumberInput(t); if (numberError) setNumberError(''); }}
                    placeholder="(555) 123-4567"
                    placeholderTextColor={Colors.mutedText}
                    keyboardType="phone-pad"
                    onSubmitEditing={addTypedNumber}
                  />
                  <TouchableOpacity
                    style={[s.addBtn, !numberInput.trim() && s.addBtnDisabled]}
                    onPress={addTypedNumber}
                    disabled={!numberInput.trim()}
                  >
                    <Text style={s.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                </View>
                {numberError ? <Text style={s.errorText}>{numberError}</Text> : null}
              </>
            )}
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
  cancelBtn: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: Colors.mutedText, letterSpacing: 1 },
  navTitle: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 18, color: Colors.cream },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 28 },
  label: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber, letterSpacing: 3, marginBottom: 8 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.mutedText, marginBottom: 14, lineHeight: 18 },
  nameInput: {
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    padding: 16, fontFamily: 'Inter_400Regular', fontSize: 18, color: Colors.cream,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    padding: 14, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.cream,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  chipName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.cream },
  chipPhone: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.mutedText, marginTop: 2, letterSpacing: 0.5 },
  contactsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.rust, paddingVertical: 14, marginTop: 4,
  },
  contactsBtnDisabled: { borderColor: Colors.border },
  contactsBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: Colors.rust, letterSpacing: 2 },
  orText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.mutedText, textAlign: 'center', marginVertical: 14 },
  numberRow: { flexDirection: 'row', gap: 8 },
  addBtn: { backgroundColor: Colors.rust, paddingHorizontal: 18, justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: Colors.border },
  addBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: Colors.cream, letterSpacing: 2 },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.rust, marginTop: 8 },
  createBtn: {
    backgroundColor: Colors.rust, paddingVertical: 18,
    marginHorizontal: 20, alignItems: 'center', marginTop: 36,
  },
  createBtnDisabled: { backgroundColor: Colors.border },
  createBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: Colors.cream, letterSpacing: 3 },
});
