/**
 * The supplier's landing page, and very nearly the whole app.
 *
 * It shows incoming orders and nothing else: no accept button, because
 * orders arrive already assigned. Every open order carries its own
 * Upload Invoice button, so the common case is one tap from here to the
 * camera. The counting lives on the Dashboard tab next door.
 */
import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import AppBar, {IconButton} from '../components/AppBar';
import {Body, Screen} from '../components/Screen';
import {OrderCard} from '../components/OrderCard';
import {Cta, Eyebrow, Hint} from '../components/ui';
import Icon from '../components/Icon';
import {colors, font, radius, s} from '../theme/tokens';
import {needsInvoice, supplierName} from '../data/mock';
import {useSupplier} from '../state/SupplierState';
import type {RootNav} from '../navigation/types';

export default function SupplierHomeScreen() {
  const navigation = useNavigation<RootNav>();
  const {session, visibleOrders, now, signOut, simulateNewOrder} =
    useSupplier();

  const {live, done} = useMemo(() => {
    const open = visibleOrders.filter(needsInvoice);
    return {
      // Overdue first: those are the ones the admin is already chasing.
      live: [...open].sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'overdue' ? -1 : 1;
        }
        return +new Date(a.assignedAt) - +new Date(b.assignedAt);
      }),
      done: visibleOrders.filter(order => !needsInvoice(order)),
    };
  }, [visibleOrders]);

  const openOrder = (id: string) =>
    navigation.navigate('OrderDetail', {orderId: id});
  const capture = (id: string) =>
    navigation.navigate('CaptureInvoice', {orderId: id});

  return (
    <Screen>
      <AppBar
        title="Orders"
        right={
          <IconButton icon="logout" ring small label="Sign out" onPress={signOut} />
        }
      />
      <Body>
        <View style={styles.who}>
          <Text style={styles.name}>
            {session?.supplierId ? supplierName(session.supplierId) : 'Supplier'}
          </Text>
          <Text style={styles.sub}>
            {live.length === 0
              ? 'Nothing waiting on you.'
              : live.length + (live.length === 1 ? ' order' : ' orders') + ' need an invoice'}
          </Text>
        </View>

        {live.length > 0 ? (
          <>
            <Eyebrow>Incoming orders</Eyebrow>
            {live.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                now={now}
                onPress={() => openOrder(order.id)}
                onUpload={() => capture(order.id)}
              />
            ))}
          </>
        ) : (
          <View style={styles.empty}>
            <Icon name="check" size={s(26)} color={colors.green} />
            <Text style={styles.emptyText}>All caught up</Text>
          </View>
        )}

        {done.length > 0 ? (
          <>
            <Eyebrow>Completed</Eyebrow>
            {done.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                now={now}
                onPress={() => openOrder(order.id)}
              />
            ))}
          </>
        ) : null}

        <Hint icon="info" style={{marginTop: s(6), marginBottom: s(12)}}>
          "Simulate new order" stands in for the backend routing a new
          customer order to an eligible supplier — there's no live link
          between apps in this frontend-only prototype.
        </Hint>
        <Cta
          variant="ghost"
          label="Simulate new order"
          onPress={() => simulateNewOrder()}
        />
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  who: {marginBottom: s(18)},
  name: {
    fontFamily: font.display,
    fontSize: s(20),
    color: colors.ink,
  },
  sub: {
    fontFamily: font.regular,
    fontSize: s(11.5),
    color: colors.ink3,
    marginTop: s(4),
  },
  empty: {
    alignItems: 'center',
    gap: s(8),
    paddingVertical: s(30),
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    marginBottom: s(18),
  },
  emptyText: {
    fontFamily: font.semibold,
    fontSize: s(12),
    color: colors.ink2,
  },
});
