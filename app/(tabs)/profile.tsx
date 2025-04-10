import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <ThemedText type="title">Profile</ThemedText>
        <ThemedText style={styles.description}>
          This screen will display the user's profile information and reading statistics.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    marginTop: 20,
    textAlign: 'center',
    opacity: 0.7,
  },
});