/**
 * What an admin sees after signing in here with admin credentials.
 *
 * An admin is not a supplier. This screen is a board, not a worklist:
 * orders as a plain list, no plates or prices, and nothing to tap into.
 * An admin is scanning for problems, not reading orders one at a time.
 *
 * Two tabs, because an admin reads this screen with one of two questions
 * in mind. "All" is today — what came in, what is late, what is done.
 * "WhatsApp" is the book of orders the customer asked to receive over
 * WhatsApp, at any age, because those are the ones an admin personally
 * has to send. Anything older outside that lives on the History screen.
 *
 * Two things break the read-only rule, because they are the admin's
 * actual job: sending WhatsApp orders on to the customer — having looked
 * at the invoice first — and knowing which supplier to phone when a
 * timer has expired.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import CustomHeader, { IconButton } from '../components/molecules/CustomHeader';
import { Body, Screen } from '../components/Screen';
import { AdminOrderRow } from '../components/AdminOrderRow';
import { ChipTabs } from '../components/ChipTabs';
import { InvoiceViewer } from '../components/InvoiceViewer';
import { Cta, Eyebrow, Hint, StatTile } from '../components/ui';
import { useToast } from '../components/molecules/Toast';
import { colors, font, radius, s, track } from '../theme/tokens';
import { awaitingWhatsappSend, isToday, isWhatsappOrder } from '../data/mock';
import { overdueMinutes } from '../components/Countdown';
import { useSupplier } from '../store/useSupplier';
import { ROUTES } from '../navigation/routes';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'whatsapp', label: 'WhatsApp' },
];

export default function AdminHomeScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const { session, orders, now, signOut, whatsappQueue, sendInvoice } =
    useSupplier();
  const [sendingId, setSendingId] = useState(null);
  const [tab, setTab] = useState('all');
  const [viewingId, setViewingId] = useState(null);

  const today = useMemo(
    () =>
      orders
        .filter(o => isToday(o.assignedAt, now))
        .sort((a, b) => +new Date(b.assignedAt) - +new Date(a.assignedAt)),
    // `now` ticks every second; only the calendar day matters, so the
    // list is stable in practice and re-sorting is cheap.
    [orders, now],
  );

  /*
   * Every WhatsApp order, not just today's and not just the ones ready
   * to go: an admin opening this tab is asking "what is on WhatsApp",
   * and an order still with its supplier is part of that answer. The
   * ones waiting on an admin come first, because those are the ones
   * with a button on.
   */
  const whatsapp = useMemo(
    () =>
      orders
        .filter(isWhatsappOrder)
        .sort(
          (a, b) =>
            awaitingWhatsappSend(b) - awaitingWhatsappSend(a) ||
            +new Date(b.assignedAt) - +new Date(a.assignedAt),
        ),
    [orders],
  );

  const visible = tab === 'whatsapp' ? whatsapp : today;
  const viewing = viewingId
    ? orders.find(o => o.id === viewingId) ?? null
    : null;

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

  const send = async id => {
    setSendingId(id);
    const sent = await sendInvoice(id);
    setSendingId(null);
    if (sent) {
      /*
       * The order has left the queue, so the viewer would be showing a
       * sent invoice under a live Send button. Close it.
       */
      setViewingId(current => (current === id ? null : current));
      toast({ message: 'Invoice shared with the customer', icon: 'whatsapp' });
    }
  };

  return (
    <Screen>
      <CustomHeader
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
                    {overdueMinutes(order.dueAt, now)} minutes overdue
                  </Text>
                  {' from '}
                  <Text style={styles.chaseStrong}>
                    {order.supplier?.name ?? 'Unassigned'}
                  </Text>
                </Text>
              ))}
            </View>
          </>
        ) : null}

        <Eyebrow>
          {tab === 'whatsapp' ? 'WhatsApp orders' : "Today's orders"}
        </Eyebrow>
        <ChipTabs
          tabs={TABS}
          value={tab}
          onChange={setTab}
          counts={{ all: today.length, whatsapp: whatsapp.length }}
        />

        {visible.length === 0 ? (
          <Hint center>
            {tab === 'whatsapp'
              ? 'No customer has asked for WhatsApp yet.'
              : 'No orders yet today.'}
          </Hint>
        ) : (
          visible.map(order => (
            <AdminOrderRow
              key={order.id}
              order={order}
              now={now}
              onView={() => setViewingId(order.id)}
              /*
               * Only the orders actually waiting on an admin get a
               * button. One the supplier has not invoiced yet has
               * nothing to send, and one already sent must not go twice.
               */
              onSend={
                awaitingWhatsappSend(order) ? () => send(order.id) : undefined
              }
              sending={sendingId === order.id}
            />
          ))
        )}

        <Cta
          variant="ghost"
          label="View all orders"
          icon="clipboard"
          iconPosition="leading"
          onPress={() => navigation.navigate(ROUTES.ADMIN_HISTORY)}
          style={{ marginTop: s(14) }}
        />
      </Body>

      <InvoiceViewer
        order={viewing}
        onClose={() => setViewingId(null)}
        onSend={
          viewing && awaitingWhatsappSend(viewing)
            ? () => send(viewing.id)
            : undefined
        }
        sending={!!viewing && sendingId === viewing.id}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  who: { marginBottom: s(16) },
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
  name: { fontFamily: font.display, fontSize: s(20), color: colors.ink },
  sub: {
    fontFamily: font.regular,
    fontSize: s(11.5),
    color: colors.ink3,
    marginTop: s(4),
  },
  tiles: { flexDirection: 'row', gap: s(10), marginBottom: s(18) },
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
  chaseStrong: { fontFamily: font.bold, color: colors.ink },
});
