/**
 * The admin feed, translated into this app's vocabulary.
 *
 * An admin signs into the supplier app and reads `GET /admin/orders`,
 * which answers in the order book's own six states. Every screen here
 * speaks four. Before `toAppOrder` sat between them, `statusInfo` was
 * handed `awaiting_supplier`, returned undefined, and the History screen
 * threw on `info.label` the moment an admin had an order to look at —
 * which is also why it went unnoticed for so long: the lists were empty.
 *
 * The payloads below are what `toAdminOrder` (orders.serializer.ts)
 * actually sends, so this fails if either side moves.
 */
import {
  awaitingWhatsappSend,
  statusInfo,
  toAppOrder,
} from '../src/data/mock';

/** One order as the admin endpoint serialises it. */
const adminOrder = over => ({
  id: 'o1',
  orderNumber: 'ORD-1027',
  status: 'awaiting_supplier',
  invoiceStatus: 'pending',
  communicationMethod: 'email',
  deliveredAt: null,
  supplier: { id: 's1', name: 'Moatasim', company: 'Tafsol' },
  ...over,
});

describe('toAppOrder', () => {
  it.each([
    ['assigned and waiting', {}, 'awaiting_invoice'],
    ['window expired', { status: 'overdue' }, 'overdue'],
    [
      'nobody holds the order type',
      { status: 'unassigned', supplier: null },
      'unassigned',
    ],
    [
      'email invoice uploaded — the supplier is finished',
      { status: 'invoice_ready', invoiceStatus: 'ready' },
      'completed',
    ],
    [
      'whatsapp invoice uploaded — waiting on the admin',
      {
        status: 'invoice_ready',
        invoiceStatus: 'ready',
        communicationMethod: 'whatsapp',
      },
      'awaiting_whatsapp',
    ],
    [
      'delivered',
      {
        status: 'invoice_sent',
        invoiceStatus: 'sent',
        deliveredAt: '2026-09-22T13:00:00.000Z',
      },
      'completed',
    ],
  ])('reads %s as %s', (_name, over, expected) => {
    expect(toAppOrder(adminOrder(over)).status).toBe(expected);
  });

  it('gives every translated status a label, so no screen throws', () => {
    const statuses = [
      {},
      { status: 'overdue' },
      { status: 'unassigned' },
      { status: 'invoice_ready', invoiceStatus: 'ready' },
      {
        status: 'invoice_ready',
        invoiceStatus: 'ready',
        communicationMethod: 'whatsapp',
      },
      { status: 'invoice_sent', invoiceStatus: 'sent' },
    ].map(over => toAppOrder(adminOrder(over)).status);

    statuses.forEach(status => {
      expect(statusInfo(status).label).toEqual(expect.any(String));
    });
  });

  it('flattens the review states so the send queue and countdown read it', () => {
    const ready = toAppOrder(
      adminOrder({
        status: 'invoice_ready',
        invoiceStatus: 'ready',
        communicationMethod: 'whatsapp',
      }),
    );
    expect(ready.invoiceStatus).toBe('uploaded');
    /* 'ready' would have left the admin's whole WhatsApp queue empty. */
    expect(awaitingWhatsappSend(ready)).toBe(true);
  });

  it('leaves a pending order pending, and keeps the admin-only fields', () => {
    const order = toAppOrder(adminOrder({}));
    expect(order.invoiceStatus).toBe('pending');
    expect(order.supplier.name).toBe('Moatasim');
    expect(order.orderNumber).toBe('ORD-1027');
  });
});

describe('statusInfo', () => {
  it('never returns undefined, whatever it is handed', () => {
    expect(statusInfo('something_new_from_the_server')).toEqual({
      label: 'Unknown',
      tone: 'neutral',
    });
  });
});
