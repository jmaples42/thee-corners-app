import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { BigShouldersDisplay_900Black } from '@expo-google-fonts/big-shoulders-display';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme/colors';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    BigShouldersDisplay_900Black,
    JetBrainsMono_500Medium,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.amber} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}
