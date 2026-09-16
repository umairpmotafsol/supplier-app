/* eslint-env jest */
/**
 * What the Redux migration could quietly break: what reaches disk, the
 * shared clock that makes orders overdue, and sign-out clearing the
 * alerts the context store used to clear.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore } from 'redux-persist';

import { setupStore } from '../src/store/setupStore';
import { signIn, signOut } from '../src/store/auth/authSlice';
import { clockTicked } from '../src/store/common/commonSlice';
import {
  bankChangesRequested,
  invoiceUploaded,
  simulateNewOrder,
} from '../src/store/orders/ordersSlice';
import {
  selectNewOrder,
  selectReadyToSend,
  selectVisibleOrders,
} from '../src/store/selectors';
import { RESPONSE_TIMEOUT_MS, clockStartedAt } from '../src/data/mock';
import { getToken } from '../src/security/keychainService';

jest.useFakeTimers();

afterAll(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

/** Waits for redux-persist to finish rehydrating, then to write. */
async function persisted(store) {
  const persistor = persistStore(store);
  await new Promise(resolve => {
    const check = () => {
      if (persistor.getState().bootstrapped) {
        resolve();
        return true;
      }
      return false;
    };
    if (!check()) {
      const unsubscribe = persistor.subscribe(() => {
        if (check()) {
          unsubscribe();
        }
      });
    }
  });
  return persistor;
}

describe('persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('keeps the session across a restart, without the password', async () => {
    const first = setupStore();
    const persistor = await persisted(first);

    expect(
      first.dispatch(signIn('supplier.a@partners.co.uk', 'supplier123')),
    ).toBe(true);
    await persistor.flush();

    const raw = await AsyncStorage.getItem('persist:auth');
    expect(raw).toContain('supplier.a@partners.co.uk');
    expect(raw).not.toContain('supplier123');
    expect(raw).not.toContain('password');

    /* A second store is the app after a restart. */
    const second = setupStore();
    await persisted(second);
    expect(second.getState().auth.session).toEqual({
      email: 'supplier.a@partners.co.uk',
      name: 'Ian Brooks',
      role: 'supplier',
      supplierId: 'supplier-1',
    });
    expect(second.getState().auth.signingIn).toBe(false);
  });

  it('never writes the order book, the clock or the socket to disk', async () => {
    const store = setupStore();
    const persistor = await persisted(store);
    store.dispatch(signIn('supplier.a@partners.co.uk', 'supplier123'));
    store.dispatch(clockTicked(Date.now()));
    await persistor.flush();

    const keys = await AsyncStorage.getAllKeys();
    expect([...keys].sort()).toEqual(
      ['persist:auth', 'persist:biometric', 'persist:root'].sort(),
    );
    const root = await AsyncStorage.getItem('persist:root');
    expect(root).not.toContain('"orders"');
    expect(root).not.toContain('"common"');
    expect(root).not.toContain('"socket"');
  });
});

describe('sign-in', () => {
  it('stores a session token in the keychain and clears it on sign-out', async () => {
    const store = setupStore();
    store.dispatch(signIn('admin@partners.co.uk', 'admin123'));
    await Promise.resolve();
    expect(await getToken()).toBe('mock-session-admin@partners.co.uk');

    store.dispatch(signOut());
    await Promise.resolve();
    expect(await getToken()).toBeNull();
    expect(store.getState().auth.session).toBeNull();
  });

  it('records a failed attempt without signing anyone in', () => {
    const store = setupStore();
    expect(store.dispatch(signIn('admin@partners.co.uk', 'wrong'))).toBe(false);
    expect(store.getState().auth.session).toBeNull();
    expect(store.getState().auth.error).toBeTruthy();
  });
});

describe('the shared clock', () => {
  const pendingOrder = store =>
    store
      .getState()
      .orders.items.find(
        o =>
          o.invoiceStatus === 'pending' &&
          o.status === 'awaiting_invoice' &&
          o.orderType !== 'dd',
      );

  it('marks an order overdue once its window has passed', () => {
    const store = setupStore();
    const order = pendingOrder(store);
    const started = new Date(clockStartedAt(order)).getTime();

    store.dispatch(clockTicked(started + RESPONSE_TIMEOUT_MS - 1000));
    expect(
      store.getState().orders.items.find(o => o.id === order.id).status,
    ).toBe('awaiting_invoice');

    store.dispatch(clockTicked(started + RESPONSE_TIMEOUT_MS));
    expect(
      store.getState().orders.items.find(o => o.id === order.id).status,
    ).toBe('overdue');
    expect(store.getState().common.now).toBe(started + RESPONSE_TIMEOUT_MS);
  });

  it('does not count time against a supplier while the customer holds the order', () => {
    const store = setupStore();
    const dd = store
      .getState()
      .orders.items.find(o => o.bankReview?.status === 'submitted');
    store.dispatch(bankChangesRequested(dd.id, ['sortCode'], 'Five digits.'));

    store.dispatch(clockTicked(Date.now() + 24 * 60 * 60 * 1000));
    expect(
      store.getState().orders.items.find(o => o.id === dd.id).status,
    ).not.toBe('overdue');
  });
});

describe('alerts', () => {
  it('scopes the new-order alert to the supplier it was routed to', () => {
    const store = setupStore();
    store.dispatch(signIn('supplier.b@partners.co.uk', 'supplier123'));
    /* tax6 routes to Supplier A, so Supplier B must not be interrupted. */
    const order = store.dispatch(simulateNewOrder('tax6'));
    expect(order.supplierId).toBe('supplier-1');
    expect(selectNewOrder(store.getState())).toBeNull();
    expect(selectVisibleOrders(store.getState()).map(o => o.id)).not.toContain(
      order.id,
    );

    store.dispatch(signIn('supplier.a@partners.co.uk', 'supplier123'));
    expect(selectNewOrder(store.getState())?.id).toBe(order.id);
  });

  it('clears both alerts on sign-out', () => {
    const store = setupStore();
    store.dispatch(signIn('admin@partners.co.uk', 'admin123'));
    const whatsapp = store
      .getState()
      .orders.items.find(
        o =>
          o.communicationMethod === 'whatsapp' &&
          o.invoiceStatus === 'pending' &&
          !o.bankReview,
      );
    store.dispatch(
      invoiceUploaded(whatsapp.id, { uri: 'mock://x.jpg', capturedAt: '' }),
    );
    store.dispatch(simulateNewOrder('tax12'));
    expect(selectReadyToSend(store.getState())?.id).toBe(whatsapp.id);

    store.dispatch(signOut());
    expect(store.getState().orders.readyToSendId).toBeNull();
    expect(store.getState().orders.newOrderId).toBeNull();
  });
});
