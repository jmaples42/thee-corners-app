import { StyleSheet } from 'react-native';

export const Typography = StyleSheet.create({
  heading1: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    letterSpacing: 0.5,
  },
  heading2: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    letterSpacing: 0.3,
  },
  heading3: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 18,
  },
  body: {
    fontFamily: 'System',
    fontSize: 14,
    lineHeight: 20,
  },
  mono: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 12,
  },
  monoSmall: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
