/**
 * What an admin sees after signing in here with admin credentials.
 *
 * An admin is not a supplier. This screen is today's board: the orders
 * that came in today, as a plain list — no plates, prices or flags, and
 * nothing to tap into. An admin is scanning for problems, not reading
 * orders one at a time. Everything older lives on the History screen.
 *
 * Two things break the read-only rule, because they are the admin's
 * actual job: sending WhatsApp orders on to the customer, and knowing
 * which supplier to phone when a timer has expired.
 */
import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import AppBar, {IconButton} from '../components/AppBar';
import {Body, Screen} from '../components/Screen';
import {AdminOrderRow} from '../components/AdminOrderRow';
import {Cta, Eyebrow, Hint, StatTile} from '../components/ui';
import {useToast} from '../components/Toast';
import {colors, font, radius, s, track} from '../theme/tokens';
import {clockStartedAt, isToday, supplierName} from '../data/mock';
import {overdueMinutes} from '../components/Countdown';
import {useSupplier} from '../state/SupplierState';
import type {RootNav} from '../navigation/types';

export default function AdminHomeScreen() {
  const navigation = useNavigation<RootNav>();
  const toast = useToast();
  const {session, orders, now, signOut, whatsappQueue, sendInvoice} =
    useSupplier();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const today = useMemo(
    () =>
      orders
        .filter(o => isToday(o.assignedAt, now))
        .sort((a, b) => +new Date(b.assignedAt) - +new Date(a.assignedAt)),
    // `now` ticks every second; only the calendar day matters, so the
    // list is stable in practice and re-sorting is cheap.
    [orders, now],
  );

  const stats = useMemo(
    () => ({
      today: today.length,
      overdue: today.filter(o => o.status === 'overdue').length,
      toSend: whatsappQueue.length,
    }),
    [today, whatsappQueue],
  );

  const overdue = useMemo(
    () => orders.filter(o => o.status === 'overdue'),
    [orders],
  );

  const send = async (id: string) => {
    setSendingId(id);
    const sent = await sendInvoice(id);
    setSendingId(null);
    if (sent) {
      toast({message: 'Invoice shared with the customer', icon: 'whatsapp'});
    }
  };

  return (
    <Screen>
      <AppBar
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
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>ADMIN — MONITORING</Text>
          </View>
          <Text style={styles.name}>{session?.name}</Text>
          <Text style={styles.sub}>Today, across every supplier.</Text>
        </View>

        <View style={styles.tiles}>
          <StatTile label="Today" value={stats.today} />
          <StatTile label="Overdue" value={stats.overdue} tone="red" />
          <StatTile label="To send" value={stats.toSend} tone="green" />
        </View>

        {/*
         * The admin's own queue: the supplier is finished with these and
         * the customer chose WhatsApp, so they get sent from here — via
         * the phone's share sheet, with no detail screen in between.
         */}
        {whatsappQueue.length > 0 ? (
          <>
            <Eyebrow>Ready to send via WhatsApp</Eyebrow>
            {whatsappQueue.map(order => (
              <AdminOrderRow
                key={order.id}
                order={order}
                now={now}
                onSend={() => send(order.id)}
                sending={sendingId === order.id}
              />
            ))}
          </>
        ) : null}

        {/*
         * When a timer expires the admin phones the supplier, which
         * happens off-platform — so the name has to be right here.
         */}
        {overdue.length > 0 ? (
          <>
            <Eyebrow>Needs chasing</Eyebrow>
            <View style={styles.chase}>
              {overdue.map(order => (
                <Text key={order.id} style={styles.chaseLine}>
                  <Text style={styles.chaseStrong}>{order.orderNumber}</Text>
                  {' is '}
                  <Text style={styles.chaseStrong}>
                    {overdueMinutes(clockStartedAt(order), now)} minutes overdue
                  </Text>
                  {' from '}
                  <Text style={styles.chaseStrong}>
                    {supplierName(order.supplierId)}
                  </Text>
                </Text>
              ))}
            </View>
          </>
        ) : null}

        <Eyebrow>Today's orders</Eyebrow>
        {today.length === 0 ? (
          <Hint center>No orders yet today.</Hint>
        ) : (
          today.map(order => (
            <AdminOrderRow key={order.id} order={order} now={now} />
          ))
        )}

        <Cta
          variant="ghost"
          label="View all orders"
          icon="clipboard"
          iconPosition="leading"
          onPress={() => navigation.navigate('AdminHistory')}
          style={{marginTop: s(14)}}
        />
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  who: {marginBottom: s(16)},
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: s(8),
    paddingVertical: s(4),
    borderRadius: radius.pill,
    backgroundColor: colors.orangeSoft,
    borderWidth: 1,
    borderColor: colors.orangeLine,
    marginBottom: s(8),
  },
  roleText: {
    fontFamily: font.semibold,
    fontSize: s(8),
    letterSpacing: track(0.14, s(8)),
    color: colors.orange,
  },
  name: {fontFamily: font.display, fontSize: s(20), color: colors.ink},
  sub: {
    fontFamily: font.regular,
    fontSize: s(11.5),
    color: colors.ink3,
    marginTop: s(4),
  },
  tiles: {flexDirection: 'row', gap: s(10), marginBottom: s(18)},
  chase: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.redLine,
    backgroundColor: colors.redSoft,
    padding: s(12),
    gap: s(7),
    marginBottom: s(18),
  },
  chaseLine: {
    fontFamily: font.regular,
    fontSize: s(11),
    lineHeight: s(16),
    color: colors.ink2,
  },
  chaseStrong: {fontFamily: font.bold, color: colors.ink},
});
