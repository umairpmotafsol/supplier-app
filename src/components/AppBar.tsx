/**
 * App bar with the signature orange rule underneath — ported from the
 * customer app, trimmed to what the supplier portal needs (no checkout
 * step counter or progress rail).
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors, font, radius, s, track} from '../theme/tokens';
import {common} from '../theme/common';
import Icon, {Logo, iconSize} from './Icon';

type Props = {
  onBack?: () => void;
  title?: string;
  right?: React.ReactNode;
};

export default function AppBar({onBack, title, right}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, {paddingTop: insets.top + s(6)}]}>
      <View style={styles.row}>
        {onBack ? (
          <IconButton icon="back" onPress={onBack} label="Go back" />
        ) : null}

        <View style={styles.mark}>
          <Logo size={s(26)} />
          <View>
            <Text style={styles.name}>
              Tax<Text style={{color: colors.orange}}>My</Text>Motor
            </Text>
            <Text style={styles.tagline}>SUPPLIER PORTAL</Text>
          </View>
        </View>

        {title ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.title}>{title}</Text>
          </>
        ) : null}

        <View style={common.spacer} />
        {right}
      </View>
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  ring,
  label,
  small,
}: {
  icon: 'back' | 'filter' | 'edit';
  onPress?: () => void;
  ring?: boolean;
  label?: string;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({pressed}) => [
        styles.iconBtn,
        ring && {borderWidth: 1, borderColor: colors.line},
        pressed && {backgroundColor: 'rgba(255,255,255,0.06)'},
      ]}>
      <Icon
        name={icon}
        size={small ? iconSize.sm : iconSize.md}
        color={colors.ink2}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.appBar,
    paddingHorizontal: s(16),
    paddingBottom: s(13),
    borderBottomWidth: 1.5,
    borderBottomColor: colors.orange,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    minHeight: s(32),
  },
  mark: {flexDirection: 'row', alignItems: 'center', gap: s(8)},
  name: {
    fontFamily: font.display,
    fontSize: s(13.5),
    letterSpacing: track(-0.02, s(13.5)),
    color: colors.ink,
  },
  tagline: {
    fontFamily: font.semibold,
    fontSize: s(6),
    letterSpacing: track(0.2, s(6)),
    color: colors.ink3,
    marginTop: s(2),
  },
  divider: {width: 1, height: s(20), backgroundColor: colors.line},
  title: {
    fontFamily: font.display,
    fontSize: s(14.5),
    letterSpacing: track(-0.02, s(14.5)),
    color: colors.ink,
  },
  iconBtn: {
    width: s(32),
    height: s(32),
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
