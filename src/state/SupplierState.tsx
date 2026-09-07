/**
 * Single in-memory store for the supplier app prototype: the session
 * (supplier or admin), the order book, the 7-minute upload timer, and
 * the invoice upload.
 *
 * There is deliberately no accept/send action. An order is assigned by
 * the routing rules and completed by uploading the invoice.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Account,
  BankField,
  INITIAL_ORDERS,
  InvoicePhoto,
  Order,
  OrderType,
  RESPONSE_TIMEOUT_MS,
  authenticate,
  awaitingWhatsappSend,
  bankAwaitingReview,
  bankWithCustomer,
  canUploadInvoice,
  clockStartedAt,
  nextOrderNumber,
  planFor,
  randomCustomerName,
  routeOrder,
  sampleBankDetails,
  statusAfterUpload,
  supplierName,
} from '../data/mock';
import {shareInvoice} from '../lib/share';

type Store = {
  /** Null until someone signs in. */
  session: Account | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;

  /** Every order in the book — admins see all of these. */
  orders: Order[];
  /** Scoped to the signed-in supplier; identical to `orders` for admins. */
  visibleOrders: Order[];

  /** Ticks every second so screens can render live countdowns. */
  now: number;

  /** The most recent unseen assignment, shown as the New Order popup. */
  newOrder: Order | null;
  dismissNewOrder: () => void;

  /**
   * A WhatsApp order an admin has not been shown yet — stands in for the
   * push notification the spec describes.
   */
  readyToSend: Order | null;
  dismissReadyToSend: () => void;
  /** Every WhatsApp order still waiting on an admin. */
  whatsappQueue: Order[];

  /* --------------------------- the bank review loop -------------------------- */

  /** Direct Debit orders sitting with this supplier to be checked. */
  bankQueue: Order[];
  /** Flags the named fields and sends the order back to the customer. */
  requestBankChanges: (
    id: string,
    fields: BankField[],
    message: string,
  ) => void;
  /** Signs the mandate details off, unblocking the invoice. */
  approveBankDetails: (id: string) => void;
  /**
   * Stands in for the customer correcting their details and sending the
   * order back. There is no live link between the two apps, so this is
   * the only way the loop can close inside the prototype.
   */
  simulateCustomerBankUpdate: (id: string) => void;

  uploadInvoice: (id: string, photo: InvoicePhoto) => void;
  /**
   * Opens the phone's share sheet for a WhatsApp order and records the
   * delivery if the admin actually shared. Resolves false when they
   * backed out. Lives here so the queue row and the popup take one path
   * rather than each re-implementing it.
   */
  sendInvoice: (id: string) => Promise<boolean>;
  /** Records that an admin shared the invoice from the share sheet. */
  markDelivered: (id: string) => void;
  simulateNewOrder: (orderType?: OrderType) => void;
};

const SupplierContext = createContext<Store | null>(null);

export function useSupplier() {
  const store = useContext(SupplierContext);
  if (!store) {
    throw new Error('useSupplier must be used inside <SupplierProvider>');
  }
  return store;
}

const ORDER_TYPES: OrderType[] = ['tax6', 'tax12', 'dd'];

export function SupplierProvider({children}: {children: React.ReactNode}) {
  const [session, setSession] = useState<Account | null>(null);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [now, setNow] = useState(Date.now());
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [readyToSendId, setReadyToSendId] = useState<string | null>(null);

  /*
   * A mirror of the order book that actions can read *outside* a state
   * updater. Deciding the WhatsApp fork inside `setOrders` would mean
   * reading a value the updater has not produced yet — and would make
   * that updater impure, so React could replay it and alert twice.
   */
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    /*
     * Frontend-only timer. In production the 7-minute window has to be
     * enforced server-side (a scheduled job, or a queue with a
     * visibility timeout): a setInterval here dies the moment the app is
     * backgrounded, and it is what raises the admin's push notification.
     */
    const id = setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      setOrders(current => {
        let changed = false;
        const next = current.map(order => {
          // The timer runs until the invoice is uploaded, not until an
          // acceptance — there is no acceptance.
          if (order.invoiceStatus !== 'pending' || order.status === 'overdue') {
            return order;
          }
          /*
           * A Direct Debit order waiting on the customer to fix their
           * bank details is not late: nobody at this end can move it.
           */
          if (bankWithCustomer(order)) {
            return order;
          }
          const elapsed = tick - new Date(clockStartedAt(order)).getTime();
          if (elapsed < RESPONSE_TIMEOUT_MS) {
            return order;
          }
          changed = true;
          return {...order, status: 'overdue' as const};
        });
        return changed ? next : current;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    const account = authenticate(email, password);
    if (!account) {
      return false;
    }
    setSession(account);
    return true;
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setNewOrderId(null);
    setReadyToSendId(null);
  }, []);

  const uploadInvoice = useCallback((id: string, photo: InvoicePhoto) => {
    const order = ordersRef.current.find(o => o.id === id);
    /*
     * Guarded here as well as in the UI. An invoice raised against a
     * mandate nobody has approved is the thing this whole loop exists
     * to prevent, so it should not depend on a button being hidden.
     */
    if (!order || !canUploadInvoice(order)) {
      return;
    }
    /*
     * Upload always stops the timer. What happens next depends on the
     * channel: an email order is finished, a WhatsApp one passes to an
     * admin to send from the share sheet.
     */
    const next = statusAfterUpload(order);
    const at = new Date().toISOString();
    setOrders(current =>
      current.map(o =>
        o.id === id
          ? {
              ...o,
              status: next,
              invoiceStatus: 'uploaded' as const,
              invoicePhoto: photo,
              invoiceUploadedAt: at,
            }
          : o,
      ),
    );
    if (next === 'awaiting_whatsapp') {
      setReadyToSendId(id);
    }
  }, []);

  /* --------------------------- the bank review loop -------------------------- */

  /**
   * Flag what is wrong and hand the order back. The flags and the note
   * both travel: "wrong" on its own gives the customer nothing to act
   * on. Every note is kept, so the third time round still reads in the
   * context of the first two.
   */
  const requestBankChanges = useCallback(
    (id: string, fields: BankField[], message: string) => {
      const order = ordersRef.current.find(o => o.id === id);
      if (!order || !bankAwaitingReview(order) || fields.length === 0) {
        return;
      }
      const at = new Date().toISOString();
      setOrders(current =>
        current.map(o =>
          o.id === id && o.bankReview
            ? {
                ...o,
                bankReview: {
                  status: 'changes_requested' as const,
                  flagged: fields,
                  notes: [
                    ...o.bankReview.notes,
                    {at, by: 'supplier' as const, fields, message},
                  ],
                },
              }
            : o,
        ),
      );
    },
    [],
  );

  const approveBankDetails = useCallback((id: string) => {
    const order = ordersRef.current.find(o => o.id === id);
    if (!order || !bankAwaitingReview(order)) {
      return;
    }
    const at = new Date().toISOString();
    setOrders(current =>
      current.map(o =>
        o.id === id && o.bankReview
          ? {
              ...o,
              bankReview: {
                status: 'approved' as const,
                flagged: [],
                notes: [
                  ...o.bankReview.notes,
                  {
                    at,
                    by: 'supplier' as const,
                    fields: [],
                    message: 'Approved — mandate set up.',
                  },
                ],
              },
            }
          : o,
      ),
    );
  }, []);

  /*
   * The customer's half, faked. In production the customer's app would
   * write the corrected details through a shared backend and this app
   * would be told; here the two order books are separate, so the loop
   * needs a hand to close. Correcting a field is what the customer
   * would do, so the flagged fields come back changed.
   */
  const simulateCustomerBankUpdate = useCallback((id: string) => {
    const order = ordersRef.current.find(o => o.id === id);
    if (!order || !bankWithCustomer(order) || !order.bank) {
      return;
    }
    const at = new Date().toISOString();
    const corrected = sampleBankDetails(order.bank.accountHolder);
    const flagged = order.bankReview?.flagged ?? [];
    const bank = {...order.bank};
    flagged.forEach(field => {
      bank[field] = corrected[field];
    });
    setOrders(current =>
      current.map(o =>
        o.id === id && o.bankReview
          ? {
              ...o,
              bank,
              /* Their turn is over, so the supplier's window starts again. */
              turnStartedAt: at,
              status:
                o.status === 'overdue' ? ('awaiting_invoice' as const) : o.status,
              bankReview: {
                status: 'submitted' as const,
                flagged: [],
                notes: [
                  ...o.bankReview.notes,
                  {
                    at,
                    by: 'customer' as const,
                    fields: [],
                    message: 'Details updated and sent back for review.',
                  },
                ],
              },
            }
          : o,
      ),
    );
  }, []);

  const markDelivered = useCallback((id: string) => {
    const order = ordersRef.current.find(o => o.id === id);
    if (!order || !awaitingWhatsappSend(order)) {
      return;
    }
    const at = new Date().toISOString();
    setOrders(current =>
      current.map(o =>
        o.id === id ? {...o, status: 'completed' as const, deliveredAt: at} : o,
      ),
    );
    setReadyToSendId(seen => (seen === id ? null : seen));
  }, []);

  const sendInvoice = useCallback(
    async (id: string) => {
      const order = ordersRef.current.find(o => o.id === id);
      if (!order || !awaitingWhatsappSend(order)) {
        return false;
      }
      const shared = await shareInvoice(order);
      if (shared) {
        markDelivered(id);
      }
      // Dismissed sheet: leave it queued rather than claiming a send.
      return shared;
    },
    [markDelivered],
  );

  const simulateNewOrder = useCallback((orderType?: OrderType) => {
    const type =
      orderType ?? ORDER_TYPES[Math.floor(Math.random() * ORDER_TYPES.length)];
    const supplier = routeOrder(type);
    if (!supplier) {
      // No active supplier handles this type. A backend would flag this
      // to the admin rather than silently dropping the order.
      return;
    }
    const plan = planFor(type);
    const customerName = randomCustomerName();
    const order: Order = {
      id: 'order-' + Date.now(),
      orderNumber: nextOrderNumber(),
      customerName,
      customerPhone: '07700 900' + Math.floor(100 + Math.random() * 900),
      reg: 'AB' + Math.floor(10 + Math.random() * 89) + ' XYZ',
      vehicleModel: 'Ford Focus 1.5 EcoBlue',
      orderType: type,
      plan: plan.plan,
      items: [{name: plan.item, qty: 1}],
      total: plan.total,
      orderDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      deliveryAddress: '10 Test Street, London, E1 6AN',
      supplierId: supplier.id,
      assignedAt: new Date().toISOString(),
      status: 'awaiting_invoice',
      invoiceStatus: 'pending',
      communicationMethod: 'email',
      whatsappRequested: false,
      v62Requested: false,
      /* Only Direct Debit needs a mandate, so only it carries one. */
      ...(type === 'dd'
        ? {
            bank: sampleBankDetails(customerName),
            bankReview: {
              status: 'submitted' as const,
              flagged: [],
              notes: [],
            },
          }
        : null),
    };
    setOrders(current => [order, ...current]);
    setNewOrderId(order.id);
  }, []);

  const dismissNewOrder = useCallback(() => setNewOrderId(null), []);
  const dismissReadyToSend = useCallback(() => setReadyToSendId(null), []);

  const visibleOrders = useMemo(() => {
    if (!session || session.role === 'admin') {
      return orders;
    }
    return orders.filter(order => order.supplierId === session.supplierId);
  }, [orders, session]);

  /*
   * Only pop the alert at the supplier it was routed to. An admin is
   * monitoring, not working the queue, so they are not interrupted.
   */
  const newOrder = useMemo(() => {
    if (!newOrderId || !session || session.role !== 'supplier') {
      return null;
    }
    const order = orders.find(o => o.id === newOrderId);
    return order && order.supplierId === session.supplierId ? order : null;
  }, [newOrderId, orders, session]);

  const whatsappQueue = useMemo(
    () => orders.filter(awaitingWhatsappSend),
    [orders],
  );

  /* Scoped like every other list a supplier sees. */
  const bankQueue = useMemo(
    () => visibleOrders.filter(bankAwaitingReview),
    [visibleOrders],
  );

  /*
   * Only an admin gets the ready-to-send alert. The supplier's work
   * finished at the upload, so interrupting them would be noise.
   */
  const readyToSend = useMemo(() => {
    if (!readyToSendId || session?.role !== 'admin') {
      return null;
    }
    const order = orders.find(o => o.id === readyToSendId);
    return order && awaitingWhatsappSend(order) ? order : null;
  }, [readyToSendId, orders, session]);

  const value = useMemo<Store>(
    () => ({
      session,
      isAdmin: session?.role === 'admin',
      signIn,
      signOut,
      orders,
      visibleOrders,
      now,
      newOrder,
      dismissNewOrder,
      readyToSend,
      dismissReadyToSend,
      whatsappQueue,
      bankQueue,
      requestBankChanges,
      approveBankDetails,
      simulateCustomerBankUpdate,
      uploadInvoice,
      sendInvoice,
      markDelivered,
      simulateNewOrder,
    }),
    [
      session,
      signIn,
      signOut,
      orders,
      visibleOrders,
      now,
      newOrder,
      dismissNewOrder,
      readyToSend,
      dismissReadyToSend,
      whatsappQueue,
      bankQueue,
      requestBankChanges,
      approveBankDetails,
      simulateCustomerBankUpdate,
      uploadInvoice,
      sendInvoice,
      markDelivered,
      simulateNewOrder,
    ],
  );

  return (
    <SupplierContext.Provider value={value}>
      {children}
    </SupplierContext.Provider>
  );
}

/** Re-exported so screens don't have to reach into the mock module. */
export {supplierName};
