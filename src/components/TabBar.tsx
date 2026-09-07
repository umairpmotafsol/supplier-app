/**
 * Bottom tab bar for the supplier's two screens.
 *
 * Written by hand rather than using the default bar so it matches the
 * app bar at the other end of the screen: same charcoal, same hairline,
 * and the orange used only on the tab you are actually on.
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

import {colors, font, s, track} from '../theme/tokens';
import {column} from '../theme/common';
import Icon, {iconSize} from './Icon';
import type {IconName} from './Icon';

const TAB_ICONS: Record<string, IconName> = {
  Orders: 'clipboard',
  Dashboard: 'home',
};

export function TabBar({state, descriptors, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, {paddingBottom: insets.bottom + s(8)}]}>
      <View style={[styles.row, column]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const {options} = descriptors[route.key];
          const label = options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{selected: focused}}
              accessibilityLabel={label}
              onPress={onPress}
              style={styles.tab}>
              <Icon
                name={TAB_ICONS[route.name] ?? 'clipboard'}
                size={iconSize.md}
                color={focused ? colors.orange : colors.ink4}
              />
              <Text style={[styles.label, focused && styles.labelOn]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.appBar,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: s(9),
    paddingHorizontal: s(16),
  },
  row: {flexDirection: 'row'},
  tab: {flex: 1, alignItems: 'center', gap: s(4)},
  label: {
    fontFamily: font.semibold,
    fontSize: s(9),
    letterSpacing: track(0.06, s(9)),
    color: colors.ink4,
  },
  labelOn: {color: colors.orange},
});
