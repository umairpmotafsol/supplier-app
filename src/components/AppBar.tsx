/**
 * App bar with the orange rule underneath, trimmed to what the supplier
 * portal needs (no checkout step counter or progress rail).
 *
 * The bar carries no company mark. Suppliers are contractors working
 * orders, not customers of the consumer product, so the portal names
 * itself and nothing else.
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors, font, radius, s, track} from '../theme/tokens';
import {column, common} from '../theme/common';
import Icon, {iconSize} from './Icon';

type Props = {
  onBack?: () => void;
  title?: string;
  right?: React.ReactNode;
};

export default function AppBar({onBack, title, right}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, {paddingTop: insets.top + s(6)}]}>
      <View style={[styles.row, column]}>
        {onBack ? (
          <IconButton icon="back" onPress={onBack} label="Go back" />
        ) : null}

        <Text style={styles.name}>Supplier Portal</Text>

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
  icon: 'back' | 'filter' | 'edit' | 'logout';
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
  name: {
    fontFamily: font.display,
    fontSize: s(13.5),
    letterSpacing: track(-0.02, s(13.5)),
    color: colors.ink,
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
