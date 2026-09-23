/**
 * The admin's invoice: which orders it belongs to, where its photo
 * lives, and what actually goes to the customer when Send is pressed.
 *
 * The thing under test is a join between two systems. The backend
 * stores invoice photos on Cloudinary and hands back a `secure_url`;
 * this app renders that URL in an `<Image>` and puts it in a WhatsApp
 * message. Both of those work only because the URL is absolute and
 * unauthenticated — an `<Image>` sends no Authorization header, and a
 * customer's phone opening a link is nobody at all. So the rule these
 * tests hold is narrow and load-bearing: a relative `/api/...` path is
 * not an invoice you can show or send, and must never be treated as one.
 */
import { Share } from 'react-native';

import {
  awaitingWhatsappSend,
  invoiceImageUrl,
  isWhatsappOrder,
} from '../src/data/mock';
import { invoiceMessage, shareInvoice } from '../src/lib/share';

const HOSTED =
  'https://res.cloudinary.com/j1oli7ws/image/upload/v1790088443/taxmymotor/invoices/ORD-1019-a3f9c2e81b4d7e60.jpg';

/** An admin-shaped order, after `toAppOrder` has normalised it. */
const order = over => ({
  id: 'o1',
  orderNumber: 'ORD-1019',
  reg: 'AB12 CDE',
  vehicleModel: 'Focus 1.0 EcoBoost',
  orderType: 'tax12',
  total: 280,
  status: 'awaiting_whatsapp',
  invoiceStatus: 'uploaded',
  communicationMethod: 'whatsapp',
  deliveredAt: null,
  invoiceUrl: HOSTED,
  ...over,
});

describe('isWhatsappOrder', () => {
  /*
   * Deliberately wider than `awaitingWhatsappSend`: the WhatsApp tab is
   * the whole channel, not the admin's to-do list. An order still with
   * its supplier belongs in the tab and has no Send button.
   */
  it.each([
    ['still with the supplier', { invoiceStatus: 'pending' }],
    ['ready for the admin to send', {}],
    ['already sent', { invoiceStatus: 'uploaded', deliveredAt: '2026-09-22T09:00:00.000Z' }],
  ])('includes a WhatsApp order %s', (_name, over) => {
    expect(isWhatsappOrder(order(over))).toBe(true);
  });

  it('excludes an email order', () => {
    expect(isWhatsappOrder(order({ communicationMethod: 'email' }))).toBe(false);
  });

  it('is wider than the send queue, not the same list', () => {
    const waiting = order({ invoiceStatus: 'pending' });
    expect(isWhatsappOrder(waiting)).toBe(true);
    expect(awaitingWhatsappSend(waiting)).toBe(false);
  });
});

describe('invoiceImageUrl', () => {
  it('returns the hosted photo', () => {
    expect(invoiceImageUrl(order())).toBe(HOSTED);
  });

  it('reads the supplier view, which names the same photo differently', () => {
    const supplierShaped = order({
      invoiceUrl: undefined,
      invoicePhoto: { uri: HOSTED, capturedAt: '2026-09-22T09:00:00.000Z' },
    });
    expect(invoiceImageUrl(supplierShaped)).toBe(HOSTED);
  });

  /*
   * The backend falls back to its own authenticated route when
   * Cloudinary is not configured. That route is real, but an `<Image>`
   * renders it as a broken tile and a customer gets a 401 — so it is
   * reported as no photo rather than offered and then failing.
   */
  it('rejects the relative API path, which needs a bearer token', () => {
    expect(invoiceImageUrl(order({ invoiceUrl: '/api/invoices/o1/file' }))).toBeNull();
  });

  it.each([
    ['no invoice at all', {}],
    ['an explicit null', { invoiceUrl: null }],
  ])('returns null for %s', (_name, over) => {
    expect(invoiceImageUrl({ ...order(), invoiceUrl: undefined, ...over })).toBeNull();
  });

  it('does not throw on a missing order', () => {
    expect(invoiceImageUrl(undefined)).toBeNull();
  });
});

describe('invoiceMessage', () => {
  it('carries the photo, so the customer receives the invoice itself', () => {
    expect(invoiceMessage(order())).toContain(HOSTED);
  });

  it('names the order and the vehicle', () => {
    const body = invoiceMessage(order());
    expect(body).toContain('ORD-1019');
    expect(body).toContain('AB12 CDE');
  });

  /*
   * Without a hosted copy the message must not claim an invoice is
   * attached — there is nothing to attach, and saying so is how a
   * customer ends up waiting for something that never arrives.
   */
  it('promises nothing it cannot deliver when there is no hosted copy', () => {
    const body = invoiceMessage(order({ invoiceUrl: '/api/invoices/o1/file' }));
    expect(body).toContain('will follow separately');
    expect(body).not.toContain('/api/invoices');
  });
});

describe('shareInvoice', () => {
  afterEach(() => jest.restoreAllMocks());

  it('hands the share sheet the photo URL as well as the message', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction });

    await expect(shareInvoice(order())).resolves.toBe(true);

    const [payload] = share.mock.calls[0];
    /* iOS attaches `url`; Android ignores it, which is why it is in both. */
    expect(payload.url).toBe(HOSTED);
    expect(payload.message).toContain(HOSTED);
  });

  it('omits url entirely when there is no hosted photo', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction });

    await shareInvoice(order({ invoiceUrl: null }));

    expect(share.mock.calls[0][0]).not.toHaveProperty('url');
  });

  /* A dismissed sheet must never mark the order as delivered. */
  it('resolves false when the admin backs out', async () => {
    jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.dismissedAction });
    await expect(shareInvoice(order())).resolves.toBe(false);
  });

  it('resolves false when the sheet fails to open', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('no activity'));
    await expect(shareInvoice(order())).resolves.toBe(false);
  });
});
