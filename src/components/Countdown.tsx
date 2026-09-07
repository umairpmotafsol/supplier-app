/**
 * The 7-minute invoice timer. Reads the shared `now` tick from
 * SupplierState rather than running its own, so every order card on
 * screen updates in lockstep off one interval.
 *
 * The window starts when the order is assigned and stops only when the
 * invoice is uploaded. Past the deadline it keeps counting *up*, since
 * the order is still outstanding and the admin needs to see how far
 * behind it is.
 *
 * One order never shows a number: a Direct Debit sent back for bank
 * corrections. Counting down against the supplier while the customer
 * holds the order would be measuring the wrong person.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, font, s} from '../theme/tokens';
import {
  Order,
  RESPONSE_TIMEOUT_MS,
  bankWithCustomer,
  clockStartedAt,
} from '../data/mock';
import Icon from './Icon';

export function remainingMs(assignedAt: string, now: number) {
  const elapsed = now - new Date(assignedAt).getTime();
  // `now` ticks once a second, so an order assigned between two ticks is
  // briefly "in the future" and would read 07:01. Clamp at both ends.
  return Math.min(RESPONSE_TIMEOUT_MS, Math.max(0, RESPONSE_TIMEOUT_MS - elapsed));
}

export function formatCountdown(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return mm + ':' + ss;
}

/** How far past the deadline an overdue order is, in whole minutes. */
export function overdueMinutes(assignedAt: string, now: number) {
  const dueAt = new Date(assignedAt).getTime() + RESPONSE_TIMEOUT_MS;
  return Math.max(0, Math.round((now - dueAt) / 60000));
}

/** How long the upload took, in whole minutes. */
export function uploadMinutes(assignedAt: string, uploadedAt: string) {
  const ms = new Date(uploadedAt).getTime() - new Date(assignedAt).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

export function Countdown({order, now}: {order: Order; now: number}) {
  if (bankWithCustomer(order)) {
    return (
      <View style={styles.wrap}>
        <Icon name="user" size={s(13)} color={colors.ink3} strokeWidth={2.2} />
        <Text style={[styles.text, {color: colors.ink3}]}>
          Paused · with the customer
        </Text>
      </View>
    );
  }

  if (order.invoiceStatus === 'uploaded') {
    return (
      <View style={styles.wrap}>
        <Icon
          name="check"
          size={s(13)}
          color={colors.green}
          strokeWidth={2.2}
        />
        <Text style={[styles.text, {color: colors.green}]}>
          Timer stopped
          {order.invoiceUploadedAt
            ? ' · ' + uploadMinutes(order.assignedAt, order.invoiceUploadedAt) + 'm'
            : ''}
        </Text>
      </View>
    );
  }

  if (order.status === 'overdue') {
    return (
      <View style={styles.wrap}>
        <Icon name="alert" size={s(13)} color={colors.red} strokeWidth={2.2} />
        <Text style={[styles.text, {color: colors.red}]}>
          {overdueMinutes(clockStartedAt(order), now)} min overdue
        </Text>
      </View>
    );
  }

  const remaining = remainingMs(clockStartedAt(order), now);
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
        {formatCountdown(remaining)} to upload
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
