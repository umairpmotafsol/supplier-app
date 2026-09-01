/**
 * TAXMYMOTOR — DESIGN TOKENS
 * Ported 1:1 from the reference design (variant 1 "Grotesk").
 * Black + orange, layered dark charcoal/navy surfaces.
 */
import {Dimensions, PixelRatio} from 'react-native';

/* ------------------------------------------------------------------
 * Scale
 * The reference renders each screen inside a 312px device frame with
 * 9px bezel padding, i.e. a 294px content width. Every size below is
 * quoted in those reference units and scaled to the real viewport, so
 * proportions survive from a 360dp phone up to a tablet.
 * ---------------------------------------------------------------- */
const REFERENCE_WIDTH = 294;

const {width: VIEWPORT_WIDTH} = Dimensions.get('window');

export const SCALE = Math.min(
  Math.max(VIEWPORT_WIDTH / REFERENCE_WIDTH, 1),
  1.55,
);

/** Scale a reference-unit measurement to device units. */
export const s = (n: number) => PixelRatio.roundToNearestPixel(n * SCALE);

export const colors = {
  /* app surfaces */
  appBg: '#12171E',
  appBar: '#171D25',
  surface: '#1A212A',
  surface2: '#212A35',
  surface3: '#28323E',

  /* hairlines */
  line: '#2B3441',
  lineSoft: '#232B36',

  /* ink */
  ink: '#F3F6F9',
  ink2: '#A6B2BF',
  ink3: '#6C7887',
  ink4: '#4C5765',

  /* orange — the one accent */
  orange: '#F5871F',
  orangeBright: '#FF9E33',
  orangeDeep: '#D66F0A',
  orangeSoft: 'rgba(245,135,31,0.12)',
  orangeSofter: 'rgba(245,135,31,0.07)',
  orangeLine: 'rgba(245,135,31,0.42)',
  orangeGlow: 'rgba(245,135,31,0.20)',

  /* status */
  green: '#3ECB8C',
  greenSoft: 'rgba(62,203,140,0.13)',
  red: '#E85C5C',
  redSoft: 'rgba(232,92,92,0.13)',
  redLine: 'rgba(232,92,92,0.45)',

  /* fixed */
  onOrange: '#170F04',
  black: '#000000',
  white: '#FFFFFF',
  plateBorder: '#D3D8DE',
  plateInk: '#0A0C0F',
  bandTop: '#0B3EA8',
  bandBottom: '#082E80',
  euYellow: '#FFCC00',
  darkBtnLine: '#2C333C',
} as const;

export const font = {
  /* display — Archivo 800 */
  display: 'Archivo-ExtraBold',
  displayBold: 'Archivo-Bold',
  /* ui — Inter */
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  /* number plate — Oswald */
  plate: 'Oswald-SemiBold',
} as const;

export const radius = {
  card: s(14),
  ctl: s(10),
  btn: s(10),
  plate: s(7),
  pill: 999,
} as const;

/** Letter-spacing helper: CSS em tracking -> RN points. */
export const track = (em: number, size: number) => em * size;

export const type = {
  h1: s(22.5),
  h2: s(19),
  h3: s(13),
  lhDisplay: 1.12,
  displayTracking: -0.03,
  ctaSize: s(13.5),
  ctaTracking: -0.015,
  eyebrowTracking: 0.17,
} as const;

export const layout = {
  padH: s(17),
  padV: s(18),
  barPadH: s(16),
} as const;
