/**
 * UI kit — the shared pieces the supplier portal builds on, without
 * the checkout-only components.
 */
import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius, s, track } from '../theme/tokens';
import { common } from '../theme/common';
import Icon, { EuStars, iconSize } from './atoms/Icon';
import CustomButton from './atoms/CustomButton';
import CustomText from './atoms/CustomText';
import { Gradient } from './Gradient';

/* ============================== typography ============================== */

/*
 * The type scale now lives in `atoms/CustomText`, which is one component
 * with a `variant` prop. These named wrappers are kept because every
 * screen reads better with them, and because they were the API before
 * the move — `<H2>` says what it is at a glance where
 * `<CustomText variant="h2">` makes you read the prop.
 */

export const H1 = props => <CustomText variant="h1" {...props} />;
export const H2 = props => <CustomText variant="h2" {...props} />;
export const H3 = props => <CustomText variant="h3" {...props} />;
export const Sub = props => <CustomText variant="sub" {...props} />;
export const Eyebrow = props => <CustomText variant="eyebrow" {...props} />;

/* ================================= CTA ================================= */

/*
 * The button moved to `atoms/CustomButton` unchanged. `Cta` is the name
 * every screen calls it by, so it stays as the alias.
 */
export const Cta = CustomButton;

/* ================================ cards ================================ */

export function Card({ children, style }) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
  },
});

/** Small summary tile used on the dashboard grid. */
export function StatTile({ label, value, tone }) {
  const valueColor =
    tone === 'orange'
      ? colors.orange
      : tone === 'red'
      ? colors.red
      : tone === 'green'
      ? colors.green
      : colors.ink;
  return (
    <Card style={statStyles.tile}>
      <Text style={[statStyles.value, { color: valueColor }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </Card>
  );
}

const statStyles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: s(13),
    paddingHorizontal: s(12),
  },
  value: {
    fontFamily: font.display,
    fontSize: s(19),
    letterSpacing: track(-0.02, s(19)),
    color: colors.ink,
    marginBottom: s(4),
  },
  label: {
    fontFamily: font.medium,
    fontSize: s(9.5),
    color: colors.ink3,
  },
});

/* ============================= number plate ============================= */

export function Plate({ reg }) {
  return (
    <View style={plateStyles.plate}>
      <View style={plateStyles.band}>
        <EuStars size={s(9)} />
        <Text style={plateStyles.bandText}>UK</Text>
      </View>
      <Text style={plateStyles.reg}>{reg}</Text>
    </View>
  );
}

const plateStyles = StyleSheet.create({
  plate: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius.plate,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.plateBorder,
  },
  band: {
    width: s(15),
    backgroundColor: colors.bandTop,
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(2),
    paddingVertical: s(4),
  },
  bandText: {
    fontFamily: font.plate,
    fontSize: s(5.5),
    color: colors.white,
    letterSpacing: track(0.02, s(5.5)),
    includeFontPadding: false,
  },
  reg: {
    fontFamily: font.plate,
    color: colors.plateInk,
    letterSpacing: track(0.045, s(11.5)),
    fontSize: s(11.5),
    paddingHorizontal: s(8),
    paddingVertical: s(5),
    includeFontPadding: false,
  },
});

/* ============================== form fields ============================== */

export function Field({ label, children, style }) {
  return (
    <View style={[{ marginBottom: s(11) }, style]}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: {
    fontFamily: font.semibold,
    fontSize: s(10.5),
    color: colors.ink2,
    marginBottom: s(6),
  },
});

export const Input = forwardRef(function TextField(
  /*
   * `style` is pulled out rather than left in the spread: it belongs on
   * the TextInput, and the spread lands before the style prop below, so
   * anything passed through would be silently dropped.
   */
  { leadingIcon, trailingIcon, onTrailingPress, invalid, style, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        inputStyles.wrap,
        props.multiline && inputStyles.wrapMultiline,
        focused && { borderColor: colors.orange },
        invalid && !focused && { borderColor: colors.orangeLine },
      ]}
    >
      {leadingIcon ? (
        <Icon name={leadingIcon} color={colors.ink4} size={iconSize.md} />
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.ink4}
        selectionColor={colors.orange}
        {...props}
        onFocus={e => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[inputStyles.input, style]}
      />

      {trailingIcon ? (
        <Pressable
          hitSlop={s(8)}
          onPress={onTrailingPress}
          accessibilityRole="button"
        >
          <Icon name={trailingIcon} color={colors.ink4} size={iconSize.md} />
        </Pressable>
      ) : null}
    </View>
  );
});

const inputStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.ctl,
    paddingHorizontal: s(13),
  },
  wrapMultiline: { alignItems: 'flex-start' },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontFamily: font.regular,
    fontSize: s(12),
    paddingVertical: s(12),
  },
});

const row2Style = { flexDirection: 'row', gap: s(11) };

export function Row2({ children }) {
  return <View style={row2Style}>{children}</View>;
}

/* ============================== banners/hints ============================== */

export function Banner({ icon, children, tone = 'orange', textStyle, style }) {
  const accent =
    tone === 'red'
      ? colors.red
      : tone === 'green'
      ? colors.green
      : colors.orange;
  const line =
    tone === 'red'
      ? colors.redLine
      : tone === 'green'
      ? colors.greenSoft
      : colors.orangeLine;
  return (
    <View style={[bannerStyles.wrap, { borderColor: line }, style]}>
      <Gradient
        radius={radius.card}
        stops={[
          { color: accent, offset: 0, opacity: 0.07 },
          { color: accent, offset: 1, opacity: 0 },
        ]}
      />

      <Icon name={icon} color={accent} />
      <Text style={[bannerStyles.text, textStyle]}>{children}</Text>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(11),
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: s(12),
    paddingHorizontal: s(13),
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  text: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: s(11.5),
    letterSpacing: track(-0.01, s(11.5)),
    color: colors.ink,
  },
});

export function Hint({ icon, children, center, orange, style }) {
  return (
    <View style={[hintStyles.wrap, center && common.centered, style]}>
      {icon ? (
        <Icon
          name={icon}
          size={iconSize.sm}
          color={orange ? colors.orange : colors.ink3}
          style={{ marginTop: s(0.5) }}
        />
      ) : null}
      <Text style={[hintStyles.text, center && common.textCenter]}>
        {children}
      </Text>
    </View>
  );
}

const hintStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: s(8),
    alignItems: 'flex-start',
    marginTop: s(12),
    marginHorizontal: s(2),
  },
  text: {
    flexShrink: 1,
    fontFamily: font.regular,
    fontSize: s(10),
    lineHeight: s(10) * 1.5,
    color: colors.ink3,
  },
});

/* ================================= badge ================================= */

export function Badge({ label, tone }) {
  const styleFor = {
    done: { bg: colors.greenSoft, text: colors.green },
    live: { border: colors.orange, text: colors.orange },
    overdue: { bg: colors.redSoft, border: colors.redLine, text: colors.red },
    neutral: { border: colors.line, text: colors.ink3 },
  };
  const tokenStyle = styleFor[tone];
  return (
    <View
      style={[
        badgeStyles.wrap,
        tokenStyle.bg ? { backgroundColor: tokenStyle.bg } : null,
        tokenStyle.border
          ? { borderWidth: 1, borderColor: tokenStyle.border }
          : null,
      ]}
    >
      <Text style={[badgeStyles.text, { color: tokenStyle.text }]}>
        {label}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingVertical: s(5),
    paddingHorizontal: s(10),
    borderRadius: radius.pill,
  },
  text: { fontFamily: font.bold, fontSize: s(9) },
});

/* ============================== settings list ============================== */

export function List({ children, style }) {
  return <View style={[listStyles.list, style]}>{children}</View>;
}

export function ListItem({ icon, title, value, onPress, last }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        listStyles.item,
        last && { borderBottomWidth: 0 },
        pressed && onPress && { backgroundColor: colors.surface2 },
      ]}
    >
      <Icon name={icon} color={colors.orange} />
      <View style={common.fill}>
        <Text style={listStyles.key}>{title}</Text>
        {value ? (
          <Text numberOfLines={2} style={listStyles.value}>
            {value}
          </Text>
        ) : null}
      </View>
      {onPress ? <Icon name="chev" size={s(16)} color={colors.ink4} /> : null}
    </Pressable>
  );
}

const listStyles = StyleSheet.create({
  list: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    padding: s(13),
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  key: {
    fontFamily: font.semibold,
    fontSize: s(11.5),
    letterSpacing: track(-0.01, s(11.5)),
    color: colors.ink,
  },
  value: {
    fontFamily: font.regular,
    fontSize: s(10.5),
    color: colors.ink3,
    marginTop: s(2),
  },
});

/* ============================ summary breakdown ============================ */

export function SummaryRow({ label, value }) {
  return (
    <View style={sumStyles.row}>
      <Text style={sumStyles.label}>{label}</Text>
      <Text style={sumStyles.value}>{value}</Text>
    </View>
  );
}

const sumStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: s(5),
  },
  label: { fontFamily: font.medium, fontSize: s(11.5), color: colors.ink2 },
  value: { fontFamily: font.regular, fontSize: s(11.5), color: colors.ink2 },
});
