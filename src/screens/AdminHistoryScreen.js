/**
 * The admin's full order history — everything, not just today.
 *
 * Same plain list as the main screen and the same rule: nothing to tap
 * into. Filters are here rather than on the home screen because this is
 * where you come to look something up, and home is meant to be a glance.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import CustomHeader from '../components/molecules/CustomHeader';
import { Body, Screen } from '../components/Screen';
import { AdminOrderRow } from '../components/AdminOrderRow';
import { ChipTabs } from '../components/ChipTabs';
import { InvoiceViewer } from '../components/InvoiceViewer';
import { Eyebrow, Hint } from '../components/ui';
import { s } from '../theme/tokens';
import { awaitingWhatsappSend, isWhatsappOrder } from '../data/mock';
import { useSupplier } from '../store/useSupplier';

/*
 * "WhatsApp" is every order on that channel; "To send" is the subset
 * still waiting on an admin. Both are worth a filter — one answers
 * "what is on WhatsApp", the other "what do I have to do".
 */
const FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'whatsapp', label: 'WhatsApp', match: isWhatsappOrder },
  { key: 'tosend', label: 'To send', match: awaitingWhatsappSend },
  { key: 'overdue', label: 'Overdue', match: o => o.status === 'overdue' },
  {
    key: 'awaiting',
    label: 'Awaiting invoice',
    match: o => o.status === 'awaiting_invoice',
  },
  { key: 'done', label: 'Completed', match: o => o.status === 'completed' },
];

export default function AdminHistoryScreen() {
  const navigation = useNavigation();
  const { orders, now, sendInvoice } = useSupplier();
  const [filter, setFilter] = useState('all');
  const [viewingId, setViewingId] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  const visible = useMemo(() => {
    const active = FILTERS.find(f => f.key === filter) ?? FILTERS[0];
    return orders
      .filter(active.match)
      .sort((a, b) => +new Date(b.assignedAt) - +new Date(a.assignedAt));
  }, [orders, filter]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map(f => [f.key, orders.filter(f.match).length]),
      ),
    [orders],
  );

  const viewing = viewingId
    ? orders.find(o => o.id === viewingId) ?? null
    : null;

  const send = async id => {
    setSendingId(id);
    const sent = await sendInvoice(id);
    setSendingId(null);
    if (sent) {
      setViewingId(current => (current === id ? null : current));
    }
  };

  return (
    <Screen>
      <CustomHeader onBack={() => navigation.goBack()} title="History" />
      <Body>
        <Eyebrow>All orders</Eyebrow>

        <ChipTabs
          tabs={FILTERS}
          value={filter}
          onChange={setFilter}
          counts={counts}
        />

        {visible.length === 0 ? (
          <Hint center>Nothing in this view.</Hint>
        ) : (
          visible.map(order => (
            <AdminOrderRow
              key={order.id}
              order={order}
              now={now}
              onView={() => setViewingId(order.id)}
              onSend={
                awaitingWhatsappSend(order) ? () => send(order.id) : undefined
              }
              sending={sendingId === order.id}
            />
          ))
        )}

        <View style={styles.tail} />
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
  tail: { height: s(10) },
});
