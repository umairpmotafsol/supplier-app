/**
 * One line in the admin's list. Monitoring only: an admin needs to scan
 * many orders at a glance, not read one in depth, so this carries the
 * order number, the supplier who owns it, and where its timer stands —
 * and nothing else. It is not pressable, because there is no admin
 * detail screen to press through to.
 *
 * Two things break that rule, and both are the admin's actual job:
 * sending a WhatsApp order on to the customer, and looking at the
 * invoice photo first. The thumbnail is the affordance for the second —
 * it says an invoice exists, and opens it full size.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, s, track } from '../theme/tokens';
import {
  bankAwaitingReview,
  bankWithCustomer,
  invoiceImageUrl,
  statusInfo,
} from '../data/mock';
import { Badge, Cta } from './ui';
import { Countdown } from './Countdown';
import CustomImage from './atoms/CustomImage';
import Icon from './atoms/Icon';

export function AdminOrderRow({ order, now, onSend, onView, sending }) {
  const info = statusInfo(order.status);
  const photo = invoiceImageUrl(order);
  return (
    <View style={[styles.row, order.status === 'overdue' && styles.rowOverdue]}>
      <View style={styles.top}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Badge label={info.label} tone={info.tone} />
      </View>
      <Text style={styles.supplier} numberOfLines={1}>
        {order.supplier?.name ?? 'Unassigned'}
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

      {/*
       * The invoice, when there is one to see. A thumbnail rather than
       * a line of text: an admin checking an invoice is checking
       * whether the photo is readable, and only the photo answers that.
       */}
      {onView && photo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'View the invoice for order ' + order.orderNumber}
          onPress={onView}
          style={({ pressed }) => [styles.invoice, pressed && styles.pressed]}
        >
          <CustomImage uri={photo} style={styles.thumb} rounded />
          <Text style={styles.invoiceText}>View invoice</Text>
          <Icon name="eye" size={s(14)} color={colors.ink3} />
        </Pressable>
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
          style={{ marginTop: s(10) }}
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
  rowOverdue: { borderColor: colors.redLine },
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
  foot: { marginTop: s(9) },
  invoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(9),
    marginTop: s(9),
    padding: s(7),
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
  },
  pressed: { opacity: 0.6 },
  thumb: { width: s(34), height: s(34) },
  invoiceText: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: s(10.5),
    color: colors.ink2,
  },
});
