/**
 * The invoice upload timer. Reads the shared `now` tick from commonSlice
 * rather than running its own, so every order card on screen updates in
 * lockstep off one interval — and reads `order.dueAt` rather than
 * recomputing a deadline locally, because the server is what actually
 * enforces it (a 30-second cron sweep flips a late order to overdue; see
 * orders.tasks.ts) and is the one place that knows about a paused-then-
 * resumed window, such as a Direct Debit order returning from the
 * customer with its bank details corrected.
 *
 * Past the deadline it keeps counting *up*, since the order is still
 * outstanding and the admin needs to see how far behind it is.
 *
 * Two orders never show a number. A Direct Debit sent back for bank
 * corrections: counting down against the supplier while the customer
 * holds the order would be measuring the wrong person. And an order
 * nobody was assigned — only an admin ever sees one — where there is no
 * window running to count, and a 00:00 in red would read as a supplier
 * being late for something that was never given to them.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, s } from '../theme/tokens';
import { bankWithCustomer } from '../data/mock';
import Icon from './atoms/Icon';

/** Milliseconds left until `dueAt`, never negative. */
export function remainingMs(dueAt, now) {
  return Math.max(0, new Date(dueAt).getTime() - now);
}

export function formatCountdown(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return mm + ':' + ss;
}

/** How far past `dueAt` an overdue order is, in whole minutes. */
export function overdueMinutes(dueAt, now) {
  return Math.max(0, Math.round((now - new Date(dueAt).getTime()) / 60000));
}

/** How long the upload took, in whole minutes. */
export function uploadMinutes(assignedAt, uploadedAt) {
  const ms = new Date(uploadedAt).getTime() - new Date(assignedAt).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

export function Countdown({ order, now }) {
  if (order.status === 'unassigned') {
    return (
      <View style={styles.wrap}>
        <Icon name="alert" size={s(13)} color={colors.red} strokeWidth={2.2} />
        <Text style={[styles.text, { color: colors.red }]}>
          No supplier holds this order type
        </Text>
      </View>
    );
  }

  if (bankWithCustomer(order)) {
    return (
      <View style={styles.wrap}>
        <Icon name="user" size={s(13)} color={colors.ink3} strokeWidth={2.2} />
        <Text style={[styles.text, { color: colors.ink3 }]}>
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

        <Text style={[styles.text, { color: colors.green }]}>
          Timer stopped
          {order.invoiceUploadedAt && order.assignedAt
            ? ' · ' +
              uploadMinutes(order.assignedAt, order.invoiceUploadedAt) +
              'm'
            : ''}
        </Text>
      </View>
    );
  }

  if (order.status === 'overdue') {
    return (
      <View style={styles.wrap}>
        <Icon name="alert" size={s(13)} color={colors.red} strokeWidth={2.2} />
        <Text style={[styles.text, { color: colors.red }]}>
          {overdueMinutes(order.dueAt, now)} min overdue
        </Text>
      </View>
    );
  }

  const remaining = remainingMs(order.dueAt, now);
  const urgent = remaining < 60 * 1000;
  return (
    <View style={styles.wrap}>
      <Icon
        name="clock"
        size={s(13)}
        color={urgent ? colors.red : colors.orange}
        strokeWidth={2.2}
      />

      <Text style={[styles.text, urgent && { color: colors.red }]}>
        {formatCountdown(remaining)} to upload
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  text: {
    fontFamily: font.bold,
    fontSize: s(11),
    color: colors.orange,
  },
});
