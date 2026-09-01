/**
 * Bottom navigation — two destinations, Dashboard and Orders.
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors, font, s, track} from '../theme/tokens';
import Icon, {IconName} from './Icon';

export type TabKey = 'Dashboard' | 'Orders';

const TABS: Array<{key: TabKey; icon: IconName; label: string}> = [
  {key: 'Dashboard', icon: 'home', label: 'Dashboard'},
  {key: 'Orders', icon: 'clipboard', label: 'Orders'},
];

export default function BottomNav({
  active,
  onNavigate,
}: {
  active: TabKey;
  onNavigate: (key: TabKey) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.nav, {paddingBottom: s(13) + insets.bottom}]}>
      {TABS.map(tab => {
        const on = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{selected: on}}
            accessibilityLabel={tab.label}
            onPress={() => onNavigate(tab.key)}
            style={({pressed}) => [
              styles.item,
              pressed && !on && {opacity: 0.6},
            ]}>
            <Icon
              name={tab.icon}
              color={on ? colors.orange : colors.ink3}
              size={s(18)}
            />
            <Text
              style={[
                styles.label,
                {color: on ? colors.orange : colors.ink3},
              ]}>
              {tab.label}
            </Text>
            {on ? <View style={styles.indicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    backgroundColor: colors.appBar,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: s(9),
    paddingHorizontal: s(4),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: s(4),
    paddingTop: s(3),
  },
  label: {
    fontFamily: font.semibold,
    fontSize: s(9),
    letterSpacing: track(0.005, s(9)),
  },
  indicator: {
    position: 'absolute',
    bottom: -s(13),
    width: s(26),
    height: s(2.5),
    borderRadius: s(2),
    backgroundColor: colors.orange,
  },
});
