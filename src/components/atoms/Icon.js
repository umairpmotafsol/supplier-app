/**
 * Icon set, drawn from the bundled @react-native-vector-icons fonts.
 *
 * Callers keep using the app's own icon names; ICONS maps each one to a
 * font glyph. Feather is the default because its 2px round-cap outline
 * matches the stroke language the design was drawn in; the few glyphs
 * Feather lacks (brands, bank, car, checked shield) come from Ionicons or
 * Material Design Icons in their outline form.
 *
 *   <Icon name="camera" />                       // app name → Feather
 *   <Icon family="ionicons" name="cloud-done" /> // any glyph from a family
 *
 * Families: 'ionicons' | 'material' (Material Design Icons) | 'feather'.
 */
import React from 'react';
import Svg, { Circle, G } from 'react-native-svg';
/*
 * The `/static` entry points, not the package roots. Both platforms
 * already embed these fonts natively (the pods list them as resources and
 * each Android module copies them into assets), so the static variant
 * just names the font. The root entry would also `require` the .ttf,
 * shipping every icon font a second time inside the JS bundle's assets.
 */
import Feather from '@react-native-vector-icons/feather/static';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons/static';

import { colors, s } from '../../theme/tokens';

/** Reference sizes: .icon 18, .icon.sm 14, .icon.lg 22 */
export const iconSize = { sm: s(14), md: s(18), lg: s(22) };

/** The icon fonts bundled with the app, by the name callers pass. */
export const ICON_FAMILIES = {
  ionicons: Ionicons,
  material: MaterialDesignIcons,
  feather: Feather,
};

/** App icon name → [family, glyph]. */
export const ICONS = {
  back: ['feather', 'chevron-left'],
  chev: ['feather', 'chevron-right'],
  arrow: ['feather', 'arrow-right'],
  check: ['feather', 'check'],
  home: ['feather', 'home'],
  clipboard: ['feather', 'clipboard'],
  refer: ['feather', 'user-plus'],
  gear: ['feather', 'settings'],
  user: ['feather', 'user'],
  mail: ['feather', 'mail'],
  lock: ['feather', 'lock'],
  eye: ['feather', 'eye'],
  eyeOff: ['feather', 'eye-off'],
  bell: ['feather', 'bell'],
  shield: ['ionicons', 'shield-checkmark-outline'],
  doc: ['feather', 'file-text'],
  filter: ['feather', 'filter'],
  info: ['feather', 'info'],
  edit: ['feather', 'edit-2'],
  cal: ['feather', 'calendar'],
  bank: ['material', 'bank-outline'],
  card: ['feather', 'credit-card'],
  swap: ['feather', 'repeat'],
  car: ['ionicons', 'car-outline'],
  whatsapp: ['ionicons', 'logo-whatsapp'],
  copy: ['feather', 'copy'],
  share: ['feather', 'share-2'],
  clock: ['feather', 'clock'],
  upload: ['feather', 'upload'],
  download: ['feather', 'download'],
  send: ['feather', 'send'],
  print: ['feather', 'printer'],
  camera: ['feather', 'camera'],
  logout: ['feather', 'log-out'],
  alert: ['feather', 'alert-triangle'],
  apple: ['ionicons', 'logo-apple'],
  google: ['ionicons', 'logo-google'],
};

/**
 * `strokeWidth` is still accepted so existing call sites need no change,
 * but font glyphs have a fixed weight, so it has no effect.
 */
export default function Icon({
  name,
  size = iconSize.md,
  color = colors.ink2,
  style,
  family,
}) {
  const [familyName, glyph] = family ? [family, name] : ICONS[name] || [];
  const Family = ICON_FAMILIES[familyName];

  if (!Family) {
    if (__DEV__) {
      console.warn(
        family
          ? `<Icon family="${family}"> is not bundled. Use one of: ${Object.keys(
              ICON_FAMILIES,
            ).join(', ')}.`
          : `<Icon name="${name}"> has no mapping in ICONS.`,
      );
    }
    return null;
  }

  return <Family name={glyph} size={size} color={color} style={style} />;
}

const STAR_POSITIONS = [
  [12, 4],
  [16, 5.1],
  [18.9, 8],
  [20, 12],
  [18.9, 16],
  [16, 18.9],
  [12, 20],
  [8, 18.9],
  [5.1, 16],
  [4, 12],
  [5.1, 8],
  [8, 5.1],
];

/**
 * EU ring of stars on the number-plate band. This is artwork, not an icon
 * (no font has it), so it stays an SVG.
 */
export function EuStars({ size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill={colors.euYellow}>
        {STAR_POSITIONS.map(([cx, cy], i) => (
          <Circle key={i} cx={cx} cy={cy} r={1.05} />
        ))}
      </G>
    </Svg>
  );
}
