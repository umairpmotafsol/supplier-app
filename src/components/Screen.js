/**
 * Screen shell: app bar, scrolling body, docked action area, bottom nav.
 * Mirrors the `.screen / .body / .dock / .nav` stack in the reference.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, s } from '../theme/tokens';
import { column } from '../theme/common';

/*
 * Keyboard Controller's avoiding view, not React Native's. The app draws
 * edge-to-edge on Android and mounts `KeyboardProvider`, and under both
 * the window no longer resizes for the keyboard — so RN's view, which
 * relied on that resize on Android, would stop moving the docked
 * buttons. This one reads the keyboard frame directly, so `padding`
 * behaves the same on both platforms (and exactly as before on iOS).
 */
export function Screen({ children }) {
  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      {children}
    </KeyboardAvoidingView>
  );
}

export function Body({ children, center, contentStyle }) {
  return (
    <ScrollView
      style={styles.body}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.pad,
        column,
        center && styles.centered,
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

/**
 * Bottom action area. `standalone` means no nav bar follows, so the
 * dock absorbs the home-indicator inset itself.
 */
export function Dock({ children, standalone }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.dock,
        column,
        standalone && { paddingBottom: s(13) + insets.bottom },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  body: { flex: 1 },
  pad: {
    paddingVertical: layout.padV,
    paddingHorizontal: layout.padH,
    flexGrow: 1,
  },
  centered: { justifyContent: 'center' },
  dock: {
    paddingTop: s(10),
    paddingHorizontal: layout.padH,
    paddingBottom: s(13),
  },
});
