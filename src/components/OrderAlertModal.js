/**
 * The interrupting popup, used for both alerts the app raises:
 *
 *  - a supplier's New Order (already assigned, so nothing to accept)
 *  - an admin's Ready to send via WhatsApp
 *
 * Both stand in for a push notification, and both do the same thing:
 * name the order, show where its timer stands, and offer one action.
 *
 * Only the admin's alert names the customer, because the admin is about
 * to message them. The supplier's alert identifies the job by its order
 * number and plate instead.
 *
 * The backdrop and card come from `molecules/ModalSkeleton`. A tap on
 * the backdrop does nothing — the alert is answered with a button — but
 * Android's back button still means "Later", as it always did.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, s, track } from '../theme/tokens';
import { ORDER_TYPE_LABEL, gbp } from '../data/mock';
import { common } from '../theme/common';
import Icon from './atoms/Icon';
import { Countdown } from './Countdown';
import { Cta, Plate } from './ui';
import ModalSkeleton from './molecules/ModalSkeleton';

export function OrderAlertModal({
  order,
  now,
  eyebrow,
  icon = 'bell',
  actionLabel,
  actionIcon,
  onAction,
  onDismiss,
  dismissLabel = 'Later',
  showCustomer,
}) {
  return (
    <ModalSkeleton
      visible={!!order}
      onClose={onDismiss}
      closeOnBackdrop={false}
      accent={colors.orange}
    >
      {order ? (
        <>
          <View style={styles.header}>
            <View style={styles.pulse}>
              <Icon
                name={icon}
                size={s(16)}
                color={colors.orange}
                strokeWidth={2.2}
              />
            </View>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>

          <View style={styles.row}>
            <Plate reg={order.reg} />
            <View style={common.fill}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <Text style={styles.who} numberOfLines={1}>
                {showCustomer ? order.customerName : order.vehicleModel}
              </Text>
            </View>
          </View>

          <Text style={styles.meta}>
            {ORDER_TYPE_LABEL[order.orderType]} · {gbp(order.total)}
          </Text>

          <View style={styles.timer}>
            <Countdown order={order} now={now} />
          </View>

          <Cta
            label={actionLabel}
            icon={actionIcon}
            onPress={() => onAction(order)}
          />

          <Pressable
            accessibilityRole="button"
            onPress={onDismiss}
            style={styles.later}
          >
            <Text style={styles.laterText}>{dismissLabel}</Text>
          </Pressable>
        </>
      ) : null}
    </ModalSkeleton>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginBottom: s(14),
  },
  pulse: {
    width: s(28),
    height: s(28),
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orangeSoft,
  },
  eyebrow: {
    fontFamily: font.semibold,
    fontSize: s(9),
    letterSpacing: track(0.14, s(9)),
    color: colors.orange,
    flex: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
  orderNumber: {
    fontFamily: font.display,
    fontSize: s(15),
    letterSpacing: track(-0.02, s(15)),
    color: colors.ink,
  },
  who: {
    fontFamily: font.regular,
    fontSize: s(11),
    color: colors.ink3,
    marginTop: s(2),
  },
  meta: {
    fontFamily: font.medium,
    fontSize: s(11),
    color: colors.ink2,
    marginTop: s(10),
  },
  timer: {
    marginTop: s(12),
    marginBottom: s(14),
    paddingTop: s(12),
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  later: { alignItems: 'center', paddingVertical: s(11) },
  laterText: {
    fontFamily: font.semibold,
    fontSize: s(11.5),
    color: colors.ink3,
  },
});
