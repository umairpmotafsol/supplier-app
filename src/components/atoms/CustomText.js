/**
 * Every piece of text in the app, as one prop-driven component.
 *
 * The variants are the app's type scale, lifted verbatim out of the UI
 * kit so nothing on screen changes: `h1`/`h2`/`h3` are the display face,
 * `sub` the muted paragraph under a heading, `eyebrow` the small tracked
 * label above a section, and `body` the default.
 *
 *   <CustomText variant="h2">Request changes</CustomText>
 *   <CustomText color={colors.orange} numberOfLines={1}>{reg}</CustomText>
 *
 * `ui.js` still exports H1/H2/H3/Sub/Eyebrow, which are now thin
 * wrappers around this, so existing screens did not have to change.
 */
import React from 'react';
import { Text } from 'react-native';

import { colors, font, s, track, type } from '../../theme/tokens';
import { common } from '../../theme/common';

/**
 * The style for each variant. Written as functions of the tokens rather
 * than a StyleSheet so the scale stays readable next to the tokens it
 * comes from.
 */
const VARIANTS = {
  h1: {
    fontFamily: font.display,
    fontSize: type.h1,
    lineHeight: type.h1 * type.lhDisplay,
    letterSpacing: track(type.displayTracking, type.h1),
    color: colors.ink,
    marginBottom: s(8),
  },
  h2: {
    fontFamily: font.display,
    fontSize: type.h2,
    lineHeight: type.h2 * (type.lhDisplay + 0.03),
    letterSpacing: track(type.displayTracking, type.h2),
    color: colors.ink,
    marginBottom: s(7),
  },
  h3: {
    fontFamily: font.display,
    fontSize: type.h3,
    letterSpacing: track(type.displayTracking, type.h3),
    color: colors.ink,
    marginBottom: s(10),
  },
  sub: {
    fontFamily: font.regular,
    fontSize: s(11.5),
    lineHeight: s(11.5) * 1.5,
    color: colors.ink3,
    marginBottom: s(18),
  },
  eyebrow: {
    fontFamily: font.bold,
    fontSize: s(9),
    letterSpacing: track(type.eyebrowTracking, s(9)),
    color: colors.ink4,
    marginBottom: s(9),
  },
  body: {
    fontFamily: font.regular,
    fontSize: s(11.5),
    lineHeight: s(11.5) * 1.5,
    color: colors.ink2,
  },
  label: {
    fontFamily: font.semibold,
    fontSize: s(11.5),
    color: colors.ink,
  },
};

export const TEXT_VARIANTS = Object.keys(VARIANTS);

/**
 * @param {object} props
 * @param {keyof typeof VARIANTS} [props.variant] defaults to 'body'
 * @param {string} [props.color] overrides the variant's colour
 * @param {boolean} [props.center]
 * @param {boolean} [props.uppercase]
 */
export default function CustomText({
  children,
  variant = 'body',
  color,
  center,
  uppercase,
  style,
  ...props
}) {
  const base = VARIANTS[variant] ?? VARIANTS.body;
  return (
    <Text
      {...props}
      style={[
        base,
        variant === 'eyebrow' || uppercase ? common.uppercase : null,
        color ? { color } : null,
        center ? common.textCenter : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
