/* eslint-env jest */
/**
 * The rules the updated flow still turns on: there is no accept step,
 * a 7-minute window that runs until the invoice is uploaded, and the
 * two-role sign-in. Routing and status derivation are now the server's
 * job (see orders.serializer.ts), so what is exercised here is the
 * arithmetic the countdown does with the `dueAt` the server hands back,
 * and what the store does with whatever a mocked response says.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useDispatch } from 'react-redux';

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
import { awaitingWhatsappSend, isToday } from '../src/data/mock';
import { invoiceMessage, shareInvoice } from '../src/lib/share';
import { overdueMinutes, remainingMs } from '../src/components/Countdown';
import { useSupplier } from '../src/store/useSupplier';
import { fetchOrders } from '../src/store/orders/ordersSlice';
import AppNavigation from '../src/navigation/appNavigation';
import {
  SupplierTestProvider,
  setupStore,
} from '../test-utils/SupplierTestProvider';

const page = items => ({ items, total: items.length, page: 1, limit: 100, pages: 1 });

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

/** Shaped like tax-my-motor-backend's toSupplierOrder. */
const supplierOrder = (overrides = {}) => ({
  id: 'order-1025',
  orderNumber: 'ORD-1025',
  reg: 'LM68 RTV',
  vehicleModel: 'Kia Sportage 1.6 GDi',
  orderType: 'tax6',
  orderTypeLabel: '6 Months',
  items: [{ name: 'Vehicle tax (6 months)', qty: 1 }],
  total: 135,
  status: 'awaiting_invoice',
  invoiceStatus: 'pending',
  communicationMethod: 'email',
  whatsappRequested: false,
  v62Requested: false,
  placedAt: '2026-09-03T09:55:00.000Z',
  orderDate: '2026-09-03T09:55:00.000Z',
  assignedAt: '2026-09-03T10:00:00.000Z',
  turnStartedAt: null,
  dueAt: '2026-09-03T10:07:00.000Z',
  invoiceUploadedAt: null,
  deliveredAt: null,
  invoicePhoto: null,
  bank: null,
  bankReview: null,
  v62: null,
  ...overrides,
});

/** Shaped like tax-my-motor-backend's toAdminOrder. */
const adminOrder = (overrides = {}) => ({
  ...supplierOrder(),
  customer: { id: 'cust-1', name: 'John Smith', email: 'john@example.com', phone: '' },
  supplier: { id: 'supplier-1', name: 'Ian Brooks', company: 'Northgate Motor Services' },
  deliveryAddress: '24 Maple Road, London, SW11 3AA',
  ...overrides,
});

describe('the 7-minute window', () => {
  const dueAt = '2026-09-03T10:07:00.000Z';
  const deadline = new Date(dueAt).getTime();

  it('counts down to the deadline', () => {
    expect(remainingMs(dueAt, deadline - 60_000)).toBe(60_000);
    expect(remainingMs(dueAt, deadline)).toBe(0);
  });

  it('never reads negative once the deadline has passed', () => {
    expect(remainingMs(dueAt, deadline + 5_000)).toBe(0);
  });

  it('keeps counting past the deadline so the admin sees how late it is', () => {
    expect(overdueMinutes(dueAt, deadline)).toBe(0);
    expect(overdueMinutes(dueAt, deadline + 3 * 60_000)).toBe(3);
  });
});

/**
 * Mounts the provider and hands back its store so assertions can drive
 * it. The provider owns a 1s interval, so every mount has to be torn
 * down or jest is left with a live timer after the run.
 */
async function mount() {
  const seen = {};
  function Probe() {
    seen.store = useSupplier();
    seen.dispatch = useDispatch();
    return null;
  }
  let tree;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <SupplierTestProvider store={setupStore()}>
        <Probe />
      </SupplierTestProvider>,
    );
  });
  return {
    get store() {
      return seen.store;
    },
    get dispatch() {
      return seen.dispatch;
    },
    unmount: async () => {
      await ReactTestRenderer.act(() => {
        tree.unmount();
      });
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('uploading the invoice', () => {
  it('has no accept step — signing in goes straight to a book of orders needing invoices', async () => {
    const app = await mount();
    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await ReactTestRenderer.act(() => app.store.signIn(
      'supplier.a@partners.co.uk',
      'supplier123',
    ));

    api.get.mockResolvedValueOnce(page([supplierOrder()]));
    await ReactTestRenderer.act(() => app.dispatch(fetchOrders()));

    expect(app.store.orders.every(o => 'invoiceStatus' in o)).toBe(true);
    expect(app.store.orders.map(o => o.status)).not.toContain('accepted');
    await app.unmount();
  });

  it('finishes an email order at the upload — the server says so, this just stores it', async () => {
    const app = await mount();
    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await ReactTestRenderer.act(() => app.store.signIn(
      'supplier.a@partners.co.uk',
      'supplier123',
    ));
    api.get.mockResolvedValueOnce(page([supplierOrder()]));
    await ReactTestRenderer.act(() => app.dispatch(fetchOrders()));

    const completed = supplierOrder({
      status: 'completed',
      invoiceStatus: 'uploaded',
      invoiceUploadedAt: '2026-09-03T10:02:00.000Z',
      invoicePhoto: { uri: '/api/invoices/order-1025/file', capturedAt: '2026-09-03T10:02:00.000Z' },
    });
    api.post.mockResolvedValueOnce(completed);

    await ReactTestRenderer.act(() =>
      app.store.uploadInvoice('order-1025', {
        uri: 'mock://invoice-ORD-1025.jpg',
        capturedAt: '2026-09-03T10:02:00.000Z',
      }),
    );

    expect(api.post).toHaveBeenCalledWith(
      '/invoices/order-1025',
      expect.any(FormData),
    );
    const after = app.store.orders.find(o => o.id === 'order-1025');
    expect(after.status).toBe('completed');
    expect(awaitingWhatsappSend(after)).toBe(false);
    await app.unmount();
  });

  it('parks a WhatsApp order with the admin instead of completing it', async () => {
    const app = await mount();
    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await ReactTestRenderer.act(() => app.store.signIn(
      'supplier.a@partners.co.uk',
      'supplier123',
    ));
    const target = supplierOrder({ communicationMethod: 'whatsapp', whatsappRequested: true });
    api.get.mockResolvedValueOnce(page([target]));
    await ReactTestRenderer.act(() => app.dispatch(fetchOrders()));

    const parked = { ...target, status: 'awaiting_whatsapp', invoiceStatus: 'uploaded' };
    api.post.mockResolvedValueOnce(parked);

    await ReactTestRenderer.act(() =>
      app.store.uploadInvoice(target.id, {
        uri: 'mock://shot.jpg',
        capturedAt: '2026-09-03T10:02:00.000Z',
      }),
    );

    const after = app.store.orders.find(o => o.id === target.id);
    expect(after.status).toBe('awaiting_whatsapp');
    expect(awaitingWhatsappSend(after)).toBe(true);
    expect(app.store.whatsappQueue.map(o => o.id)).toContain(target.id);
    await app.unmount();
  });
});

describe('the share sheet', () => {
  const whatsappOrder = supplierOrder({
    id: 'order-1019',
    orderNumber: 'ORD-1019',
    communicationMethod: 'whatsapp',
    total: 220,
  });

  it('marks delivered only when the admin actually shares', async () => {
    const { Share } = require('react-native');
    const spy = jest.spyOn(Share, 'share');

    spy.mockResolvedValueOnce({ action: Share.sharedAction });
    await expect(shareInvoice(whatsappOrder)).resolves.toBe(true);

    // Dismissing the sheet must not count as a send.
    spy.mockResolvedValueOnce({ action: Share.dismissedAction });
    await expect(shareInvoice(whatsappOrder)).resolves.toBe(false);

    spy.mockRejectedValueOnce(new Error('sheet failed'));
    await expect(shareInvoice(whatsappOrder)).resolves.toBe(false);

    spy.mockRestore();
  });

  it('builds a message naming the order, vehicle and total', () => {
    const msg = invoiceMessage(whatsappOrder);
    expect(msg).toContain(whatsappOrder.orderNumber);
    expect(msg).toContain(whatsappOrder.reg);
    expect(msg).toContain('£');
  });
});

describe("the admin's board", () => {
  it('counts an order as today only on the same calendar day', () => {
    const noon = new Date('2026-09-03T12:00:00').getTime();
    const sameDay = new Date('2026-09-03T00:05:00').toISOString();
    const lastNight = new Date('2026-09-02T23:55:00').toISOString();
    const tomorrow = new Date('2026-09-04T00:05:00').toISOString();

    expect(isToday(sameDay, noon)).toBe(true);
    expect(isToday(lastNight, noon)).toBe(false);
    expect(isToday(tomorrow, noon)).toBe(false);
  });

  it('sends from the queue without an order screen, and clears it', async () => {
    const { Share } = require('react-native');
    const spy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction });

    const app = await mount();
    api.post.mockResolvedValueOnce(authResult(adminUser()));
    await ReactTestRenderer.act(() => app.store.signIn(
      'admin@taxmymotor.co.uk',
      'admin123',
    ));

    const ready = adminOrder({
      id: 'order-2001',
      communicationMethod: 'whatsapp',
      status: 'awaiting_whatsapp',
      invoiceStatus: 'uploaded',
    });
    api.get.mockResolvedValueOnce(page([ready]));
    await ReactTestRenderer.act(() => app.dispatch(fetchOrders()));
    expect(app.store.whatsappQueue.map(o => o.id)).toContain('order-2001');

    const sentOrder = { ...ready, status: 'completed', deliveredAt: '2026-09-03T10:10:00.000Z' };
    api.post.mockResolvedValueOnce(sentOrder);

    let sent;
    await ReactTestRenderer.act(async () => {
      sent = await app.store.sendInvoice('order-2001');
    });

    expect(sent).toBe(true);
    expect(spy).toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledWith('/admin/orders/order-2001/send');
    expect(app.store.whatsappQueue.map(o => o.id)).not.toContain('order-2001');
    expect(app.store.orders.find(o => o.id === 'order-2001').deliveredAt).toBeTruthy();

    spy.mockRestore();
    await app.unmount();
  });

  it('leaves the order queued when the admin dismisses the share sheet', async () => {
    const { Share } = require('react-native');
    const spy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.dismissedAction });

    const app = await mount();
    api.post.mockResolvedValueOnce(authResult(adminUser()));
    await ReactTestRenderer.act(() => app.store.signIn(
      'admin@taxmymotor.co.uk',
      'admin123',
    ));

    const ready = adminOrder({
      id: 'order-2002',
      communicationMethod: 'whatsapp',
      status: 'awaiting_whatsapp',
      invoiceStatus: 'uploaded',
    });
    api.get.mockResolvedValueOnce(page([ready]));
    await ReactTestRenderer.act(() => app.dispatch(fetchOrders()));

    let sent;
    await ReactTestRenderer.act(async () => {
      sent = await app.store.sendInvoice('order-2002');
    });

    expect(sent).toBe(false);
    expect(api.post).not.toHaveBeenCalledWith('/admin/orders/order-2002/send');
    expect(app.store.whatsappQueue.map(o => o.id)).toContain('order-2002');

    spy.mockRestore();
    await app.unmount();
  });
});

/*
 * The Dashboard tab. This renders the real navigator rather than poking
 * the store, because what is being checked is the wiring: that a
 * supplier lands on tabs at all, and that the tab shows the same book
 * the Orders tab is working from.
 */
describe('the supplier dashboard tab', () => {
  const strings = tree => {
    const out = [];
    const walk = node => {
      if (typeof node === 'string') {
        out.push(node);
      } else if (Array.isArray(node)) {
        node.forEach(walk);
      } else if (node && typeof node === 'object') {
        walk(node.children);
      }
    };
    walk(tree.toJSON());
    return out;
  };

  async function signedInSupplier() {
    const seen = {};
    function Probe() {
      seen.store = useSupplier();
      seen.dispatch = useDispatch();
      return null;
    }
    let tree;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <SupplierTestProvider store={setupStore()}>
          <Probe />
          <AppNavigation />
        </SupplierTestProvider>,
      );
    });
    api.post.mockResolvedValueOnce(authResult(supplierUser()));
    await ReactTestRenderer.act(() => seen.store.signIn(
      'supplier.a@partners.co.uk',
      'supplier123',
    ));
    api.get.mockResolvedValueOnce(page([supplierOrder(), supplierOrder({ id: 'order-1026' })]));
    await ReactTestRenderer.act(() => seen.dispatch(fetchOrders()));
    return { tree, store: () => seen.store };
  }

  it('gives a supplier both tabs', async () => {
    const { tree } = await signedInSupplier();
    const text = strings(tree);
    expect(text).toContain('Orders');
    expect(text).toContain('Dashboard');
    await ReactTestRenderer.act(() => tree.unmount());
  });

  it("counts the supplier's own book", async () => {
    const { tree, store } = await signedInSupplier();
    // Proves the press below is what put the dashboard on screen.
    expect(strings(tree)).not.toContain('Total orders');

    const tab = tree.root.find(
      node =>
        node.props.accessibilityLabel === 'Dashboard' &&
        typeof node.props.onPress === 'function',
    );
    await ReactTestRenderer.act(() => {
      tab.props.onPress();
    });

    const text = strings(tree);
    expect(text).toContain('Total orders');
    expect(text).toContain('Pending invoice');
    expect(text).toContain(String(store().orders.length));

    await ReactTestRenderer.act(() => tree.unmount());
  });
});
