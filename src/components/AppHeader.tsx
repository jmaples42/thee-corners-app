import React from 'react';
import { View, Image, StyleSheet, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../theme/colors';

// Pinned top bar: the Corners lockup on the left, actions on the right. It floats over the
// list (absolute) so content scrolls under a frosted layer, like hearhear's home screen.
// The screen must pad its list by the height reported through onHeight.
export const HEADER_LOCKUP = { width: 107, height: 28 }; // logo-lockup.png is 3.83:1

export default function AppHeader({
  right, onHeight,
}: {
  right?: React.ReactNode;
  onHeight?: (h: number) => void;
}) {
  const onLayout = (e: LayoutChangeEvent) => onHeight?.(e.nativeEvent.layout.height);
  return (
    <View style={s.wrap} onLayout={onLayout} pointerEvents="box-none">
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <View style={s.tint} pointerEvents="none" />
      <View style={s.row}>
        <Image
          source={require('../../assets/logo-lockup.png')}
          style={HEADER_LOCKUP}
          accessibilityRole="image"
          accessibilityLabel="Corners"
        />
        <View style={s.actions}>{right}</View>
      </View>
      <View style={s.rule} pointerEvents="none" />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(241,233,207,0.72)' },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rule: { height: 1, backgroundColor: Colors.border },
});
