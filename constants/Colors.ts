/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#4CAF50'; // Modern green color
const tintColorDark = '#8BC34A'; // Lighter green for dark mode
const errorColor = '#E53935'; // Error red color

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    muted: '#687076', // Muted text color
    // New colors
    primary: tintColorLight,
    secondary: '#FF9800', // Orange secondary color
    textSecondary: '#687076', // Secondary text color
    border: '#ECEDEE', // Border color
    cardBackground: '#F9FAFB', // Card background
    inputBackground: '#F9FAFB', // Input background
    error: errorColor, // Error color
  },
  dark: {
    text: '#E0E0E0', // Slightly darker than bright white for better eye comfort
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    muted: '#9BA1A6', // Muted text color
    // New colors
    primary: tintColorDark,
    secondary: '#FF9800', // Orange secondary color
    textSecondary: '#9BA1A6', // Secondary text color
    border: '#2E3235', // Border color
    cardBackground: '#1E2022', // Card background
    inputBackground: '#1E2022', // Input background
    error: errorColor, // Error color
  },
};
