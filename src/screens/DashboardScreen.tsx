/**
 * Supplier dashboard: summary cards, and any order still waiting on a
 * response front and centre with its countdown.
 */
import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import AppBar from '../components/AppBar';
import {Body, Screen} from '../components/Screen';
import {Countdown} from '../components/Countdown';
import {Badge, Cta, H2, H3, Hint, Plate, StatTile} from '../components/ui';
import {colors, font, radius, s, track} from '../theme/tokens';
import {gbp} from '../data/mock';
import {useSupplier} from '../state/SupplierState';

export default function DashboardScreen() {
  const {orders, now, acceptOrder, simulateNewOrder} = useSupplier();

  const stats = useMemo(() => {
    const isToday = (iso: string) => {
      const d = new Date(iso);
      const t = new Date();
      return (
        d.getFullYear() === t.getFullYear() &&
        d.getMonth() === t.getMonth() &&
        d.getDate() === t.getDate()
      );
    };
    return {
      newOrders: orders.filter(o => isToday(o.assignedAt)).length,
      awaitingResponse: orders.filter(o => o.supplierResponse === 'pending')
        .length,
      accepted: orders.filter(o => o.supplierResponse === 'accepted').length,
      processing: orders.filter(o => o.status === 'processing').length,
      invoicePending: orders.filter(
        o => o.supplierResponse === 'accepted' && o.invoiceStatus === 'pending',
      ).length,
    };
  }, [orders]);

  const needsResponse = orders.filter(o => o.status === 'awaiting_supplier');

  return (
    <Screen>
      <AppBar />
      <Body>
        <H2>Dashboard</H2>

        {needsResponse.length > 0 ? (
          <View style={{marginBottom: s(18)}}>
            <H3>New orders</H3>
            {needsResponse.map(order => (
              <View key={order.id} style={styles.newOrder}>
                <View style={styles.newOrderTop}>
                  <Plate reg={order.reg} />
                  <View style={{flex: 1, minWidth: 0}}>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.customer}>{order.customerName}</Text>
                  </View>
                  <Badge label="New Order" tone="live" />
                </View>
                <Text style={styles.plan}>
                  {order.plan} · {gbp(order.total)}
                </Text>
                <View style={styles.timerRow}>
                  <Countdown assignedAt={order.assignedAt} now={now} />
                </View>
                <Cta label="Accept Order" onPress={() => acceptOrder(order.id)} />
              </View>
            ))}
          </View>
        ) : null}

        <H3>Overview</H3>
        <View style={styles.grid}>
          <StatTile label="New orders" value={stats.newOrders} />
          <StatTile
            label="Awaiting response"
            value={stats.awaitingResponse}
            tone="orange"
          />
          <StatTile label="Accepted" value={stats.accepted} tone="green" />
          <StatTile label="Processing" value={stats.processing} />
          <StatTile
            label="Invoice pending"
            value={stats.invoicePending}
            tone="orange"
          />
        </View>

        <Hint icon="info" style={{marginBottom: s(14)}}>
          "Simulate new order" stands in for the backend automatically
          assigning a new customer order to you — there's no live link
          between apps in this frontend-only prototype.
        </Hint>
        <Cta
          variant="ghost"
          label="Simulate new order"
          onPress={simulateNewOrder}
        />
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(10),
    marginBottom: s(16),
  },
  newOrder: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: radius.card,
    padding: s(14),
    marginBottom: s(12),
    gap: s(11),
  },
  newOrderTop: {flexDirection: 'row', alignItems: 'center', gap: s(10)},
  orderNumber: {
    fontFamily: font.display,
    fontSize: s(13),
    letterSpacing: track(-0.02, s(13)),
    color: colors.ink,
  },
  customer: {
    fontFamily: font.regular,
    fontSize: s(10.5),
    color: colors.ink3,
    marginTop: s(2),
  },
  plan: {fontFamily: font.medium, fontSize: s(10.5), color: colors.ink2},
  timerRow: {
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: s(10),
  },
});
