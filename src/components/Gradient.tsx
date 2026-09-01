/**
 * Gradient fills, drawn with react-native-svg so the app needs no extra
 * native gradient dependency. Each instance gets a unique gradient id.
 */
import React, {useRef} from 'react';
import {StyleSheet} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import type {StyleProp, ViewStyle} from 'react-native';

import {common} from '../theme/common';

let counter = 0;
const nextId = () => 'grad' + ++counter;

export type GradientStop = {color: string; offset: number; opacity?: number};

type LinearProps = {
  stops: GradientStop[];
  /** 'vertical' (default, 180deg) or 'horizontal' (90deg) */
  direction?: 'vertical' | 'horizontal';
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Gradient({
  stops,
  direction = 'vertical',
  radius = 0,
  style,
}: LinearProps) {
  const id = useRef(nextId()).current;
  const horizontal = direction === 'horizontal';
  return (
    <Svg
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, {borderRadius: radius}, style]}>
      <Defs>
        <LinearGradient
          id={id}
          x1="0"
          y1="0"
          x2={horizontal ? '1' : '0'}
          y2={horizontal ? '0' : '1'}>
          {stops.map((stop, i) => (
            <Stop
              key={i}
              offset={stop.offset}
              stopColor={stop.color}
              stopOpacity={stop.opacity ?? 1}
            />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={'url(#' + id + ')'} />
    </Svg>
  );
}

type GlowProps = {
  color: string;
  /** peak opacity at the centre of the glow */
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The soft orange bloom sitting behind the hero headlines
 * (`.hero::before` in the reference).
 */
export function HeroGlow({color, opacity = 0.2, style}: GlowProps) {
  const id = useRef(nextId()).current;
  return (
    <Svg pointerEvents="none" style={[common.absolute, style]}>
      <Defs>
        <RadialGradient id={id} cx="40%" cy="40%" rx="65%" ry="65%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="0.65" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={'url(#' + id + ')'} />
    </Svg>
  );
}
