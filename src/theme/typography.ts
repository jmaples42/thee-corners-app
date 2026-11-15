import { StyleSheet } from 'react-native';

// One family, a few weights, each with a job. Inter Tight 800 echoes the heavy wordmark; running
// text stays at 500 because paragraphs set in 800 close up and tire the eye. Nothing lighter
// than 500 (the app is read by people with older eyes). Change a family here and it changes
// everywhere; sizes are set per style, with these floors: body 14+, labels 12+.
export const Font = {
  display: 'InterTight_800ExtraBold', // screen titles, section heads, artist names
  label: 'InterTight_700Bold', // buttons, tags, kickers, tab labels
  strong: 'InterTight_600SemiBold', // emphasis inside running text
  body: 'InterTight_500Medium', // notes, blurbs, comments, inputs
} as const;

export const Typography = StyleSheet.create({
  title: { fontFamily: Font.display, fontSize: 32, letterSpacing: -0.3 },
  heading: { fontFamily: Font.display, fontSize: 22 },
  subheading: { fontFamily: Font.label, fontSize: 18 },
  body: { fontFamily: Font.body, fontSize: 16, lineHeight: 23 },
  bodySmall: { fontFamily: Font.body, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: Font.label, fontSize: 12, letterSpacing: 1 },
});
