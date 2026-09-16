/**
 * The app's button, in the three variants the design uses:
 *
 *  - `primary` — the orange gradient CTA, one per screen;
 *  - `ghost`   — hairline outline, for the secondary action;
 *  - `dark`    — black with a soft border.
 *
 * Lifted verbatim out of the UI kit (it was `Cta`, which `ui.js` still
 * exports as an alias), plus a `loading` state: a button that fires an
 * async action has to stop taking taps while it runs, and every caller
 * was otherwise going to re-implement that with its own `busy` flag.
 */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius, s, track, type } from '../../theme/tokens';
import Icon from './Icon';
import { Gradient } from '../Gradient';

/**
 * @param {object} props
 * @param {string} props.label
 * @param {() => void} [props.onPress]
 * @param {'primary' | 'ghost' | 'dark'} [props.variant]
 * @param {string} [props.icon] a glyph from the sprite
 * @param {'leading' | 'trailing'} [props.iconPosition]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.loading] shows a spinner and refuses taps
 */
export default function CustomButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'trailing',
  disabled,
  loading,
  style,
  accessibilityLabel,
}) {
  const isPrimary = variant === 'primary';
  const isDark = variant === 'dark';
  const inert = !!disabled || !!loading;

  const labelColor = isPrimary ? colors.onOrange : colors.ink;
  const labelSize = isPrimary ? type.ctaSize : isDark ? s(13.5) : s(12);

  const glyph = loading ? (
    <ActivityIndicator size="small" color={labelColor} />
  ) : icon ? (
    <Icon name={icon} size={s(15)} color={labelColor} strokeWidth={2.2} />
  ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inert, busy: !!loading }}
      disabled={inert}
      onPress={onPress}
      style={({ pressed }) => [
        ctaStyles.base,
        isPrimary && ctaStyles.primary,
        variant === 'ghost' && ctaStyles.ghost,
        isDark && ctaStyles.dark,
        variant === 'ghost' && { paddingVertical: s(10.5) },
        inert && { opacity: 0.45 },
        pressed && !inert && { transform: [{ translateY: 1 }], opacity: 0.92 },
        style,
      ]}
    >
      {isPrimary && (
        <Gradient
          radius={radius.btn}
          stops={[
            { color: colors.orangeBright, offset: 0 },
            { color: colors.orangeDeep, offset: 1 },
          ]}
        />
      )}
      {iconPosition === 'leading' ? glyph : null}
      <Text
        style={{
          fontFamily: font.display,
          fontSize: labelSize,
          letterSpacing: track(type.ctaTracking, labelSize),
          color: isDark ? colors.white : labelColor,
        }}
      >
        {label}
      </Text>
      {iconPosition === 'trailing' ? glyph : null}
    </Pressable>
  );
}

const ctaStyles = StyleSheet.create({
  base: {
    width: '100%',
    borderRadius: radius.btn,
    paddingVertical: s(12),
    paddingHorizontal: s(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(7),
    overflow: 'hidden',
  },
  primary: {
    shadowColor: colors.orange,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.line,
  },
  dark: {
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.darkBtnLine,
  },
});
