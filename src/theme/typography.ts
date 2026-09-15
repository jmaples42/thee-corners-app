import { StyleSheet } from 'react-native';

export const Typography = StyleSheet.create({
  heading1: {
    fontFamily: 'BigShouldersDisplay_900Black',
    fontSize: 32,
    letterSpacing: 0.5,
  },
  heading2: {
    fontFamily: 'BigShouldersDisplay_900Black',
    fontSize: 22,
    letterSpacing: 0.3,
  },
  heading3: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  mono: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
  },
  monoSmall: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
