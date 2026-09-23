/**
 * Keeps the order book warm without a live socket connection: fetches on
 * sign-in, then again every 15 seconds for as long as somebody is signed
 * in. That is what lets the New Order popup and the WhatsApp queue catch
 * up with the server — the 30-second cron sweep that actually flips a
 * late order to overdue runs there regardless (see orders.tasks.ts).
 *
 * Renders nothing: it is mounted once, at the root, next to ClockDriver.
 */
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchOrders } from './orders/ordersSlice';
import { selectSession } from './selectors';

export const POLL_MS = 15000;

export default function OrdersPoller() {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);

  useEffect(() => {
    if (!session) {
      return undefined;
    }
    dispatch(fetchOrders());
    const id = setInterval(() => dispatch(fetchOrders()), POLL_MS);
    return () => clearInterval(id);
  }, [dispatch, session]);

  return null;
}
