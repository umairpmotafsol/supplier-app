/**
 * Every order assigned to this supplier.
 */
import React, {useMemo, useState} from 'react';
import {useNavigation} from '@react-navigation/native';

import AppBar, {IconButton} from '../components/AppBar';
import {Body, Screen} from '../components/Screen';
import {OrderCard} from '../components/OrderCard';
import {Hint} from '../components/ui';
import {useToast} from '../components/Toast';
import {useSupplier} from '../state/SupplierState';
import type {RootNav} from '../navigation/types';

const FILTERS = ['All', 'Needs response', 'In progress', 'Completed'] as const;

export default function OrdersScreen() {
  const navigation = useNavigation<RootNav>();
  const toast = useToast();
  const {orders, now} = useSupplier();
  const [filter, setFilter] = useState(0);

  const visible = useMemo(() => {
    if (filter === 1) {
      return orders.filter(
        o => o.status === 'awaiting_supplier' || o.status === 'overdue',
      );
    }
    if (filter === 2) {
      return orders.filter(
        o => o.status === 'processing' || o.status === 'invoice_uploaded',
      );
    }
    if (filter === 3) {
      return orders.filter(o => o.status === 'invoice_sent');
    }
    return orders;
  }, [orders, filter]);

  const cycleFilter = () => {
    const next = (filter + 1) % FILTERS.length;
    setFilter(next);
    toast({message: 'Showing: ' + FILTERS[next], icon: 'filter'});
  };

  return (
    <Screen>
      <AppBar
        title="Orders"
        right={
          <IconButton
            icon="filter"
            ring
            small
            label="Filter orders"
            onPress={cycleFilter}
          />
        }
      />
      <Body>
        {visible.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            now={now}
            onPress={() =>
              navigation.navigate('OrderDetail', {orderId: order.id})
            }
          />
        ))}
        <Hint center>
          {visible.length === 0
            ? 'No orders in this view yet.'
            : 'Tap an order to see the full details.'}
        </Hint>
      </Body>
    </Screen>
  );
}
