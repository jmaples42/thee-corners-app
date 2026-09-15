import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  onSignOut: () => void;
}

export default function SettingsScreen({ onSignOut }: Props) {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        <Text style={s.sectionLabel}>SETTINGS</Text>
        <TouchableOpacity style={s.signOutBtn} onPress={onSignOut}>
          <Text style={s.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { paddingHorizontal: 20, paddingTop: 12 },
  sectionLabel: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: Colors.amber,
    letterSpacing: 3, marginBottom: 20,
  },
  signOutBtn: {
    borderWidth: 1, borderColor: Colors.border, paddingVertical: 16, alignItems: 'center',
  },
  signOutText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.rust, letterSpacing: 2 },
});
