/**
 * Order summary row shown on the dashboard and the orders list.
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, font, radius, s, track} from '../theme/tokens';
import {common} from '../theme/common';
import {Order, gbp, statusInfo} from '../data/mock';
import Icon, {iconSize} from './Icon';
import {Badge, Plate} from './ui';
import {Countdown} from './Countdown';

export function OrderCard({
  order,
  now,
  onPress,
}: {
  order: Order;
  now: number;
  onPress: () => void;
}) {
  const info = statusInfo(order.status);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.card, pressed && {opacity: 0.85}]}>
      <View style={styles.top}>
        <Plate reg={order.reg} />
        <View style={common.fill}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.customer} numberOfLines={1}>
            {order.customerName}
          </Text>
        </View>
        <Badge label={info.label} tone={info.tone} />
      </View>

      <Text style={styles.meta} numberOfLines={1}>
        {order.plan} · {gbp(order.total)}
      </Text>

      <View style={styles.flags}>
        {order.whatsappRequested ? (
          <Flag icon="whatsapp" label="WhatsApp Requested" />
        ) : null}
        {order.v62Requested ? <Flag icon="doc" label="V62 Submitted" /> : null}
      </View>

      {order.status === 'awaiting_supplier' ? (
        <View style={styles.timerRow}>
          <Countdown assignedAt={order.assignedAt} now={now} />
        </View>
      ) : null}
    </Pressable>
  );
}

function Flag({icon, label}: {icon: 'whatsapp' | 'doc'; label: string}) {
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
  top: {flexDirection: 'row', alignItems: 'center', gap: s(10)},
  orderNumber: {
    fontFamily: font.display,
    fontSize: s(12.5),
    letterSpacing: track(-0.02, s(12.5)),
    color: colors.ink,
  },
  customer: {
    fontFamily: font.regular,
    fontSize: s(10.5),
    color: colors.ink3,
    marginTop: s(2),
  },
  meta: {
    fontFamily: font.medium,
    fontSize: s(10.5),
    color: colors.ink2,
    marginTop: s(10),
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
