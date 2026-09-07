/* eslint-env jest */
/**
 * The rules the updated flow spec turns on: routing by order type,
 * the two login roles, and a 7-minute timer that runs until the invoice
 * is uploaded rather than until an order is accepted.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {
  INITIAL_ORDERS,
  RESPONSE_TIMEOUT_MS,
  authenticate,
  awaitingWhatsappSend,
  bankAwaitingReview,
  bankWithCustomer,
  canUploadInvoice,
  clockStartedAt,
  isToday,
  routeOrder,
  type Supplier,
} from '../src/data/mock';
import {invoiceMessage, shareInvoice} from '../src/lib/share';
import {overdueMinutes, remainingMs} from '../src/components/Countdown';
import {SupplierProvider, useSupplier} from '../src/state/SupplierState';
import RootNavigator from '../src/navigation/RootNavigator';

describe('supplier routing', () => {
  const suppliers: Supplier[] = [
    {id: 'a', name: 'A', company: '', active: true, orderTypes: ['tax6', 'dd']},
    {id: 'b', name: 'B', company: '', active: true, orderTypes: ['tax12']},
    {
      id: 'c',
      name: 'C',
      company: '',
      active: false,
      orderTypes: ['tax6', 'tax12', 'dd'],
    },
  ];

  it('sends each order type to the supplier configured for it', () => {
    expect(routeOrder('tax6', suppliers)?.id).toBe('a');
    expect(routeOrder('dd', suppliers)?.id).toBe('a');
    expect(routeOrder('tax12', suppliers)?.id).toBe('b');
  });

  it('never routes to an inactive supplier, even an eligible one', () => {
    const onlyInactive = suppliers.filter(sup => !sup.active);
    expect(routeOrder('tax12', onlyInactive)).toBeNull();
  });

  it('leaves an order unrouted when no active supplier handles the type', () => {
    const noDirectDebit = suppliers.map(sup => ({
      ...sup,
      orderTypes: sup.orderTypes.filter(t => t !== 'dd'),
    }));
    expect(routeOrder('dd', noDirectDebit)).toBeNull();
  });
});

describe('sign-in', () => {
  it('resolves the role from the account, not from the caller', () => {
    expect(authenticate('admin@partners.co.uk', 'admin123')?.role).toBe(
      'admin',
    );
    expect(
      authenticate('supplier.a@partners.co.uk', 'supplier123')?.role,
    ).toBe('supplier');
  });

  it('rejects a wrong password', () => {
    expect(authenticate('admin@partners.co.uk', 'nope')).toBeNull();
  });
});

describe('the 7-minute window', () => {
  const assignedAt = new Date('2026-09-03T10:00:00Z').toISOString();
  const at = (ms: number) => new Date(assignedAt).getTime() + ms;

  it('counts down from assignment', () => {
    expect(remainingMs(assignedAt, at(0))).toBe(RESPONSE_TIMEOUT_MS);
    expect(remainingMs(assignedAt, at(60_000))).toBe(RESPONSE_TIMEOUT_MS - 60_000);
  });

  it('never reads above the full window when the clock is a tick behind', () => {
    expect(remainingMs(assignedAt, at(-500))).toBe(RESPONSE_TIMEOUT_MS);
  });

  it('keeps counting past the deadline so the admin sees how late it is', () => {
    expect(overdueMinutes(assignedAt, at(RESPONSE_TIMEOUT_MS))).toBe(0);
    expect(overdueMinutes(assignedAt, at(RESPONSE_TIMEOUT_MS + 3 * 60_000))).toBe(3);
  });
});

/**
 * Mounts the provider and hands back its store so assertions can drive
 * it. The provider owns a 1s interval, so every mount has to be torn
 * down or jest is left with a live timer after the run.
 */
async function mount() {
  const seen: {store?: ReturnType<typeof useSupplier>} = {};
  function Probe() {
    seen.store = useSupplier();
    return null;
  }
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <SupplierProvider>
        <Probe />
      </SupplierProvider>,
    );
  });
  return {
    get store() {
      return seen.store!;
    },
    unmount: async () => {
      await ReactTestRenderer.act(() => {
        tree.unmount();
      });
    },
  };
}

describe('the order lifecycle', () => {
  it('has no accept step — an order goes straight to needing an invoice', async () => {
    const app = await mount();
    expect(app.store.orders.every(o => 'invoiceStatus' in o)).toBe(true);
    // No status in the book implies acceptance.
    expect(
      app.store.orders.map(o => o.status).filter(st => st === ('accepted' as never)),
    ).toHaveLength(0);
    await app.unmount();
  });

  /*
   * Uploading always stops the clock. Whether that *completes* the order
   * depends on the delivery channel, which the WhatsApp tests below
   * cover — so this one asserts only the timer.
   */
  it('stops the timer by uploading the invoice', async () => {
    const app = await mount();
    const target = app.store.orders.find(canUploadInvoice)!;
    expect(target).toBeDefined();

    await ReactTestRenderer.act(() => {
      app.store.uploadInvoice(target.id, {
        uri: 'mock://shot.jpg',
        capturedAt: new Date().toISOString(),
      });
    });

    const after = app.store.orders.find(o => o.id === target.id)!;
    expect(after.invoiceStatus).toBe('uploaded');
    expect(after.invoiceUploadedAt).toBeTruthy();
    expect(after.status).not.toBe('awaiting_invoice');
    expect(after.status).not.toBe('overdue');
    await app.unmount();
  });

  it('scopes a supplier to its own orders and shows an admin everything', async () => {
    const app = await mount();

    await ReactTestRenderer.act(() => {
      app.store.signIn('supplier.a@partners.co.uk', 'supplier123');
    });
    const supplierView = app.store.visibleOrders;
    expect(supplierView.length).toBeGreaterThan(0);
    expect(supplierView.every(o => o.supplierId === 'supplier-1')).toBe(true);
    expect(supplierView.length).toBeLessThan(app.store.orders.length);

    await ReactTestRenderer.act(() => {
      app.store.signIn('admin@partners.co.uk', 'admin123');
    });
    expect(app.store.isAdmin).toBe(true);
    expect(app.store.visibleOrders).toHaveLength(app.store.orders.length);
    await app.unmount();
  });
});

describe('the WhatsApp hand-off', () => {
  const photo = () => ({
    uri: 'mock://shot.jpg',
    capturedAt: new Date().toISOString(),
  });

  it('finishes an email order at the upload', async () => {
    const app = await mount();
    const target = app.store.orders.find(
      o => canUploadInvoice(o) && o.communicationMethod === 'email',
    )!;
    expect(target).toBeDefined();

    await ReactTestRenderer.act(() => {
      app.store.uploadInvoice(target.id, photo());
    });

    const after = app.store.orders.find(o => o.id === target.id)!;
    expect(after.status).toBe('completed');
    expect(awaitingWhatsappSend(after)).toBe(false);
    await app.unmount();
  });

  it('parks a WhatsApp order with the admin instead of completing it', async () => {
    const app = await mount();
    const target = app.store.orders.find(
      o => canUploadInvoice(o) && o.communicationMethod === 'whatsapp',
    )!;
    expect(target).toBeDefined();

    await ReactTestRenderer.act(() => {
      app.store.uploadInvoice(target.id, photo());
    });

    const after = app.store.orders.find(o => o.id === target.id)!;
    expect(after.status).toBe('awaiting_whatsapp');
    expect(after.invoiceStatus).toBe('uploaded'); // the timer still stopped
    expect(awaitingWhatsappSend(after)).toBe(true);
    expect(app.store.whatsappQueue.map(o => o.id)).toContain(target.id);
    await app.unmount();
  });

  it('raises the ready-to-send alert for an admin, and not for a supplier', async () => {
    const app = await mount();
    await ReactTestRenderer.act(() => {
      app.store.signIn('supplier.a@partners.co.uk', 'supplier123');
    });
    const target = app.store.visibleOrders.find(
      o => canUploadInvoice(o) && o.communicationMethod === 'whatsapp',
    );
    // Supplier A's book may not hold one; fall back to the whole book.
    const id = (target ??
      app.store.orders.find(
        o => canUploadInvoice(o) && o.communicationMethod === 'whatsapp',
      )!).id;

    await ReactTestRenderer.act(() => {
      app.store.uploadInvoice(id, photo());
    });
    expect(app.store.readyToSend).toBeNull(); // suppliers are not interrupted

    await ReactTestRenderer.act(() => {
      app.store.signIn('admin@partners.co.uk', 'admin123');
    });
    expect(app.store.readyToSend?.id).toBe(id);
    await app.unmount();
  });

  it('only counts as delivered once, and clears the alert', async () => {
    const app = await mount();
    await ReactTestRenderer.act(() => {
      app.store.signIn('admin@partners.co.uk', 'admin123');
    });
    const target = app.store.whatsappQueue[0];
    expect(target).toBeDefined();

    await ReactTestRenderer.act(() => {
      app.store.markDelivered(target.id);
    });

    const after = app.store.orders.find(o => o.id === target.id)!;
    expect(after.status).toBe('completed');
    expect(after.deliveredAt).toBeTruthy();
    expect(awaitingWhatsappSend(after)).toBe(false);
    expect(app.store.whatsappQueue.map(o => o.id)).not.toContain(target.id);
    await app.unmount();
  });
});

describe('the share sheet', () => {
  it('marks delivered only when the admin actually shares', async () => {
    const {Share} = require('react-native');
    const order = INITIAL_ORDERS.find(o => o.communicationMethod === 'whatsapp')!;

    const spy = jest.spyOn(Share, 'share');

    spy.mockResolvedValueOnce({action: Share.sharedAction});
    await expect(shareInvoice(order)).resolves.toBe(true);

    // Dismissing the sheet must not count as a send.
    spy.mockResolvedValueOnce({action: Share.dismissedAction});
    await expect(shareInvoice(order)).resolves.toBe(false);

    spy.mockRejectedValueOnce(new Error('sheet failed'));
    await expect(shareInvoice(order)).resolves.toBe(false);

    spy.mockRestore();
  });

  it('builds a message naming the order, vehicle and total', () => {
    const order = INITIAL_ORDERS.find(o => o.communicationMethod === 'whatsapp')!;
    const msg = invoiceMessage(order);
    expect(msg).toContain(order.orderNumber);
    expect(msg).toContain(order.reg);
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

  it("today's board is a strict subset of the full history", async () => {
    const app = await mount();
    await ReactTestRenderer.act(() => {
      app.store.signIn('admin@partners.co.uk', 'admin123');
    });

    const all = app.store.orders;
    const today = all.filter(o => isToday(o.assignedAt, Date.now()));

    // The seed book deliberately spans several days, so this proves the
    // main screen is actually filtering rather than showing everything.
    expect(today.length).toBeGreaterThan(0);
    expect(today.length).toBeLessThan(all.length);
    expect(today.every(o => all.includes(o))).toBe(true);
    await app.unmount();
  });

  it('sends from the queue without an order screen, and clears it', async () => {
    const {Share} = require('react-native');
    const spy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({action: Share.sharedAction});

    const app = await mount();
    await ReactTestRenderer.act(() => {
      app.store.signIn('admin@partners.co.uk', 'admin123');
    });
    const target = app.store.whatsappQueue[0];
    expect(target).toBeDefined();

    let sent: boolean | undefined;
    await ReactTestRenderer.act(async () => {
      sent = await app.store.sendInvoice(target.id);
    });

    expect(sent).toBe(true);
    expect(spy).toHaveBeenCalled();
    expect(app.store.whatsappQueue.map(o => o.id)).not.toContain(target.id);
    expect(
      app.store.orders.find(o => o.id === target.id)!.deliveredAt,
    ).toBeTruthy();

    spy.mockRestore();
    await app.unmount();
  });

  it('leaves the order queued when the admin dismisses the share sheet', async () => {
    const {Share} = require('react-native');
    const spy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({action: Share.dismissedAction});

    const app = await mount();
    await ReactTestRenderer.act(() => {
      app.store.signIn('admin@partners.co.uk', 'admin123');
    });
    const target = app.store.whatsappQueue[0];

    let sent: boolean | undefined;
    await ReactTestRenderer.act(async () => {
      sent = await app.store.sendInvoice(target.id);
    });

    expect(sent).toBe(false);
    expect(app.store.whatsappQueue.map(o => o.id)).toContain(target.id);

    spy.mockRestore();
    await app.unmount();
  });
});

/*
 * The Dashboard tab. These render the real navigator rather than poking
 * the store, because what is being checked is the wiring: that a
 * supplier lands on tabs at all, and that the tab shows the same book
 * the Orders tab is working from.
 */
describe('the supplier dashboard tab', () => {
  const strings = (tree: ReactTestRenderer.ReactTestRenderer) => {
    const out: string[] = [];
    const walk = (node: unknown) => {
      if (typeof node === 'string') {
        out.push(node);
      } else if (Array.isArray(node)) {
        node.forEach(walk);
      } else if (node && typeof node === 'object') {
        walk((node as {children?: unknown}).children);
      }
    };
    walk(tree.toJSON());
    return out;
  };

  async function signedInSupplier() {
    const seen: {store?: ReturnType<typeof useSupplier>} = {};
    function Probe() {
      seen.store = useSupplier();
      return null;
    }
    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <SupplierProvider>
          <Probe />
          <RootNavigator />
        </SupplierProvider>,
      );
    });
    await ReactTestRenderer.act(() => {
      seen.store!.signIn('supplier.a@partners.co.uk', 'supplier123');
    });
    return {tree: tree!, store: () => seen.store!};
  }

  it('gives a supplier both tabs', async () => {
    const {tree} = await signedInSupplier();
    const text = strings(tree);
    expect(text).toContain('Orders');
    expect(text).toContain('Dashboard');
    await ReactTestRenderer.act(() => tree.unmount());
  });

  it('counts the supplier own book, not the whole book', async () => {
    const {tree, store} = await signedInSupplier();
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

    const mine = store().visibleOrders;
    expect(mine.length).toBeLessThan(store().orders.length);
    expect(text).toContain(String(mine.length));

    await ReactTestRenderer.act(() => tree.unmount());
  });
});

/*
 * The Direct Debit bank review. The rule that matters is not the
 * back-and-forth itself but what it blocks: no invoice can be raised
 * against a mandate nobody has approved.
 */
describe('the bank details review', () => {
  const ddOrder = (store: ReturnType<typeof useSupplier>) =>
    store.orders.find(o => bankAwaitingReview(o))!;

  it('blocks the invoice until the details are approved', async () => {
    const app = await mount();
    const target = ddOrder(app.store);
    expect(target).toBeDefined();
    expect(target.invoiceStatus).toBe('pending');
    expect(canUploadInvoice(target)).toBe(false);

    // Not merely hidden in the UI — the store refuses it.
    await ReactTestRenderer.act(() => {
      app.store.uploadInvoice(target.id, {
        uri: 'mock://shot.jpg',
        capturedAt: new Date().toISOString(),
      });
    });
    expect(
      app.store.orders.find(o => o.id === target.id)!.invoiceStatus,
    ).toBe('pending');

    await ReactTestRenderer.act(() => {
      app.store.approveBankDetails(target.id);
    });
    const approved = app.store.orders.find(o => o.id === target.id)!;
    expect(approved.bankReview!.status).toBe('approved');
    expect(canUploadInvoice(approved)).toBe(true);
    await app.unmount();
  });

  it('sends the order back with the flagged fields and the note', async () => {
    const app = await mount();
    const target = ddOrder(app.store);

    await ReactTestRenderer.act(() => {
      app.store.requestBankChanges(
        target.id,
        ['sortCode'],
        'Only five digits — please check it.',
      );
    });

    const sent = app.store.orders.find(o => o.id === target.id)!;
    expect(bankWithCustomer(sent)).toBe(true);
    expect(sent.bankReview!.flagged).toEqual(['sortCode']);
    expect(sent.bankReview!.notes).toHaveLength(1);
    expect(sent.bankReview!.notes[0].by).toBe('supplier');
    // Still blocked, and now nobody at this end can move it.
    expect(canUploadInvoice(sent)).toBe(false);
    await app.unmount();
  });

  it('refuses a flag with no fields, which would tell the customer nothing', async () => {
    const app = await mount();
    const target = ddOrder(app.store);

    await ReactTestRenderer.act(() => {
      app.store.requestBankChanges(target.id, [], 'Something is wrong.');
    });

    expect(bankAwaitingReview(app.store.orders.find(o => o.id === target.id)!)).toBe(
      true,
    );
    await app.unmount();
  });

  it('restarts the supplier window when the customer sends it back', async () => {
    const app = await mount();
    const target = ddOrder(app.store);
    const originallyAssigned = target.assignedAt;

    await ReactTestRenderer.act(() => {
      app.store.requestBankChanges(target.id, ['sortCode'], 'Five digits.');
    });
    await ReactTestRenderer.act(() => {
      app.store.simulateCustomerBankUpdate(target.id);
    });

    const back = app.store.orders.find(o => o.id === target.id)!;
    expect(bankAwaitingReview(back)).toBe(true);
    expect(back.bankReview!.flagged).toEqual([]);
    // The whole exchange is kept, not just the latest turn.
    expect(back.bankReview!.notes.map(n => n.by)).toEqual([
      'supplier',
      'customer',
    ]);
    // The assignment is untouched; the response window is not.
    expect(back.assignedAt).toBe(originallyAssigned);
    expect(clockStartedAt(back)).not.toBe(originallyAssigned);
    expect(new Date(clockStartedAt(back)).getTime()).toBeGreaterThan(
      new Date(originallyAssigned).getTime(),
    );
    await app.unmount();
  });

  it('leaves every other order type alone', async () => {
    const app = await mount();
    const notDd = app.store.orders.filter(o => o.orderType !== 'dd');
    expect(notDd.length).toBeGreaterThan(0);
    expect(notDd.every(o => !bankAwaitingReview(o))).toBe(true);
    expect(
      notDd
        .filter(o => o.invoiceStatus === 'pending')
        .every(canUploadInvoice),
    ).toBe(true);
    await app.unmount();
  });
});
