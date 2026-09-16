/**
 * Mounts a fresh Redux store the way App.js does — the store, plus the
 * one clock — without the native providers a unit test has no use for.
 *
 * Stands in for the old `<SupplierProvider>` in tests. Each call to
 * `setupStore()` returns an independent store, so tests cannot leak
 * state into each other.
 */
import React from 'react';
import { Provider } from 'react-redux';

import ClockDriver from '../src/store/ClockDriver';
import { setupStore } from '../src/store/setupStore';

export function SupplierTestProvider({ store, children }) {
  return (
    <Provider store={store}>
      <ClockDriver />
      {children}
    </Provider>
  );
}

export { setupStore };
