/**
 * Screen shell: app bar, scrolling body, docked action area, bottom nav.
 * Mirrors the `.screen / .body / .dock / .nav` stack in the reference.
 */
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors, layout, s} from '../theme/tokens';

export function Screen({children}: {children: React.ReactNode}) {
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {children}
    </KeyboardAvoidingView>
  );
}

export function Body({
  children,
  center,
  contentStyle,
}: {
  children: React.ReactNode;
  /** `.body.center` — vertically centres short content, as on Home. */
  center?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={styles.body}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.pad,
        center && styles.centered,
        contentStyle,
      ]}>
      {children}
    </ScrollView>
  );
}

/**
 * Bottom action area. `standalone` means no nav bar follows, so the
 * dock absorbs the home-indicator inset itself.
 */
export function Dock({
  children,
  standalone,
}: {
  children: React.ReactNode;
  standalone?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.dock,
        standalone && {paddingBottom: s(13) + insets.bottom},
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.appBg},
  body: {flex: 1},
  pad: {
    paddingVertical: layout.padV,
    paddingHorizontal: layout.padH,
    flexGrow: 1,
  },
  centered: {justifyContent: 'center'},
  dock: {
    paddingTop: s(10),
    paddingHorizontal: layout.padH,
    paddingBottom: s(13),
  },
});
