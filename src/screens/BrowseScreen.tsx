import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Linking,
} from 'react-native';
import { Colors } from '../theme/colors';

const BROWSE_URL = 'https://corners.thefanlab.com';

export default function BrowseScreen() {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.wordmark}>Browse</Text>
      </View>

      <View style={s.body}>
        <Text style={s.eyebrow}>THIS WEEK</Text>
        <Text style={s.title}>New Releases{'\n'}&amp; What Matters</Text>
        <Text style={s.sub}>
          The most important music out this week — with context on what critics and the culture are saying.
        </Text>
        <TouchableOpacity
          style={s.btn}
          onPress={() => Linking.openURL(BROWSE_URL)}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>OPEN BROWSE →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  wordmark: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.cream },
  body: {
    flex: 1, paddingHorizontal: 28,
    justifyContent: 'center', alignItems: 'flex-start',
  },
  eyebrow: {
    fontFamily: 'SpaceMono_400Regular', fontSize: 9,
    color: Colors.amber, letterSpacing: 3, marginBottom: 16,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 36,
    color: Colors.cream, lineHeight: 44, marginBottom: 20,
  },
  sub: {
    fontFamily: 'System', fontSize: 15, color: Colors.mutedText,
    lineHeight: 24, marginBottom: 36,
  },
  btn: { borderWidth: 1, borderColor: Colors.rust, paddingHorizontal: 24, paddingVertical: 14 },
  btnText: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: Colors.rust, letterSpacing: 2 },
});
