/**
 * The supplier's dashboard tab — an overview, not a workspace.
 *
 * Four numbers and nothing else. Anything that can be acted on lives on
 * the Orders tab, so this screen deliberately has no list and no
 * buttons: it answers "how am I doing?" and then gets out of the way.
 *
 * Every figure counts this supplier's own orders. An admin never lands
 * here — they sign in to their own monitoring board, which already
 * carries the equivalent tiles across all suppliers.
 */
import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import AppBar, {IconButton} from '../components/AppBar';
import {Body, Screen} from '../components/Screen';
import {Eyebrow, Hint, StatTile} from '../components/ui';
import {colors, font, s} from '../theme/tokens';
import {isToday, needsInvoice, supplierName} from '../data/mock';
import {useSupplier} from '../state/SupplierState';

export default function SupplierDashboardScreen() {
  const {session, visibleOrders, now, signOut} = useSupplier();

  const stats = useMemo(
    () => ({
      total: visibleOrders.length,
      today: visibleOrders.filter(o => isToday(o.assignedAt, now)).length,
      pending: visibleOrders.filter(needsInvoice).length,
      overdue: visibleOrders.filter(o => o.status === 'overdue').length,
    }),
    // `now` ticks every second, but only the calendar day is read from
    // it, so this recomputes far more often than it changes.
    [visibleOrders, now],
  );

  return (
    <Screen>
      <AppBar
        title="Dashboard"
        right={
          <IconButton
            icon="logout"
            ring
            small
            label="Sign out"
            onPress={signOut}
          />
        }
      />
      <Body>
        <View style={styles.who}>
          <Text style={styles.name}>
            {session?.supplierId ? supplierName(session.supplierId) : 'Supplier'}
          </Text>
          <Text style={styles.sub}>Your orders at a glance.</Text>
        </View>

        <Eyebrow>Overview</Eyebrow>
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatTile label="Total orders" value={stats.total} />
            <StatTile label="Today" value={stats.today} />
          </View>
          <View style={styles.gridRow}>
            <StatTile
              label="Pending invoice"
              value={stats.pending}
              tone={stats.pending > 0 ? 'orange' : undefined}
            />
            <StatTile
              label="Overdue"
              value={stats.overdue}
              tone={stats.overdue > 0 ? 'red' : undefined}
            />
          </View>
        </View>

        <Hint icon="info">
          These count only the orders routed to you. Pending means the
          invoice has not been uploaded yet.
        </Hint>
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  who: {marginBottom: s(18)},
  name: {fontFamily: font.display, fontSize: s(20), color: colors.ink},
  sub: {
    fontFamily: font.regular,
    fontSize: s(11.5),
    color: colors.ink3,
    marginTop: s(4),
  },
  grid: {gap: s(10), marginBottom: s(16)},
  gridRow: {flexDirection: 'row', gap: s(10)},
});
