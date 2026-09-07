/**
 * The admin's full order history — everything, not just today.
 *
 * Same plain list as the main screen and the same rule: nothing to tap
 * into. Filters are here rather than on the home screen because this is
 * where you come to look something up, and home is meant to be a glance.
 */
import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import AppBar from '../components/AppBar';
import {Body, Screen} from '../components/Screen';
import {AdminOrderRow} from '../components/AdminOrderRow';
import {Eyebrow, Hint} from '../components/ui';
import {colors, font, radius, s} from '../theme/tokens';
import {Order, awaitingWhatsappSend} from '../data/mock';
import {useSupplier} from '../state/SupplierState';
import type {RootNav} from '../navigation/types';

const FILTERS: Array<{key: string; label: string; match: (o: Order) => boolean}> =
  [
    {key: 'all', label: 'All', match: () => true},
    {key: 'overdue', label: 'Overdue', match: o => o.status === 'overdue'},
    {
      key: 'awaiting',
      label: 'Awaiting invoice',
      match: o => o.status === 'awaiting_invoice',
    },
    {key: 'whatsapp', label: 'To send', match: awaitingWhatsappSend},
    {key: 'done', label: 'Completed', match: o => o.status === 'completed'},
  ];

export default function AdminHistoryScreen() {
  const navigation = useNavigation<RootNav>();
  const {orders, now} = useSupplier();
  const [filter, setFilter] = useState('all');

  const visible = useMemo(() => {
    const active = FILTERS.find(f => f.key === filter) ?? FILTERS[0];
    return orders
      .filter(active.match)
      .sort((a, b) => +new Date(b.assignedAt) - +new Date(a.assignedAt));
  }, [orders, filter]);

  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} title="History" />
      <Body>
        <Eyebrow>All orders</Eyebrow>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {FILTERS.map(f => {
            const on = f.key === filter;
            return (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                accessibilityState={{selected: on}}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {f.label}
                </Text>
                <Text style={[styles.chipCount, on && styles.chipTextOn]}>
                  {orders.filter(f.match).length}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {visible.length === 0 ? (
          <Hint center>Nothing in this view.</Hint>
        ) : (
          visible.map(order => (
            <AdminOrderRow key={order.id} order={order} now={now} />
          ))
        )}

        <View style={styles.tail} />
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {gap: s(7), paddingBottom: s(14), paddingRight: s(4)},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(11),
    paddingVertical: s(7),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipOn: {borderColor: colors.orange, backgroundColor: colors.orangeSoft},
  chipText: {fontFamily: font.semibold, fontSize: s(10.5), color: colors.ink2},
  chipTextOn: {color: colors.orange},
  chipCount: {fontFamily: font.bold, fontSize: s(10), color: colors.ink4},
  tail: {height: s(10)},
});
