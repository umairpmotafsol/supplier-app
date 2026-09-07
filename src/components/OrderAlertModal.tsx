/**
 * The interrupting popup, used for both alerts the app raises:
 *
 *  - a supplier's New Order (already assigned, so nothing to accept)
 *  - an admin's Ready to send via WhatsApp
 *
 * Both stand in for a push notification, and both do the same thing:
 * name the order, show where its timer stands, and offer one action.
 */
import React from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, font, radius, s, track} from '../theme/tokens';
import {ORDER_TYPE_LABEL, Order, gbp} from '../data/mock';
import {common} from '../theme/common';
import Icon, {IconName} from './Icon';
import {Countdown} from './Countdown';
import {Cta, Plate} from './ui';

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
}: {
  order: Order | null;
  now: number;
  eyebrow: string;
  icon?: IconName;
  actionLabel: string;
  actionIcon?: IconName;
  onAction: (order: Order) => void;
  onDismiss: () => void;
  dismissLabel?: string;
}) {
  return (
    <Modal
      visible={!!order}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        {order ? (
          <View style={styles.sheet}>
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
                <Text style={styles.customer} numberOfLines={1}>
                  {order.customerName}
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
              style={styles.later}>
              <Text style={styles.laterText}>{dismissLabel}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.66)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: s(18),
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.orange,
    padding: s(16),
  },
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
  row: {flexDirection: 'row', alignItems: 'center', gap: s(10)},
  orderNumber: {
    fontFamily: font.display,
    fontSize: s(15),
    letterSpacing: track(-0.02, s(15)),
    color: colors.ink,
  },
  customer: {
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
  later: {alignItems: 'center', paddingVertical: s(11)},
  laterText: {
    fontFamily: font.semibold,
    fontSize: s(11.5),
    color: colors.ink3,
  },
});
