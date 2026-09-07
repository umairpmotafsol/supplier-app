/**
 * Icon set - a direct port of the reference SVG sprite.
 * Stroke icons inherit the passed colour; apple/google are filled marks.
 */
import React from 'react';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
} from 'react-native-svg';
import type {StyleProp, ViewStyle} from 'react-native';

import {colors, s} from '../theme/tokens';

export type IconName =
  | 'back'
  | 'chev'
  | 'arrow'
  | 'check'
  | 'home'
  | 'clipboard'
  | 'refer'
  | 'gear'
  | 'user'
  | 'mail'
  | 'lock'
  | 'eye'
  | 'eyeOff'
  | 'bell'
  | 'shield'
  | 'doc'
  | 'filter'
  | 'info'
  | 'edit'
  | 'cal'
  | 'card'
  | 'bank'
  | 'swap'
  | 'car'
  | 'whatsapp'
  | 'apple'
  | 'google'
  | 'copy'
  | 'share'
  | 'clock'
  | 'upload'
  | 'download'
  | 'send'
  | 'print'
  | 'camera'
  | 'logout'
  | 'alert';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/** Reference sizes: .icon 18, .icon.sm 14, .icon.lg 22 */
export const iconSize = {sm: s(14), md: s(18), lg: s(22)};

type StrokeProps = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: string;
};

export default function Icon({
  name,
  size = iconSize.md,
  color = colors.ink2,
  strokeWidth = 1.9,
  style,
}: Props) {
  const p: StrokeProps = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  };

  if (name === 'apple') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <Path
          fill={color}
          d="M17.05 12.72c-.02-2.1 1.72-3.11 1.8-3.16-.98-1.44-2.5-1.63-3.05-1.65-1.3-.13-2.54.76-3.2.76-.66 0-1.68-.74-2.76-.72-1.42.02-2.73.82-3.46 2.09-1.47 2.56-.38 6.35 1.06 8.43.7 1.02 1.54 2.16 2.64 2.12 1.06-.04 1.46-.68 2.74-.68s1.64.68 2.76.66c1.14-.02 1.86-1.04 2.56-2.06.8-1.18 1.13-2.32 1.15-2.38-.03-.01-2.2-.85-2.24-3.35z"
        />
        <Path
          fill={color}
          d="M14.96 6.5c.58-.71.98-1.7.87-2.68-.84.03-1.86.56-2.46 1.27-.54.62-1.01 1.63-.88 2.59.94.07 1.9-.48 2.47-1.18z"
        />
      </Svg>
    );
  }

  if (name === 'google') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <Path
          fill="#4285F4"
          d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.35z"
        />
        <Path
          fill="#34A853"
          d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.58A10 10 0 0 0 12 22z"
        />
        <Path
          fill="#FBBC05"
          d="M6.41 13.92a6 6 0 0 1 0-3.83V7.5H3.06a10 10 0 0 0 0 9z"
        />
        <Path
          fill="#EA4335"
          d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.94 5.5l3.35 2.6C7.2 7.72 9.4 5.95 12 5.95z"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {glyph(name, p)}
    </Svg>
  );
}

function glyph(name: IconName, p: StrokeProps) {
  switch (name) {
    case 'back':
      return <Polyline {...p} points="15 18 9 12 15 6" />;
    case 'chev':
      return <Polyline {...p} points="9 18 15 12 9 6" />;
    case 'arrow':
      return (
        <>
          <Line {...p} x1="4" y1="12" x2="19" y2="12" />
          <Polyline {...p} points="12.5 5.5 19 12 12.5 18.5" />
        </>
      );
    case 'check':
      return <Polyline {...p} points="4.5 12.5 9.5 17.5 19.5 6.5" />;

    case 'home':
      return (
        <>
          <Path
            {...p}
            d="M3 9.8 12 3l9 6.8V20a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 20z"
          />
          <Polyline {...p} points="9.4 21.6 9.4 13.6 14.6 13.6 14.6 21.6" />
        </>
      );
    case 'clipboard':
      return (
        <>
          <Rect {...p} x="4.5" y="4.5" width="15" height="17" rx="2" />
          <Rect {...p} x="9" y="2.4" width="6" height="4" rx="1.2" />
          <Line {...p} x1="8.4" y1="11" x2="15.6" y2="11" />
          <Line {...p} x1="8.4" y1="14.6" x2="15.6" y2="14.6" />
          <Line {...p} x1="8.4" y1="18.2" x2="13" y2="18.2" />
        </>
      );
    case 'refer':
      return (
        <>
          <Path {...p} d="M15 20.5v-1.8a4 4 0 0 0-4-4H5.6a4 4 0 0 0-4 4v1.8" />
          <Circle {...p} cx="8.3" cy="7.2" r="3.6" />
          <Line {...p} x1="19.4" y1="6.4" x2="19.4" y2="12" />
          <Line {...p} x1="22.2" y1="9.2" x2="16.6" y2="9.2" />
        </>
      );
    case 'gear':
      return (
        <>
          <Circle {...p} cx="12" cy="12" r="3.1" />
          <Path
            {...p}
            d="M19.2 14.6a1.5 1.5 0 0 0 .3 1.65l.05.06a1.85 1.85 0 1 1-2.6 2.6l-.06-.05a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.9 1.37v.17a1.85 1.85 0 0 1-3.7 0v-.09a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.06.05a1.85 1.85 0 1 1-2.6-2.6l.05-.06a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9H4.2a1.85 1.85 0 0 1 0-3.7h.09a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.05-.06a1.85 1.85 0 1 1 2.6-2.6l.06.05a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .9-1.37V4.2a1.85 1.85 0 0 1 3.7 0v.09a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.06-.05a1.85 1.85 0 1 1 2.6 2.6l-.05.06a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.9h.17a1.85 1.85 0 0 1 0 3.7h-.09a1.5 1.5 0 0 0-1.37.9z"
          />
        </>
      );

    case 'user':
      return (
        <>
          <Path {...p} d="M20 21v-1.8a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5V21" />
          <Circle {...p} cx="12" cy="7.4" r="4" />
        </>
      );
    case 'mail':
      return (
        <>
          <Rect {...p} x="2.5" y="4.8" width="19" height="14.4" rx="2.2" />
          <Polyline {...p} points="3.4 6.6 12 13 20.6 6.6" />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect {...p} x="4" y="10.4" width="16" height="10.6" rx="2.4" />
          <Path {...p} d="M7.8 10.4V7.6a4.2 4.2 0 0 1 8.4 0v2.8" />
        </>
      );
    case 'eye':
      return (
        <>
          <Path
            {...p}
            d="M1.8 12S5.6 5.4 12 5.4 22.2 12 22.2 12 18.4 18.6 12 18.6 1.8 12 1.8 12z"
          />
          <Circle {...p} cx="12" cy="12" r="2.9" />
        </>
      );
    case 'eyeOff':
      return (
        <>
          <Path
            {...p}
            d="M1.8 12S5.6 5.4 12 5.4 22.2 12 22.2 12 18.4 18.6 12 18.6 1.8 12 1.8 12z"
          />
          <Circle {...p} cx="12" cy="12" r="2.9" />
          <Line {...p} x1="3.6" y1="20.4" x2="20.4" y2="3.6" />
        </>
      );
    case 'bell':
      return (
        <>
          <Path
            {...p}
            d="M18.4 9.2a6.4 6.4 0 1 0-12.8 0c0 6.4-2.8 8.4-2.8 8.4h18.4s-2.8-2-2.8-8.4"
          />
          <Path {...p} d="M13.9 20.6a2.2 2.2 0 0 1-3.8 0" />
        </>
      );
    case 'shield':
      return (
        <>
          <Path
            {...p}
            d="M12 2.4 4.4 5.6v6c0 4.7 3.2 9.1 7.6 10.4 4.4-1.3 7.6-5.7 7.6-10.4v-6z"
          />
          <Polyline {...p} points="8.8 11.9 11.2 14.3 15.4 10.1" />
        </>
      );
    case 'doc':
      return (
        <>
          <Path
            {...p}
            d="M14.2 2.6H6.8a2 2 0 0 0-2 2v14.8a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-2V7.4z"
          />
          <Polyline {...p} points="14.2 2.6 14.2 7.4 19.2 7.4" />
          <Line {...p} x1="8.6" y1="12.4" x2="14.4" y2="12.4" />
          <Line {...p} x1="8.6" y1="16" x2="14.4" y2="16" />
        </>
      );
    case 'filter':
      return (
        <Polygon
          {...p}
          points="21.4 3.6 2.6 3.6 10.1 12.5 10.1 18.8 13.9 20.6 13.9 12.5"
        />
      );
    case 'info':
      return (
        <>
          <Circle {...p} cx="12" cy="12" r="9.4" />
          <Line {...p} x1="12" y1="16.4" x2="12" y2="11.4" />
          <Line {...p} x1="12" y1="7.9" x2="12.01" y2="7.9" />
        </>
      );
    case 'edit':
      return (
        <Path
          {...p}
          d="M17.4 3.2a2.7 2.7 0 0 1 3.8 3.8L8.2 20 3 21.4l1.4-5.2z"
        />
      );
    case 'cal':
      return (
        <>
          <Rect {...p} x="3.4" y="5.2" width="17.2" height="16" rx="2.2" />
          <Line {...p} x1="3.4" y1="10" x2="20.6" y2="10" />
          <Line {...p} x1="8.2" y1="2.8" x2="8.2" y2="7" />
          <Line {...p} x1="15.8" y1="2.8" x2="15.8" y2="7" />
        </>
      );
    case 'bank':
      /* Classical bank front: pediment, four columns, plinth. */
      return (
        <>
          <Polyline {...p} points="2.6 9 12 3.6 21.4 9" />
          <Line {...p} x1="2.6" y1="9" x2="21.4" y2="9" />
          <Line {...p} x1="5.6" y1="11.4" x2="5.6" y2="17.4" />
          <Line {...p} x1="9.9" y1="11.4" x2="9.9" y2="17.4" />
          <Line {...p} x1="14.1" y1="11.4" x2="14.1" y2="17.4" />
          <Line {...p} x1="18.4" y1="11.4" x2="18.4" y2="17.4" />
          <Line {...p} x1="3.2" y1="20.2" x2="20.8" y2="20.2" />
        </>
      );
    case 'card':
      return (
        <>
          <Rect {...p} x="2.4" y="5.2" width="19.2" height="13.6" rx="2.4" />
          <Line {...p} x1="2.4" y1="10" x2="21.6" y2="10" />
        </>
      );
    case 'swap':
      return (
        <>
          <Polyline {...p} points="16.4 2.8 20.6 7 16.4 11.2" />
          <Path {...p} d="M20.6 7H6.4a3 3 0 0 0-3 3v1" />
          <Polyline {...p} points="7.6 21.2 3.4 17 7.6 12.8" />
          <Path {...p} d="M3.4 17h14.2a3 3 0 0 0 3-3v-1" />
        </>
      );
    case 'car':
      return (
        <>
          <Path
            {...p}
            d="M2.2 15.4v-2.6l2.3-4.6A2.2 2.2 0 0 1 6.5 6.9h8.2a2.2 2.2 0 0 1 1.6.7l3 3.2 2.2.7a1.7 1.7 0 0 1 1.2 1.6v2.3h-2.3"
          />
          <Line {...p} x1="8.4" y1="15.4" x2="15.2" y2="15.4" />
          <Line {...p} x1="4.6" y1="11.6" x2="18.4" y2="11.6" />
          <Circle {...p} cx="6.4" cy="15.7" r="2.1" />
          <Circle {...p} cx="17.3" cy="15.7" r="2.1" />
        </>
      );
    case 'whatsapp':
      return (
        <>
          <Path
            {...p}
            d="M21 11.6a9 9 0 0 1-13.3 7.9L3 21l1.6-4.5A9 9 0 1 1 21 11.6z"
          />
          <Path
            {...p}
            d="M9.1 8.9c0 3.3 2.7 6 6 6l1-1.6-2.1-1-.8.9a5 5 0 0 1-2.4-2.4l.9-.8-1-2.1z"
          />
        </>
      );

    /* Referral screen additions, drawn in the same stroke language. */
    case 'copy':
      return (
        <>
          <Rect {...p} x="8.6" y="8.6" width="12.8" height="12.8" rx="2" />
          <Path
            {...p}
            d="M4.6 15.4H4a1.4 1.4 0 0 1-1.4-1.4V4a1.4 1.4 0 0 1 1.4-1.4h10a1.4 1.4 0 0 1 1.4 1.4v.6"
          />
        </>
      );
    case 'share':
      return (
        <>
          <Circle {...p} cx="18.4" cy="5.2" r="2.8" />
          <Circle {...p} cx="5.6" cy="12" r="2.8" />
          <Circle {...p} cx="18.4" cy="18.8" r="2.8" />
          <Line {...p} x1="8.05" y1="10.65" x2="15.95" y2="6.55" />
          <Line {...p} x1="8.05" y1="13.35" x2="15.95" y2="17.45" />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle {...p} cx="12" cy="12" r="9.4" />
          <Polyline {...p} points="12 6.8 12 12 16 14.4" />
        </>
      );
    case 'upload':
      return (
        <>
          <Polyline {...p} points="7.6 9.2 12 4.8 16.4 9.2" />
          <Line {...p} x1="12" y1="4.8" x2="12" y2="15.6" />
          <Path {...p} d="M4.8 15.6v3.2a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-2v-3.2" />
        </>
      );
    case 'download':
      return (
        <>
          <Polyline {...p} points="7.6 11.6 12 16 16.4 11.6" />
          <Line {...p} x1="12" y1="4.4" x2="12" y2="16" />
          <Path {...p} d="M4.8 15.6v3.2a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-2v-3.2" />
        </>
      );
    case 'send':
      return (
        <Path
          {...p}
          d="M21 3 3 10.4l7 3.2 3.2 7z M21 3l-7.6 17.6-3.2-7-7-3.2z"
        />
      );
    case 'print':
      return (
        <>
          <Polyline {...p} points="6.4 8.4 6.4 3.2 17.6 3.2 17.6 8.4" />
          <Rect {...p} x="3.2" y="8.4" width="17.6" height="8.4" rx="1.6" />
          <Rect {...p} x="6.4" y="14" width="11.2" height="6.8" />
        </>
      );
    case 'camera':
      return (
        <>
          <Path
            {...p}
            d="M4.6 8.4h2.9l1.5-2.2h6l1.5 2.2h2.9a1.6 1.6 0 0 1 1.6 1.6v7.4a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.4V10a1.6 1.6 0 0 1 1.6-1.6z"
          />
          <Circle {...p} cx="12" cy="13.6" r="3.1" />
        </>
      );
    case 'logout':
      return (
        <>
          <Path {...p} d="M9.6 20.4H6a2 2 0 0 1-2-2V5.6a2 2 0 0 1 2-2h3.6" />
          <Polyline {...p} points="15.2 16.4 19.6 12 15.2 7.6" />
          <Line {...p} x1="19.6" y1="12" x2="9.2" y2="12" />
        </>
      );
    case 'alert':
      return (
        <>
          <Path
            {...p}
            d="M12 3.6 2.2 20.4h19.6z"
          />
          <Line {...p} x1="12" y1="10.4" x2="12" y2="14.4" />
          <Line {...p} x1="12" y1="17.2" x2="12.01" y2="17.2" />
        </>
      );
    default:
      return null;
  }
}

const STAR_POSITIONS: Array<[number, number]> = [
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

/** EU ring of stars, used on the number-plate band. */
export function EuStars({size}: {size: number}) {
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
