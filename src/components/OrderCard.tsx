/**
 * Order summary row. On the supplier's own list it carries the Upload
 * Invoice action inline, so the common case is one tap from the landing
 * page. In the admin's monitoring view it shows which supplier owns the
 * order instead, and carries no action.
 *
 * The order number gets a line of its own. Sharing one row with the
 * plate, the vehicle and the status badge left it squeezed into a
 * narrow column between two graphics, which is the last place you want
 * a code you have to read character by character.
 *
 * The customer is not named here. A supplier works to the order number
 * and the plate; who owns the car tells them nothing they act on.
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, font, radius, s, track} from '../theme/tokens';
import {common} from '../theme/common';
import {
  ORDER_TYPE_LABEL,
  Order,
  bankAwaitingReview,
  canUploadInvoice,
  gbp,
  statusInfo,
  supplierName,
} from '../data/mock';
import Icon, {iconSize} from './Icon';
import {Badge, Cta, Plate} from './ui';
import {Countdown} from './Countdown';

export function OrderCard({
  order,
  now,
  onPress,
  onUpload,
  showSupplier,
}: {
  order: Order;
  now: number;
  onPress: () => void;
  /** Omitted in the admin view — monitoring only, no actions. */
  onUpload?: () => void;
  showSupplier?: boolean;
}) {
  const info = statusInfo(order.status);
  /*
   * A Direct Debit order's bank details come first. Until they are
   * approved the invoice button would be a dead end, so the card offers
   * the check instead — one tap to the thing that is actually next.
   */
  const toCheck = bankAwaitingReview(order);
  const canUpload = canUploadInvoice(order);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.card,
        order.status === 'overdue' && styles.cardOverdue,
        pressed && {opacity: 0.85},
      ]}>
      <View style={styles.head}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Badge label={info.label} tone={info.tone} />
      </View>

      <View style={styles.top}>
        <Plate reg={order.reg} />
        <View style={common.fill}>
          <Text style={styles.vehicle} numberOfLines={1}>
            {order.vehicleModel}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {ORDER_TYPE_LABEL[order.orderType]} · {gbp(order.total)}
            {showSupplier ? ' · ' + supplierName(order.supplierId) : ''}
          </Text>
        </View>
      </View>

      {order.whatsappRequested || order.v62Requested || toCheck ? (
        <View style={styles.flags}>
          {toCheck ? <Flag icon="bank" label="Bank details to check" /> : null}
          {order.whatsappRequested ? (
            <Flag icon="whatsapp" label="WhatsApp Requested" />
          ) : null}
          {order.v62Requested ? <Flag icon="doc" label="V62 Submitted" /> : null}
        </View>
      ) : null}

      <View style={styles.timerRow}>
        <Countdown order={order} now={now} />
      </View>

      {onUpload && toCheck ? (
        <Cta
          label="Check bank details"
          icon="bank"
          iconPosition="leading"
          onPress={onPress}
          style={{marginTop: s(11)}}
        />
      ) : onUpload && canUpload ? (
        <Cta
          label="Upload Invoice"
          icon="camera"
          onPress={onUpload}
          style={{marginTop: s(11)}}
        />
      ) : null}
    </Pressable>
  );
}

function Flag({
  icon,
  label,
}: {
  icon: 'whatsapp' | 'doc' | 'bank';
  label: string;
}) {
  return (
    <View style={styles.flag}>
      <Icon name={icon} size={iconSize.sm} color={colors.orange} />
      <Text style={styles.flagText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: s(13),
    marginBottom: s(12),
  },
  cardOverdue: {borderColor: colors.redLine},
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(10),
    marginBottom: s(11),
  },
  top: {flexDirection: 'row', alignItems: 'center', gap: s(10)},
  /*
   * Loosened rather than tightened. Display type is tracked in a touch
   * everywhere else in the app, but ORD-1024 is a code, not a word, and
   * negative tracking is what made it read as one clump.
   */
  orderNumber: {
    fontFamily: font.display,
    fontSize: s(14),
    letterSpacing: track(0.06, s(14)),
    color: colors.ink,
  },
  vehicle: {
    fontFamily: font.semibold,
    fontSize: s(12),
    color: colors.ink,
  },
  meta: {
    fontFamily: font.medium,
    fontSize: s(10.5),
    color: colors.ink3,
    marginTop: s(3),
  },
  flags: {flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: s(8)},
  flag: {flexDirection: 'row', alignItems: 'center', gap: s(4)},
  flagText: {fontFamily: font.semibold, fontSize: s(9.5), color: colors.orange},
  timerRow: {
    marginTop: s(11),
    paddingTop: s(11),
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
});
