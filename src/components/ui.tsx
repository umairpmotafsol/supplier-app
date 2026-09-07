/**
 * UI kit — the shared pieces the supplier portal builds on, without
 * the checkout-only components.
 */
import React, {forwardRef, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
  TextInputProps,
} from 'react-native';

import {colors, font, radius, s, track, type} from '../theme/tokens';
import {common} from '../theme/common';
import Icon, {EuStars, IconName, iconSize} from './Icon';
import {Gradient} from './Gradient';

/* ============================== typography ============================== */

export type TextInputRef = React.ComponentRef<typeof TextInput>;

export function H1({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        {
          fontFamily: font.display,
          fontSize: type.h1,
          lineHeight: type.h1 * type.lhDisplay,
          letterSpacing: track(type.displayTracking, type.h1),
          color: colors.ink,
          marginBottom: s(8),
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function H2({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        {
          fontFamily: font.display,
          fontSize: type.h2,
          lineHeight: type.h2 * (type.lhDisplay + 0.03),
          letterSpacing: track(type.displayTracking, type.h2),
          color: colors.ink,
          marginBottom: s(7),
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function H3({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        {
          fontFamily: font.display,
          fontSize: type.h3,
          letterSpacing: track(type.displayTracking, type.h3),
          color: colors.ink,
          marginBottom: s(10),
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Sub({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        {
          fontFamily: font.regular,
          fontSize: s(11.5),
          lineHeight: s(11.5) * 1.5,
          color: colors.ink3,
          marginBottom: s(18),
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Eyebrow({
  children,
  style,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        {
          fontFamily: font.bold,
          fontSize: s(9),
          letterSpacing: track(type.eyebrowTracking, s(9)),
          color: colors.ink4,
          marginBottom: s(9),
        },
        common.uppercase,
        style,
      ]}>
      {children}
    </Text>
  );
}

/* ================================= CTA ================================= */

type CtaProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'dark';
  icon?: IconName;
  iconPosition?: 'leading' | 'trailing';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Cta({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'trailing',
  disabled,
  style,
}: CtaProps) {
  const isPrimary = variant === 'primary';
  const isDark = variant === 'dark';

  const labelColor = isPrimary ? colors.onOrange : colors.ink;
  const labelSize = isPrimary ? type.ctaSize : isDark ? s(13.5) : s(12);

  const glyph = icon ? (
    <Icon name={icon} size={s(15)} color={labelColor} strokeWidth={2.2} />
  ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled: !!disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        ctaStyles.base,
        isPrimary && ctaStyles.primary,
        variant === 'ghost' && ctaStyles.ghost,
        isDark && ctaStyles.dark,
        variant === 'ghost' && {paddingVertical: s(10.5)},
        disabled && {opacity: 0.45},
        pressed && !disabled && {transform: [{translateY: 1}], opacity: 0.92},
        style,
      ]}>
      {isPrimary && (
        <Gradient
          radius={radius.btn}
          stops={[
            {color: colors.orangeBright, offset: 0},
            {color: colors.orangeDeep, offset: 1},
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
        }}>
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
    shadowOffset: {width: 0, height: 5},
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

/* ================================ cards ================================ */

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
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
export function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'orange' | 'red' | 'green';
}) {
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
      <Text style={[statStyles.value, {color: valueColor}]}>{value}</Text>
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

export function Plate({reg}: {reg: string}) {
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

export function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{marginBottom: s(11)}, style]}>
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

type InputProps = TextInputProps & {
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  onTrailingPress?: () => void;
  invalid?: boolean;
};

export const Input = forwardRef<TextInputRef, InputProps>(function TextField(
  /*
   * `style` is pulled out rather than left in the spread: it belongs on
   * the TextInput, and the spread lands before the style prop below, so
   * anything passed through would be silently dropped.
   */
  {leadingIcon, trailingIcon, onTrailingPress, invalid, style, ...props},
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        inputStyles.wrap,
        props.multiline && inputStyles.wrapMultiline,
        focused && {borderColor: colors.orange},
        invalid && !focused && {borderColor: colors.orangeLine},
      ]}>
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
          accessibilityRole="button">
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
  wrapMultiline: {alignItems: 'flex-start'},
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontFamily: font.regular,
    fontSize: s(12),
    paddingVertical: s(12),
  },
});

const row2Style = {flexDirection: 'row' as const, gap: s(11)};

export function Row2({children}: {children: React.ReactNode}) {
  return <View style={row2Style}>{children}</View>;
}

/* ============================== banners/hints ============================== */

export function Banner({
  icon,
  children,
  tone = 'orange',
  textStyle,
  style,
}: {
  icon: IconName;
  children: React.ReactNode;
  tone?: 'orange' | 'red' | 'green';
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  const accent =
    tone === 'red' ? colors.red : tone === 'green' ? colors.green : colors.orange;
  const line =
    tone === 'red' ? colors.redLine : tone === 'green' ? colors.greenSoft : colors.orangeLine;
  return (
    <View style={[bannerStyles.wrap, {borderColor: line}, style]}>
      <Gradient
        radius={radius.card}
        stops={[
          {color: accent, offset: 0, opacity: 0.07},
          {color: accent, offset: 1, opacity: 0},
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

export function Hint({
  icon,
  children,
  center,
  orange,
  style,
}: {
  icon?: IconName;
  children: React.ReactNode;
  center?: boolean;
  orange?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[hintStyles.wrap, center && common.centered, style]}>
      {icon ? (
        <Icon
          name={icon}
          size={iconSize.sm}
          color={orange ? colors.orange : colors.ink3}
          style={{marginTop: s(0.5)}}
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

export type BadgeTone = 'done' | 'live' | 'overdue' | 'neutral';

export function Badge({label, tone}: {label: string; tone: BadgeTone}) {
  const styleFor: Record<BadgeTone, {bg?: string; border?: string; text: string}> = {
    done: {bg: colors.greenSoft, text: colors.green},
    live: {border: colors.orange, text: colors.orange},
    overdue: {bg: colors.redSoft, border: colors.redLine, text: colors.red},
    neutral: {border: colors.line, text: colors.ink3},
  };
  const tokenStyle = styleFor[tone];
  return (
    <View
      style={[
        badgeStyles.wrap,
        tokenStyle.bg ? {backgroundColor: tokenStyle.bg} : null,
        tokenStyle.border ? {borderWidth: 1, borderColor: tokenStyle.border} : null,
      ]}>
      <Text style={[badgeStyles.text, {color: tokenStyle.text}]}>{label}</Text>
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
  text: {fontFamily: font.bold, fontSize: s(9)},
});

/* ============================== settings list ============================== */

export function List({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[listStyles.list, style]}>{children}</View>;
}

export function ListItem({
  icon,
  title,
  value,
  onPress,
  last,
}: {
  icon: IconName;
  title: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        listStyles.item,
        last && {borderBottomWidth: 0},
        pressed && onPress && {backgroundColor: colors.surface2},
      ]}>
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

export function SummaryRow({label, value}: {label: string; value: string}) {
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
  label: {fontFamily: font.medium, fontSize: s(11.5), color: colors.ink2},
  value: {fontFamily: font.regular, fontSize: s(11.5), color: colors.ink2},
});
