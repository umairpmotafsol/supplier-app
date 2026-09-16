/**
 * The one timer in the app.
 *
 * Every countdown on screen reads `common.now`, and the order book flips
 * late orders to `overdue` off the same tick (ordersSlice listens for
 * `clockTicked`), so one dispatch a second does both and the whole
 * screen updates in step.
 *
 * Renders nothing: it is mounted once, at the root.
 */
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { clockTicked } from './common/commonSlice';

export const TICK_MS = 1000;

export default function ClockDriver() {
  const dispatch = useDispatch();

  useEffect(() => {
    const id = setInterval(() => dispatch(clockTicked(Date.now())), TICK_MS);
    return () => clearInterval(id);
  }, [dispatch]);

  return null;
}
