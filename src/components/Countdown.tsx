/**
 * 7-minute supplier response countdown. Reads the shared `now` tick
 * from SupplierState rather than running its own timer, so every
 * order card on screen updates in lockstep off one interval.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, font, s} from '../theme/tokens';
import {RESPONSE_TIMEOUT_MS} from '../data/mock';
import Icon from './Icon';

export function remainingMs(assignedAt: string, now: number) {
  const elapsed = now - new Date(assignedAt).getTime();
  return Math.max(0, RESPONSE_TIMEOUT_MS - elapsed);
}

export function formatCountdown(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return mm + ':' + ss;
}

export function Countdown({
  assignedAt,
  now,
}: {
  assignedAt: string;
  now: number;
}) {
  const remaining = remainingMs(assignedAt, now);
  const urgent = remaining < 60 * 1000;
  return (
    <View style={styles.wrap}>
      <Icon
        name="clock"
        size={s(13)}
        color={urgent ? colors.red : colors.orange}
        strokeWidth={2.2}
      />
      <Text style={[styles.text, urgent && {color: colors.red}]}>
        {formatCountdown(remaining)} remaining
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flexDirection: 'row', alignItems: 'center', gap: s(6)},
  text: {
    fontFamily: font.bold,
    fontSize: s(11),
    color: colors.orange,
  },
});
