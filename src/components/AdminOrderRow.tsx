/**
 * One line in the admin's list. Monitoring only: an admin needs to scan
 * many orders at a glance, not read one in depth, so this carries the
 * order number, the supplier who owns it, and where its timer stands —
 * and nothing else. It is not pressable, because there is no admin
 * detail screen to press through to.
 *
 * The exception is a WhatsApp order waiting to be sent, which is the one
 * thing an admin actually does. That gets a Send button in place.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, font, radius, s, track} from '../theme/tokens';
import {
  Order,
  bankAwaitingReview,
  bankWithCustomer,
  statusInfo,
  supplierName,
} from '../data/mock';
import {Badge, Cta} from './ui';
import {Countdown} from './Countdown';

export function AdminOrderRow({
  order,
  now,
  onSend,
  sending,
}: {
  order: Order;
  now: number;
  /** Passed only for orders waiting on a WhatsApp send. */
  onSend?: () => void;
  sending?: boolean;
}) {
  const info = statusInfo(order.status);
  return (
    <View
      style={[styles.row, order.status === 'overdue' && styles.rowOverdue]}>
      <View style={styles.top}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Badge label={info.label} tone={info.tone} />
      </View>
      <Text style={styles.supplier} numberOfLines={1}>
        {supplierName(order.supplierId)}
      </Text>

      {/*
       * Why an order is sitting still matters more to an admin than the
       * clock does: one of these is the supplier's to answer for and the
       * other is not.
       */}
      {bankAwaitingReview(order) || bankWithCustomer(order) ? (
        <Text style={styles.bank}>
          {bankAwaitingReview(order)
            ? 'Bank details awaiting check'
            : 'Bank details with the customer'}
        </Text>
      ) : null}

      <View style={styles.foot}>
        <Countdown order={order} now={now} />
      </View>

      {onSend ? (
        <Cta
          label={sending ? 'Opening share sheet…' : 'Send via WhatsApp'}
          icon="whatsapp"
          disabled={sending}
          onPress={onSend}
          style={{marginTop: s(10)}}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    paddingHorizontal: s(13),
    paddingVertical: s(11),
    marginBottom: s(8),
  },
  rowOverdue: {borderColor: colors.redLine},
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(10),
  },
  /* Same reasoning as the order card: a code, so give it room. */
  orderNumber: {
    fontFamily: font.display,
    fontSize: s(14),
    letterSpacing: track(0.06, s(14)),
    color: colors.ink,
  },
  supplier: {
    fontFamily: font.regular,
    fontSize: s(10.5),
    color: colors.ink3,
    marginTop: s(5),
  },
  bank: {
    fontFamily: font.semibold,
    fontSize: s(9.5),
    color: colors.orange,
    marginTop: s(6),
  },
  foot: {marginTop: s(9)},
});
