/**
 * Derived views of the order book.
 *
 * These are the `useMemo`s the SupplierState context used to hold,
 * rewritten as memoised selectors so every screen reading the same view
 * shares one computation.
 */
import { createSelector } from '@reduxjs/toolkit';

import { awaitingWhatsappSend, bankAwaitingReview } from '../data/mock';

export const selectSession = state => state.auth.session;
export const selectIsAdmin = state => state.auth.session?.role === 'admin';
export const selectOrders = state => state.orders.items;
export const selectNow = state => state.common.now;
const selectNewOrderId = state => state.orders.newOrderId;
const selectReadyToSendId = state => state.orders.readyToSendId;

/** Scoped to the signed-in supplier; identical to `orders` for admins. */
export const selectVisibleOrders = createSelector(
  [selectOrders, selectSession],
  (orders, session) => {
    if (!session || session.role === 'admin') {
      return orders;
    }
    return orders.filter(order => order.supplierId === session.supplierId);
  },
);

/*
 * Only pop the alert at the supplier it was routed to. An admin is
 * monitoring, not working the queue, so they are not interrupted.
 */
export const selectNewOrder = createSelector(
  [selectNewOrderId, selectOrders, selectSession],
  (newOrderId, orders, session) => {
    if (!newOrderId || !session || session.role !== 'supplier') {
      return null;
    }
    const order = orders.find(o => o.id === newOrderId);
    return order && order.supplierId === session.supplierId ? order : null;
  },
);

/** Every WhatsApp order still waiting on an admin. */
export const selectWhatsappQueue = createSelector([selectOrders], orders =>
  orders.filter(awaitingWhatsappSend),
);

/** Direct Debit orders sitting with this supplier to be checked. */
export const selectBankQueue = createSelector([selectVisibleOrders], orders =>
  orders.filter(bankAwaitingReview),
);

/*
 * Only an admin gets the ready-to-send alert. The supplier's work
 * finished at the upload, so interrupting them would be noise.
 */
export const selectReadyToSend = createSelector(
  [selectReadyToSendId, selectOrders, selectSession],
  (readyToSendId, orders, session) => {
    if (!readyToSendId || session?.role !== 'admin') {
      return null;
    }
    const order = orders.find(o => o.id === readyToSendId);
    return order && awaitingWhatsappSend(order) ? order : null;
  },
);
