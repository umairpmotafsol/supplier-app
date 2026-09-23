/**
 * Shared vocabulary for the supplier app: labels, enums and the pure
 * helpers that read an order's own fields.
 *
 * There is no mock order book here any more — the order book comes from
 * tax-my-motor-backend (`GET /supplier/orders`, `GET /admin/orders`; see
 * `store/orders/ordersSlice.js`) and the server derives `status` the same
 * way `statusInfo` below reads it, so nothing here recomputes it. What is
 * left is the vocabulary both sides agree on, and small readers over an
 * order's own fields that several screens need in common.
 */

/*
 * The shapes below were TypeScript types before the JavaScript
 * migration. They are kept as JSDoc typedefs so the model is still
 * written down in one place, and editors still offer completion on it.
 * They describe what `GET /supplier/orders` returns — see
 * orders.serializer.ts's `toSupplierOrder` on the backend for the exact
 * mapping.
 */

/**
 * Assigned and waiting on an invoice, overdue, waiting on an admin to
 * send it over WhatsApp, or done. There is no acceptance step, so there
 * is no `accepted` state.
 *
 * `unassigned` only ever reaches an admin: a supplier is never shown an
 * order that was not routed to them, because there isn't one.
 *
 * @typedef {'unassigned' | 'awaiting_invoice' | 'overdue' | 'awaiting_whatsapp' | 'completed'} OrderStatus
 */

/** @typedef {'pending' | 'uploaded'} InvoiceStatus */

/**
 * What kind of tax the customer bought. Drives supplier routing.
 *
 * @typedef {'tax6' | 'tax12' | 'dd'} OrderType
 */

/** @typedef {'whatsapp' | 'email'} CommunicationMethod */

/** @typedef {{name: string, qty: number}} OrderItem */

/**
 * @typedef {object} V62Data
 * @property {string} registrationNumber
 * @property {string} makeModel
 * @property {string} colour
 * @property {string} taxationClass
 */

/**
 * @typedef {{uri: string, capturedAt: string}} InvoicePhoto
 */

/* ------------------------------- bank details ------------------------------ */

/*
 * A Direct Debit order arrives with the customer's mandate details, and
 * a person at this end has to check them before the first collection.
 * When something is wrong the order goes back to the customer with the
 * bad fields named, and returns when they have fixed it — as many times
 * as it takes.
 */

/** @typedef {'accountHolder' | 'accountNumber' | 'sortCode' | 'dateOfBirth'} BankField */

/** @typedef {Record<BankField, string>} BankDetails */

/** @typedef {'submitted' | 'changes_requested' | 'approved'} BankReviewStatus */

/**
 * One turn in the back-and-forth.
 *
 * @typedef {object} BankReviewNote
 * @property {string} at
 * @property {'supplier' | 'customer'} by
 * @property {BankField[]} fields What was flagged. Empty on the customer's reply.
 * @property {string} message
 */

/**
 * @typedef {object} BankReview
 * @property {BankReviewStatus} status
 * @property {BankField[]} flagged Still outstanding. Empty once approved.
 * @property {BankReviewNote[]} notes Oldest first, so the thread reads top to bottom.
 */

/**
 * @typedef {object} Order
 * @property {string} id
 * @property {string} orderNumber
 * @property {string} reg
 * @property {string} vehicleModel
 * @property {OrderType} orderType
 * @property {string} orderTypeLabel
 * @property {OrderItem[]} items
 * @property {number} total
 * @property {string} orderDate
 * @property {OrderStatus} status
 * @property {InvoiceStatus} invoiceStatus
 * @property {InvoicePhoto} [invoicePhoto]
 * @property {string} [invoiceUrl] The admin view's name for the same photo.
 * @property {boolean} [invoiceShareable] Admin only. True when the photo has a
 *   hosted copy, so it can be sent to a customer rather than only viewed here.
 * @property {string} [invoiceUploadedAt] When the invoice landed — the timer stops here.
 * @property {string} [deliveredAt] When an admin sent it to the customer over
 *   WhatsApp. Only ever set on WhatsApp orders; an email order is delivered
 *   by the supplier's own system the moment the invoice is uploaded.
 * @property {CommunicationMethod} communicationMethod
 * @property {boolean} whatsappRequested
 * @property {boolean} v62Requested
 * @property {V62Data} [v62]
 * @property {BankDetails} [bank] Direct Debit orders only — the mandate details to be checked.
 * @property {BankReview} [bankReview] Direct Debit orders only — how far that check has got.
 * @property {string} [assignedAt] When the order was assigned.
 * @property {string} [turnStartedAt] When the supplier's current window started,
 *   if it has ever been paused and resumed (a Direct Debit order coming back
 *   from the customer). Unset otherwise, where it is simply the assignment.
 * @property {string} [dueAt] When this order goes overdue — the countdown reads from here.
 */

export const BANK_FIELDS = [
  'accountHolder',
  'accountNumber',
  'sortCode',
  'dateOfBirth',
];

export const BANK_FIELD_LABEL = {
  accountHolder: 'Account holder name',
  accountNumber: 'Account number',
  sortCode: 'Sort code',
  dateOfBirth: 'Date of birth',
};

export const ORDER_TYPE_LABEL = {
  tax6: '6 Months',
  tax12: '12 Months',
  dd: 'Direct Debit',
};

/*
 * gbp, formatTimeAgo and isToday are formatting, not mock data. They
 * live in `resources/utils/helper.js` and are re-exported here so every
 * existing import keeps working.
 */
export { gbp, formatTimeAgo, isToday } from '../resources/utils/helper';

/** @typedef {'done' | 'live' | 'overdue' | 'neutral'} BadgeTone */

const STATUS_LABEL = {
  unassigned: { label: 'Unassigned', tone: 'overdue' },
  awaiting_invoice: { label: 'New Order', tone: 'live' },
  overdue: { label: 'Overdue', tone: 'overdue' },
  awaiting_whatsapp: { label: 'Send via WhatsApp', tone: 'live' },
  completed: { label: 'Completed', tone: 'done' },
};

export function statusInfo(status) {
  return STATUS_LABEL[status] ?? { label: 'Unknown', tone: 'neutral' };
}

/**
 * An admin's order book, in this app's vocabulary.
 *
 * An admin reads `GET /admin/orders`, which speaks the order book's own
 * six-state language — `awaiting_supplier`, `invoice_ready` and the rest
 * — because that is what the web portal coordinates on. This app has
 * four states and no notion of a review step, so every screen here would
 * otherwise be reading words it has no label, filter or countdown for.
 *
 * The rules are the server's own (`toSupplierStatus` in
 * orders.serializer.ts), applied to the same fields: an invoice that has
 * gone out is done, an uploaded one is done unless the customer chose
 * WhatsApp and is waiting on an admin to send it, and anything still
 * pending is either overdue or waiting. `unassigned` is the one state
 * that survives the translation, because nobody is working that order
 * and an admin is exactly who needs to know.
 */
export function toAppOrder(order) {
  return {
    ...order,
    status: appStatus(order),
    /* The app tracks upload, not the admin's send-and-review states. */
    invoiceStatus: order.invoiceStatus === 'pending' ? 'pending' : 'uploaded',
  };
}

function appStatus(order) {
  if (order.status === 'unassigned') {
    return 'unassigned';
  }
  if (order.invoiceStatus === 'sent' || order.deliveredAt) {
    return 'completed';
  }
  if (order.invoiceStatus === 'uploaded' || order.invoiceStatus === 'ready') {
    return order.communicationMethod === 'whatsapp'
      ? 'awaiting_whatsapp'
      : 'completed';
  }
  return order.status === 'overdue' ? 'overdue' : 'awaiting_invoice';
}

/** Still needs an invoice — the main work a supplier has to do. */
export function needsInvoice(order) {
  return order.invoiceStatus === 'pending';
}

/* --------------------------- the bank review loop -------------------------- */

/** A Direct Debit order that came with mandate details to check. */
export function hasBankReview(order) {
  return order.orderType === 'dd' && !!order.bank && !!order.bankReview;
}

/** Sitting with the supplier, waiting to be approved or flagged. */
export function bankAwaitingReview(order) {
  return hasBankReview(order) && order.bankReview?.status === 'submitted';
}

/** Back with the customer. Nothing the supplier does moves it. */
export function bankWithCustomer(order) {
  return (
    hasBankReview(order) && order.bankReview?.status === 'changes_requested'
  );
}

/**
 * Cleared to proceed — either signed off, or an order that never needed
 * a mandate in the first place.
 */
export function bankCleared(order) {
  return !hasBankReview(order) || order.bankReview?.status === 'approved';
}

/**
 * You cannot raise an invoice against a mandate you have not agreed to
 * yet, so a Direct Debit order's bank details have to be approved first.
 * Every other order type is unaffected. The server enforces the same
 * rule; this is what lets the button reflect it before the tap.
 */
export function canUploadInvoice(order) {
  return order.invoiceStatus === 'pending' && bankCleared(order);
}

/**
 * Uploaded, the customer chose WhatsApp, and nobody has sent it yet —
 * so it is sitting in an admin's court. Email orders never land here.
 */
export function awaitingWhatsappSend(order) {
  return (
    order.communicationMethod === 'whatsapp' &&
    order.invoiceStatus === 'uploaded' &&
    !order.deliveredAt
  );
}

/**
 * The customer asked for this one over WhatsApp.
 *
 * Wider than `awaitingWhatsappSend`, and deliberately: that one is the
 * admin's to-do list, this one is the whole WhatsApp book — still
 * waiting on the supplier, ready to send, and already sent. An admin
 * looking for "the WhatsApp orders" means all of them.
 */
export function isWhatsappOrder(order) {
  return order.communicationMethod === 'whatsapp';
}

/**
 * The invoice photo, as something that can be displayed and sent.
 *
 * Only ever an absolute URL. Invoices are stored on Cloudinary, and a
 * Cloudinary URL is the one form that works in both places it has to:
 * an `<Image>` here, which sends no Authorization header, and a WhatsApp
 * message, which the customer's phone opens as nobody at all.
 *
 * Null when the backend is running without Cloudinary configured. The
 * server falls back to its own `/api/invoices/:id/file` there, which is
 * a real route but an authenticated one — it renders as a broken image
 * and reaches a customer as a 401, so it is better treated as "no photo
 * to send" than offered and then failing.
 */
export function invoiceImageUrl(order) {
  const uri = order?.invoicePhoto?.uri ?? order?.invoiceUrl ?? null;
  return typeof uri === 'string' && /^https?:\/\//.test(uri) ? uri : null;
}
