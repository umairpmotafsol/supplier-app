/**
 * Derived views of the order book.
 *
 * `visibleOrders` used to filter the shared book down to the signed-in
 * supplier's own orders; that scoping is now done server-side (see
 * ordersSlice's `fetchOrders` — a supplier's `GET /supplier/orders`
 * already comes back scoped to them, and an admin's `GET /admin/orders`
 * is everything), so what this slice fetched *is* the visible book and
 * `selectVisibleOrders` is just `selectOrders` by another name — kept
 * so screens do not have to care which one applies to them.
 */
import { createSelector } from '@reduxjs/toolkit';

import { awaitingWhatsappSend, bankAwaitingReview } from '../data/mock';

export const selectSession = state => state.auth.session;
export const selectIsAdmin = state => state.auth.session?.role === 'admin';
export const selectOrders = state => state.orders.items;
export const selectVisibleOrders = selectOrders;
export const selectNow = state => state.common.now;
const selectNewOrderId = state => state.orders.newOrderId;
const selectReadyToSendId = state => state.orders.readyToSendId;

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
    return orders.find(o => o.id === newOrderId) ?? null;
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
