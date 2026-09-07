/**
 * Mock data for the supplier app. There is no backend.
 *
 * The model follows the updated flow: an order is *assigned* by the
 * routing rules, never accepted. The only thing a supplier does is
 * photograph the invoice and upload it, which stops the 7-minute timer.
 *
 * Upload finishes an email order outright. A WhatsApp order then waits
 * on an admin, who sends it from the phone's own share sheet.
 *
 * The admin portal and this app each keep their own local copy of the
 * order book — in production a shared backend would be the single
 * source of truth and both would read/write through it.
 */

/**
 * Assigned and waiting on an invoice, overdue, waiting on an admin to
 * send it over WhatsApp, or done. There is no acceptance step, so there
 * is no `accepted` state.
 */
export type OrderStatus =
  | 'awaiting_invoice'
  | 'overdue'
  | 'awaiting_whatsapp'
  | 'completed';

export type InvoiceStatus = 'pending' | 'uploaded';

/** What kind of tax the customer bought. Drives supplier routing. */
export type OrderType = 'tax6' | 'tax12' | 'dd';

export type CommunicationMethod = 'whatsapp' | 'email';

export type OrderItem = {name: string; qty: number};

export type V62Data = {
  registrationNumber: string;
  makeModel: string;
  colour: string;
  taxationClass: string;
  keeperName: string;
  keeperAddress: string;
};

/** What the camera hands back. `uri` is a local file:// path on device. */
export type InvoicePhoto = {uri: string; capturedAt: string};

/* ------------------------------- bank details ------------------------------ */

/*
 * A Direct Debit order arrives with the customer's mandate details, and
 * a person at this end has to check them before the first collection.
 * When something is wrong the order goes back to the customer with the
 * bad fields named, and returns when they have fixed it — as many times
 * as it takes.
 */
export type BankField =
  | 'accountHolder'
  | 'accountNumber'
  | 'sortCode'
  | 'dateOfBirth';

export const BANK_FIELDS: BankField[] = [
  'accountHolder',
  'accountNumber',
  'sortCode',
  'dateOfBirth',
];

export const BANK_FIELD_LABEL: Record<BankField, string> = {
  accountHolder: 'Account holder name',
  accountNumber: 'Account number',
  sortCode: 'Sort code',
  dateOfBirth: 'Date of birth',
};

export type BankDetails = Record<BankField, string>;

export type BankReviewStatus = 'submitted' | 'changes_requested' | 'approved';

/** One turn in the back-and-forth. */
export type BankReviewNote = {
  at: string;
  by: 'supplier' | 'customer';
  /** What was flagged. Empty on the customer's reply. */
  fields: BankField[];
  message: string;
};

export type BankReview = {
  status: BankReviewStatus;
  /** Still outstanding. Empty once approved. */
  flagged: BankField[];
  /** Oldest first, so the thread reads top to bottom. */
  notes: BankReviewNote[];
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  reg: string;
  vehicleModel: string;
  orderType: OrderType;
  plan: string;
  items: OrderItem[];
  total: number;
  orderDate: string;
  deliveryAddress: string;
  /** Which supplier the routing rules picked. */
  supplierId: string;
  /** When it was assigned — the 7-minute timer starts here. */
  assignedAt: string;
  status: OrderStatus;
  invoiceStatus: InvoiceStatus;
  invoicePhoto?: InvoicePhoto;
  /** When the invoice landed — the timer stops here. */
  invoiceUploadedAt?: string;
  /**
   * When an admin sent it to the customer over WhatsApp. Only ever set
   * on WhatsApp orders; an email order is delivered by the supplier's
   * own system the moment the invoice is uploaded.
   */
  deliveredAt?: string;
  communicationMethod: CommunicationMethod;
  whatsappRequested: boolean;
  v62Requested: boolean;
  v62?: V62Data;
  /** Direct Debit orders only — the mandate details to be checked. */
  bank?: BankDetails;
  /** Direct Debit orders only — how far that check has got. */
  bankReview?: BankReview;
  /**
   * When the supplier's current 7-minute window started. Unset on almost
   * every order, where it is simply the assignment; set when a Direct
   * Debit order comes back from the customer, because the window then
   * starts again from the moment it landed back in the supplier's court.
   */
  turnStartedAt?: string;
};

/* ---------------------------------- routing --------------------------------- */

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  tax6: '6 Months',
  tax12: '12 Months',
  dd: 'Direct Debit',
};

export type Supplier = {
  id: string;
  name: string;
  company: string;
  /** Several suppliers can be active at once. */
  active: boolean;
  /** The order types this supplier is configured to handle. */
  orderTypes: OrderType[];
};

/*
 * Mirrors the eligibility checklist the admin manages in the admin
 * portal. A and B are both active and cover different order types.
 */
export const SUPPLIERS: Supplier[] = [
  {
    id: 'supplier-1',
    name: 'Supplier A',
    company: 'Northgate Motor Services',
    active: true,
    orderTypes: ['tax6', 'dd'],
  },
  {
    id: 'supplier-2',
    name: 'Supplier B',
    company: 'Crownway Vehicle Admin',
    active: true,
    orderTypes: ['tax12'],
  },
  {
    id: 'supplier-3',
    name: 'Supplier C',
    company: 'Harbour Tax Bureau',
    active: false,
    orderTypes: ['tax6', 'tax12', 'dd'],
  },
];

export function supplierById(id: string) {
  return SUPPLIERS.find(sup => sup.id === id) ?? null;
}

export function supplierName(id: string) {
  return supplierById(id)?.name ?? 'Unassigned';
}

/**
 * Order Type -> Supplier Eligibility -> Active Supplier -> Assign.
 * Returns null when no active supplier handles the type, which is the
 * case the admin has to be told about.
 */
export function routeOrder(orderType: OrderType, suppliers = SUPPLIERS) {
  return (
    suppliers.find(sup => sup.active && sup.orderTypes.includes(orderType)) ??
    null
  );
}

/* ---------------------------------- accounts -------------------------------- */

export type Role = 'supplier' | 'admin';

export type Account = {
  email: string;
  password: string;
  name: string;
  role: Role;
  /** Suppliers are scoped to their own orders; admins see everything. */
  supplierId?: string;
};

/*
 * Prototype credentials, in plain text and shipped to the device. Fine
 * for a demo, must never ship as-is. An admin signing in here does not
 * become a supplier — the role decides what the app shows.
 */
export const ACCOUNTS: Account[] = [
  {
    email: 'supplier.a@partners.co.uk',
    password: 'supplier123',
    name: 'Ian Brooks',
    role: 'supplier',
    supplierId: 'supplier-1',
  },
  {
    email: 'supplier.b@partners.co.uk',
    password: 'supplier123',
    name: 'Denise Okafor',
    role: 'supplier',
    supplierId: 'supplier-2',
  },
  {
    email: 'admin@partners.co.uk',
    password: 'admin123',
    name: 'Alex Morgan',
    role: 'admin',
  },
];

export function authenticate(email: string, password: string) {
  const clean = email.trim().toLowerCase();
  return (
    ACCOUNTS.find(acc => acc.email === clean && acc.password === password) ??
    null
  );
}

/* ----------------------------------- timer ---------------------------------- */

/**
 * How long the supplier has to upload the invoice. The window starts
 * when the order is assigned and only stops on upload — it is not an
 * acceptance timer.
 */
export const RESPONSE_TIMEOUT_MS = 7 * 60 * 1000;

const minutesAgo = (n: number) =>
  new Date(Date.now() - n * 60 * 1000).toISOString();

export const gbp = (amount: number) => '£' + amount.toFixed(2);

export function formatTimeAgo(iso: string) {
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return hh + ':' + mm;
}

/** Same calendar day as now — what the admin's main screen shows. */
export function isToday(iso: string, now = Date.now()) {
  const a = new Date(iso);
  const b = new Date(now);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export type BadgeTone = 'done' | 'live' | 'overdue' | 'neutral';

const STATUS_LABEL: Record<OrderStatus, {label: string; tone: BadgeTone}> = {
  awaiting_invoice: {label: 'New Order', tone: 'live'},
  overdue: {label: 'Overdue', tone: 'overdue'},
  awaiting_whatsapp: {label: 'Send via WhatsApp', tone: 'live'},
  completed: {label: 'Completed', tone: 'done'},
};

export function statusInfo(status: OrderStatus) {
  return STATUS_LABEL[status];
}

/** Still needs an invoice — the main work a supplier has to do. */
export function needsInvoice(order: Order) {
  return order.invoiceStatus === 'pending';
}

/* --------------------------- the bank review loop -------------------------- */

/** A Direct Debit order that came with mandate details to check. */
export function hasBankReview(order: Order) {
  return order.orderType === 'dd' && !!order.bank && !!order.bankReview;
}

/** Sitting with the supplier, waiting to be approved or flagged. */
export function bankAwaitingReview(order: Order) {
  return hasBankReview(order) && order.bankReview?.status === 'submitted';
}

/** Back with the customer. Nothing the supplier does moves it. */
export function bankWithCustomer(order: Order) {
  return (
    hasBankReview(order) && order.bankReview?.status === 'changes_requested'
  );
}

/**
 * Cleared to proceed — either signed off, or an order that never needed
 * a mandate in the first place.
 */
export function bankCleared(order: Order) {
  return !hasBankReview(order) || order.bankReview?.status === 'approved';
}

/**
 * You cannot raise an invoice against a mandate you have not agreed to
 * yet, so a Direct Debit order's bank details have to be approved first.
 * Every other order type is unaffected.
 */
export function canUploadInvoice(order: Order) {
  return order.invoiceStatus === 'pending' && bankCleared(order);
}

/**
 * When the supplier's 7-minute window started.
 *
 * For almost every order that is the assignment. A Direct Debit order
 * that went back to the customer restarts it on return, because the
 * window measures how quickly the *supplier* responds — leaving it
 * running while the ball is in the customer's court would make an order
 * overdue for something the supplier could do nothing about.
 */
export function clockStartedAt(order: Order) {
  return order.turnStartedAt ?? order.assignedAt;
}

/**
 * Uploaded, the customer chose WhatsApp, and nobody has sent it yet —
 * so it is sitting in an admin's court. Email orders never land here.
 */
export function awaitingWhatsappSend(order: Order) {
  return (
    order.communicationMethod === 'whatsapp' &&
    order.invoiceStatus === 'uploaded' &&
    !order.deliveredAt
  );
}

/** The status an order lands in once its invoice is uploaded. */
export function statusAfterUpload(order: Order): OrderStatus {
  return order.communicationMethod === 'whatsapp'
    ? 'awaiting_whatsapp'
    : 'completed';
}

let orderSeq = 1025;
export function nextOrderNumber() {
  orderSeq += 1;
  return 'ORD-' + orderSeq;
}

const CUSTOMER_NAMES = [
  'John Smith',
  'Sarah Lee',
  'Michael Chan',
  'Priya Patel',
  'David Wright',
];

export function randomCustomerName() {
  return CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
}

const PLANS: Record<OrderType, {plan: string; total: number; item: string}> = {
  tax6: {plan: '6-month tax', total: 135, item: 'Vehicle tax (6 months)'},
  tax12: {plan: '12-month tax', total: 220, item: 'Vehicle tax (12 months)'},
  dd: {plan: 'Direct Debit', total: 220, item: 'Vehicle tax (Direct Debit)'},
};

export function planFor(orderType: OrderType) {
  return PLANS[orderType];
}

/**
 * Mandate details for a simulated Direct Debit order. Plausible rather
 * than random: a supplier reviewing these needs something that looks
 * like a real account, and can flag whatever they like about it.
 */
export function sampleBankDetails(customerName: string): BankDetails {
  const pad = (n: number, width: number) =>
    String(Math.floor(n)).padStart(width, '0');
  const seed = Math.floor(Math.random() * 1e8);
  const sort = pad(Math.floor(Math.random() * 1e6), 6);
  return {
    accountHolder: customerName,
    accountNumber: pad(seed, 8),
    sortCode: sort.slice(0, 2) + '-' + sort.slice(2, 4) + '-' + sort.slice(4),
    dateOfBirth:
      pad(1 + Math.random() * 28, 2) +
      '/' +
      pad(1 + Math.random() * 12, 2) +
      '/' +
      String(1965 + Math.floor(Math.random() * 30)),
  };
}

/** Seed orders — every state the updated flow exercises. */
export const INITIAL_ORDERS: Order[] = [
  /*
   * A Direct Debit order that has just landed with its mandate details.
   * Nothing about it can be invoiced until those details are approved,
   * so this is the one that exercises the review loop.
   */
  {
    id: 'order-1025',
    orderNumber: 'ORD-1025',
    customerName: 'Sarah Lee',
    customerPhone: '07700 900771',
    reg: 'LM68 RTV',
    vehicleModel: 'Kia Sportage 1.6 GDi',
    orderType: 'dd',
    plan: 'Direct Debit',
    items: [{name: 'Vehicle tax (Direct Debit)', qty: 1}],
    total: 220,
    orderDate: '31 Aug 2026',
    deliveryAddress: '8 Bramble Close, Leeds, LS6 2QX',
    supplierId: 'supplier-1',
    assignedAt: minutesAgo(1),
    status: 'awaiting_invoice',
    invoiceStatus: 'pending',
    communicationMethod: 'email',
    whatsappRequested: false,
    v62Requested: false,
    bank: {
      accountHolder: 'S Lee',
      accountNumber: '61220945',
      sortCode: '30-96-12',
      dateOfBirth: '02/11/1988',
    },
    bankReview: {status: 'submitted', flagged: [], notes: []},
  },
  {
    id: 'order-1024',
    orderNumber: 'ORD-1024',
    customerName: 'John Smith',
    customerPhone: '07700 900123',
    reg: 'AB12 CDE',
    vehicleModel: 'Ford Fiesta 1.0 EcoBoost',
    orderType: 'tax12',
    plan: '12-month tax',
    items: [{name: 'Vehicle tax (12 months)', qty: 1}],
    total: 220,
    orderDate: '31 Aug 2026',
    deliveryAddress: '24 Maple Road, London, SW11 3AA',
    supplierId: 'supplier-2',
    assignedAt: minutesAgo(5.5),
    status: 'awaiting_invoice',
    invoiceStatus: 'pending',
    communicationMethod: 'whatsapp',
    whatsappRequested: true,
    v62Requested: false,
  },
  {
    id: 'order-1023',
    orderNumber: 'ORD-1023',
    customerName: 'Rebecca Scott',
    customerPhone: '07715 816586',
    reg: 'DV65 YWO',
    vehicleModel: 'Vauxhall (2015)',
    orderType: 'tax6',
    plan: '6-month tax',
    items: [
      {name: 'Vehicle tax (6 months)', qty: 1},
      {name: 'V62 registration certificate', qty: 1},
    ],
    total: 175,
    orderDate: '30 Aug 2026',
    deliveryAddress: '40 California Road, Carlisle, CA3 0BY',
    supplierId: 'supplier-1',
    assignedAt: minutesAgo(2),
    status: 'awaiting_invoice',
    invoiceStatus: 'pending',
    communicationMethod: 'email',
    whatsappRequested: false,
    v62Requested: true,
    // Sample V62 submission — matches a real filled-in DVLA V62 form.
    v62: {
      registrationNumber: 'DV65 YWO',
      makeModel: 'VAUXHALL (2015 VAUXHALL)',
      colour: 'Silver',
      taxationClass: 'Petrol',
      keeperName: 'Rebecca Scott',
      keeperAddress: '40 California Road, Carlisle, CA3 0BY',
    },
  },
  {
    id: 'order-1022',
    orderNumber: 'ORD-1022',
    customerName: 'Michael Chan',
    customerPhone: '07700 900789',
    reg: 'LM68 RTV',
    vehicleModel: 'Vauxhall Corsa 1.2 Turbo',
    orderType: 'tax12',
    plan: '12-month tax',
    items: [{name: 'Vehicle tax (12 months)', qty: 1}],
    total: 220,
    orderDate: '29 Aug 2026',
    deliveryAddress: '15 Elm Street, Bristol, BS1 4DJ',
    supplierId: 'supplier-2',
    assignedAt: minutesAgo(130),
    status: 'completed',
    invoiceStatus: 'uploaded',
    invoicePhoto: {
      uri: 'mock://invoice-ORD-1022.jpg',
      capturedAt: minutesAgo(126),
    },
    invoiceUploadedAt: minutesAgo(126),
    communicationMethod: 'email',
    whatsappRequested: false,
    v62Requested: false,
  },
  {
    id: 'order-1021',
    orderNumber: 'ORD-1021',
    customerName: 'Priya Patel',
    customerPhone: '07700 900321',
    reg: 'BD21 KLN',
    vehicleModel: 'Toyota Yaris 1.5 Hybrid',
    orderType: 'dd',
    plan: 'Direct Debit',
    items: [{name: 'Vehicle tax (Direct Debit)', qty: 1}],
    total: 220,
    orderDate: '27 Aug 2026',
    deliveryAddress: '2 Chestnut Ave, Leeds, LS1 2HN',
    supplierId: 'supplier-1',
    assignedAt: minutesAgo(60 * 24),
    status: 'completed',
    invoiceStatus: 'uploaded',
    invoicePhoto: {
      uri: 'mock://invoice-ORD-1021.jpg',
      capturedAt: minutesAgo(60 * 24 - 4),
    },
    invoiceUploadedAt: minutesAgo(60 * 24 - 4),
    deliveredAt: minutesAgo(60 * 24 - 6),
    communicationMethod: 'whatsapp',
    whatsappRequested: true,
    v62Requested: false,
    bank: {
      accountHolder: 'Priya Patel',
      accountNumber: '88104772',
      sortCode: '11-02-40',
      dateOfBirth: '19/03/1985',
    },
    /* Went round once before it was right — kept as the worked example. */
    bankReview: {
      status: 'approved',
      flagged: [],
      notes: [
        {
          at: minutesAgo(60 * 26),
          by: 'supplier',
          fields: ['accountHolder'],
          message:
            'Account holder was initials only. Please send the full name as the bank holds it.',
        },
        {
          at: minutesAgo(60 * 25),
          by: 'customer',
          fields: [],
          message: 'Details updated and sent back for review.',
        },
        {
          at: minutesAgo(60 * 24 - 1),
          by: 'supplier',
          fields: [],
          message: 'Approved — mandate set up.',
        },
      ],
    },
  },
  {
    id: 'order-1019',
    orderNumber: 'ORD-1019',
    customerName: 'Aisha Rahman',
    customerPhone: '07700 900555',
    reg: 'MK17 OPD',
    vehicleModel: 'Honda Civic 1.6 i-DTEC SR',
    orderType: 'dd',
    plan: 'Direct Debit',
    items: [{name: 'Vehicle tax (Direct Debit)', qty: 1}],
    total: 220,
    orderDate: '31 Aug 2026',
    deliveryAddress: '77 Sandwell Street, Birmingham, B19 2QT',
    supplierId: 'supplier-1',
    assignedAt: minutesAgo(9),
    // Uploaded inside the window; now waiting on an admin to send it.
    status: 'awaiting_whatsapp',
    invoiceStatus: 'uploaded',
    invoicePhoto: {
      uri: 'mock://invoice-ORD-1019.jpg',
      capturedAt: minutesAgo(5),
    },
    invoiceUploadedAt: minutesAgo(5),
    communicationMethod: 'whatsapp',
    whatsappRequested: true,
    v62Requested: false,
    bank: {
      accountHolder: 'Aisha Rahman',
      accountNumber: '20336914',
      sortCode: '60-14-88',
      dateOfBirth: '27/07/1979',
    },
    bankReview: {
      status: 'approved',
      flagged: [],
      notes: [
        {
          at: minutesAgo(8),
          by: 'supplier',
          fields: [],
          message: 'Approved — mandate set up.',
        },
      ],
    },
  },
  {
    id: 'order-1020',
    orderNumber: 'ORD-1020',
    customerName: 'David Wright',
    customerPhone: '07700 900654',
    reg: 'EF70 WQP',
    vehicleModel: 'Nissan Qashqai 1.3 DIG-T',
    orderType: 'tax6',
    plan: '6-month tax',
    items: [{name: 'Vehicle tax (6 months)', qty: 1}],
    total: 135,
    orderDate: '31 Aug 2026',
    deliveryAddress: '61 Poplar Grove, Sheffield, S1 3RE',
    supplierId: 'supplier-1',
    assignedAt: minutesAgo(12),
    status: 'overdue',
    invoiceStatus: 'pending',
    communicationMethod: 'email',
    whatsappRequested: false,
    v62Requested: false,
  },
];
