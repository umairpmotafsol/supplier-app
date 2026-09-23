/* eslint-env jest */
/**
 * The Redux slices wired to the real API (tax-my-motor-backend): the
 * HTTP layer is mocked here, so these check what each thunk does with a
 * given response — not a live server — plus what does (and must not)
 * survive a restart.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore } from 'redux-persist';

jest.mock('../src/resources/axios/AxiosInterceptorFunction', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  setApiEventHandlers: jest.fn(),
}));

import { api } from '../src/resources/axios/AxiosInterceptorFunction';
import { API_URL } from '../src/resources/utils/apiUrl';
import { setupStore } from '../src/store/setupStore';
import { signIn, signOut } from '../src/store/auth/authSlice';
import {
  approveBankDetails,
  fetchOrders,
  requestBankChanges,
} from '../src/store/orders/ordersSlice';
import {
  selectNewOrder,
  selectReadyToSend,
  selectVisibleOrders,
} from '../src/store/selectors';
import { getToken } from '../src/security/keychainService';

const supplierUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'Ian Brooks',
  email: 'supplier.a@partners.co.uk',
  phone: '',
  role: 'supplier',
  supplierId: 'supplier-1',
  address: '',
  city: '',
  postcode: '',
  referralCode: null,
  freeOrders: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const adminUser = (overrides = {}) => ({
  id: 'user-9',
  name: 'Alex Morgan',
  email: 'admin@taxmymotor.co.uk',
  phone: '',
  role: 'admin',
  supplierId: null,
  address: '',
  city: '',
  postcode: '',
  referralCode: null,
  freeOrders: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const authResult = user => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: '15m',
  user,
});

const supplierOrder = (overrides = {}) => ({
  id: 'order-1025',
  orderNumber: 'ORD-1025',
  reg: 'LM68 RTV',
  vehicleModel: 'Kia Sportage 1.6 GDi',
  orderType: 'dd',
  orderTypeLabel: 'Direct Debit',
  plan: 'Direct Debit',
  items: [{ name: 'Vehicle tax (Direct Debit)', qty: 1 }],
  total: 220,
  status: 'awaiting_invoice',
  invoiceStatus: 'pending',
  communicationMethod: 'email',
  whatsappRequested: false,
  v62Requested: false,
  placedAt: '2026-09-01T09:00:00.000Z',
  orderDate: '2026-09-01T09:00:00.000Z',
  assignedAt: '2026-09-03T10:00:00.000Z',
  turnStartedAt: null,
  dueAt: '2026-09-03T10:07:00.000Z',
  invoiceUploadedAt: null,
  deliveredAt: null,
  invoicePhoto: null,
  bank: {
    accountHolder: 'S Lee',
    accountNumber: '61220945',
    sortCode: '30-96-12',
    dateOfBirth: '02/11/1988',
  },
  bankReview: { status: 'submitted', flagged: [], notes: [] },
  v62: null,
  ...overrides,
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

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('persistence', () => {
  it('keeps the session across a restart, without the password', async () => {
    const first = setupStore();
    const persistor = await persisted(first);

    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await first.dispatch(
      signIn({ email: 'supplier.a@partners.co.uk', password: 'supplier123' }),
    );
    expect(first.getState().auth.session?.email).toBe(
      'supplier.a@partners.co.uk',
    );
    await persistor.flush();

    const raw = await AsyncStorage.getItem('persist:auth');
    expect(raw).toContain('supplier.a@partners.co.uk');
    expect(raw).not.toContain('supplier123');
    expect(raw).not.toContain('password');

    /* A second store is the app after a restart. */
    const second = setupStore();
    await persisted(second);
    expect(second.getState().auth.session).toEqual({
      id: 'user-1',
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

    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await store.dispatch(
      signIn({ email: 'supplier.a@partners.co.uk', password: 'supplier123' }),
    );
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
  it('stores a session and both tokens in the keychain, and clears them on sign-out', async () => {
    const store = setupStore();

    api.post.mockResolvedValueOnce(authResult(adminUser()));
    await store.dispatch(
      signIn({ email: 'admin@taxmymotor.co.uk', password: 'admin123' }),
    );
    expect(await getToken()).toBe('access-token');
    expect(api.post).toHaveBeenCalledWith(
      API_URL.LOGIN,
      { email: 'admin@taxmymotor.co.uk', password: 'admin123' },
      { skipAuth: true, silent: true },
    );

    api.post.mockResolvedValueOnce(undefined); // POST /auth/logout
    await store.dispatch(signOut());
    expect(await getToken()).toBeNull();
    expect(store.getState().auth.session).toBeNull();
  });

  it('records a failed attempt without signing anyone in', async () => {
    const store = setupStore();
    const failure = new Error('That email address and password do not match.');
    failure.described = { message: failure.message };
    api.post.mockRejectedValueOnce(failure);

    await store.dispatch(
      signIn({ email: 'admin@taxmymotor.co.uk', password: 'wrong' }),
    );
    expect(store.getState().auth.session).toBeNull();
    expect(store.getState().auth.error).toBeTruthy();
  });
});

describe('the order book', () => {
  it("fetches a supplier's own book from /supplier/orders", async () => {
    const store = setupStore();
    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await store.dispatch(
      signIn({ email: 'supplier.a@partners.co.uk', password: 'supplier123' }),
    );

    api.get.mockResolvedValueOnce({
      items: [supplierOrder()],
      total: 1,
      page: 1,
      limit: 100,
      pages: 1,
    });
    await store.dispatch(fetchOrders());

    expect(api.get).toHaveBeenCalledWith(
      API_URL.SUPPLIER_ORDERS,
      expect.objectContaining({ params: { limit: 100 } }),
    );
    expect(selectVisibleOrders(store.getState())).toHaveLength(1);
  });

  it("fetches every order from /admin/orders for an admin", async () => {
    const store = setupStore();
    api.post.mockResolvedValueOnce(authResult(adminUser()));
    await store.dispatch(
      signIn({ email: 'admin@taxmymotor.co.uk', password: 'admin123' }),
    );

    api.get.mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 100, pages: 1 });
    await store.dispatch(fetchOrders());

    expect(api.get).toHaveBeenCalledWith(
      API_URL.ADMIN_ORDERS,
      expect.objectContaining({ params: { limit: 100 } }),
    );
  });

  it('does not pop the New Order alert for the book already on hand at sign-in', async () => {
    const store = setupStore();
    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await store.dispatch(
      signIn({ email: 'supplier.a@partners.co.uk', password: 'supplier123' }),
    );

    api.get.mockResolvedValueOnce({
      items: [supplierOrder()],
      total: 1,
      page: 1,
      limit: 100,
      pages: 1,
    });
    await store.dispatch(fetchOrders());
    expect(selectNewOrder(store.getState())).toBeNull();
  });

  it('pops the New Order alert only for an order that appears on a later poll', async () => {
    const store = setupStore();
    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await store.dispatch(
      signIn({ email: 'supplier.a@partners.co.uk', password: 'supplier123' }),
    );

    api.get.mockResolvedValueOnce({
      items: [supplierOrder()],
      total: 1,
      page: 1,
      limit: 100,
      pages: 1,
    });
    await store.dispatch(fetchOrders());
    expect(selectNewOrder(store.getState())).toBeNull();

    const fresh = supplierOrder({ id: 'order-1026', orderNumber: 'ORD-1026' });
    api.get.mockResolvedValueOnce({
      items: [fresh, supplierOrder()],
      total: 2,
      page: 1,
      limit: 100,
      pages: 1,
    });
    await store.dispatch(fetchOrders());
    expect(selectNewOrder(store.getState())?.id).toBe('order-1026');
  });

  it('raises the ready-to-send alert for an admin only once a WhatsApp order is actually ready', async () => {
    const store = setupStore();
    api.post.mockResolvedValueOnce(authResult(adminUser()));
    await store.dispatch(
      signIn({ email: 'admin@taxmymotor.co.uk', password: 'admin123' }),
    );

    const pending = supplierOrder({
      id: 'order-2001',
      communicationMethod: 'whatsapp',
      invoiceStatus: 'pending',
    });
    api.get.mockResolvedValueOnce({ items: [pending], total: 1, page: 1, limit: 100, pages: 1 });
    await store.dispatch(fetchOrders());
    expect(selectReadyToSend(store.getState())).toBeNull();

    const ready = { ...pending, invoiceStatus: 'uploaded', status: 'awaiting_whatsapp' };
    api.get.mockResolvedValueOnce({ items: [ready], total: 1, page: 1, limit: 100, pages: 1 });
    await store.dispatch(fetchOrders());
    expect(selectReadyToSend(store.getState())?.id).toBe('order-2001');
  });
});

describe('the bank details review', () => {
  it('approves a mandate against the server response', async () => {
    const store = setupStore();
    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await store.dispatch(
      signIn({ email: 'supplier.a@partners.co.uk', password: 'supplier123' }),
    );
    api.get.mockResolvedValueOnce({
      items: [supplierOrder()],
      total: 1,
      page: 1,
      limit: 100,
      pages: 1,
    });
    await store.dispatch(fetchOrders());

    const approved = supplierOrder({
      bankReview: { status: 'approved', flagged: [], notes: [] },
    });
    api.post.mockResolvedValueOnce(approved);
    await store.dispatch(approveBankDetails('order-1025'));

    expect(api.post).toHaveBeenCalledWith('/supplier/orders/order-1025/bank/approve');
    expect(selectVisibleOrders(store.getState())[0].bankReview.status).toBe('approved');
  });

  it('sends the order back with the flagged fields and the note', async () => {
    const store = setupStore();
    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await store.dispatch(
      signIn({ email: 'supplier.a@partners.co.uk', password: 'supplier123' }),
    );
    api.get.mockResolvedValueOnce({
      items: [supplierOrder()],
      total: 1,
      page: 1,
      limit: 100,
      pages: 1,
    });
    await store.dispatch(fetchOrders());

    const sentBack = supplierOrder({
      bankReview: {
        status: 'changes_requested',
        flagged: ['sortCode'],
        notes: [
          {
            at: '2026-09-03T10:05:00.000Z',
            by: 'supplier',
            fields: ['sortCode'],
            message: 'Only five digits — please check it.',
          },
        ],
      },
    });
    api.post.mockResolvedValueOnce(sentBack);

    await store.dispatch(
      requestBankChanges({
        id: 'order-1025',
        fields: ['sortCode'],
        message: 'Only five digits — please check it.',
      }),
    );

    expect(api.post).toHaveBeenCalledWith(
      '/supplier/orders/order-1025/bank/request-changes',
      { fields: ['sortCode'], message: 'Only five digits — please check it.' },
    );
    const order = selectVisibleOrders(store.getState())[0];
    expect(order.bankReview.status).toBe('changes_requested');
    expect(order.bankReview.flagged).toEqual(['sortCode']);
  });
});

describe('sign-out', () => {
  it('clears the order book and both alerts', async () => {
    const store = setupStore();
    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await store.dispatch(
      signIn({ email: 'supplier.a@partners.co.uk', password: 'supplier123' }),
    );
    api.get.mockResolvedValueOnce({
      items: [supplierOrder()],
      total: 1,
      page: 1,
      limit: 100,
      pages: 1,
    });
    await store.dispatch(fetchOrders());
    expect(store.getState().orders.items).toHaveLength(1);

    api.post.mockResolvedValueOnce(undefined); // POST /auth/logout
    await store.dispatch(signOut());

    expect(store.getState().orders.items).toEqual([]);
    expect(store.getState().orders.newOrderId).toBeNull();
    expect(store.getState().orders.readyToSendId).toBeNull();
  });
});
