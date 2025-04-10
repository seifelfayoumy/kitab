import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function AddBookScreen() {
  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <ThemedText type="title">Add Book</ThemedText>
        <ThemedText style={styles.description}>
          This screen will allow users to add books to their collection.
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