/**
 * Mock data for the supplier portal. There is no backend: this app is
 * signed in as a single supplier ("Supplier A", the currently active
 * supplier in the admin's mock data) and only ever sees orders that
 * would have been auto-assigned to it.
 *
 * The admin app and this app each keep their own local copy of the
 * mock order book — in production a shared backend would be the single
 * source of truth and both apps would read/write through it.
 */

export type OrderStatus =
  | 'awaiting_supplier'
  | 'accepted'
  | 'processing'
  | 'invoice_uploaded'
  | 'invoice_ready'
  | 'invoice_sent'
  | 'overdue';

export type SupplierResponse = 'pending' | 'accepted' | 'overdue';
export type InvoiceStatus = 'pending' | 'uploaded' | 'ready' | 'sent';
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

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  reg: string;
  vehicleModel: string;
  plan: string;
  items: OrderItem[];
  total: number;
  orderDate: string;
  deliveryAddress: string;
  assignedAt: string;
  status: OrderStatus;
  supplierResponse: SupplierResponse;
  invoiceStatus: InvoiceStatus;
  invoiceFileName?: string;
  invoiceUploadedAt?: string;
  invoiceSentAt?: string;
  communicationMethod: CommunicationMethod;
  whatsappRequested: boolean;
  v62Requested: boolean;
  v62?: V62Data;
};

/** This device is signed in as the currently active supplier. */
export const SUPPLIER_NAME = 'Supplier A';

/** How long a supplier has to accept a new order before it goes overdue. */
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

export type BadgeTone = 'done' | 'live' | 'overdue' | 'neutral';

const STATUS_LABEL: Record<OrderStatus, {label: string; tone: BadgeTone}> = {
  awaiting_supplier: {label: 'New Order', tone: 'live'},
  accepted: {label: 'Accepted', tone: 'live'},
  processing: {label: 'Processing', tone: 'live'},
  invoice_uploaded: {label: 'Invoice Uploaded', tone: 'neutral'},
  invoice_ready: {label: 'Invoice Ready', tone: 'neutral'},
  invoice_sent: {label: 'Invoice Sent', tone: 'done'},
  overdue: {label: 'Response Overdue', tone: 'overdue'},
};

export function statusInfo(status: OrderStatus) {
  return STATUS_LABEL[status];
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

/** Seed orders — a mix of every state the flows in the spec exercise. */
export const INITIAL_ORDERS: Order[] = [
  {
    id: 'order-1024',
    orderNumber: 'ORD-1024',
    customerName: 'John Smith',
    customerPhone: '07700 900123',
    reg: 'AB12 CDE',
    vehicleModel: 'Ford Fiesta 1.0 EcoBoost',
    plan: '12-month tax',
    items: [{name: 'Vehicle tax (12 months)', qty: 1}],
    total: 220,
    orderDate: '31 Aug 2026',
    deliveryAddress: '24 Maple Road, London, SW11 3AA',
    assignedAt: minutesAgo(5.5),
    status: 'awaiting_supplier',
    supplierResponse: 'pending',
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
    plan: '6-month tax + V62',
    items: [
      {name: 'Vehicle tax (6 months)', qty: 1},
      {name: 'V62 registration certificate', qty: 1},
    ],
    total: 175,
    orderDate: '30 Aug 2026',
    deliveryAddress: '40 California Road, Carlisle, CA3 0BY',
    assignedAt: minutesAgo(48),
    status: 'processing',
    supplierResponse: 'accepted',
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
    plan: '12-month tax',
    items: [{name: 'Vehicle tax (12 months)', qty: 1}],
    total: 220,
    orderDate: '29 Aug 2026',
    deliveryAddress: '15 Elm Street, Bristol, BS1 4DJ',
    assignedAt: minutesAgo(130),
    status: 'invoice_uploaded',
    supplierResponse: 'accepted',
    invoiceStatus: 'uploaded',
    invoiceFileName: 'invoice-ORD-1022.pdf',
    invoiceUploadedAt: minutesAgo(20),
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
    plan: 'Direct Debit',
    items: [{name: 'Vehicle tax (Direct Debit)', qty: 1}],
    total: 220,
    orderDate: '27 Aug 2026',
    deliveryAddress: '2 Chestnut Ave, Leeds, LS1 2HN',
    assignedAt: minutesAgo(60 * 24),
    status: 'invoice_sent',
    supplierResponse: 'accepted',
    invoiceStatus: 'sent',
    invoiceFileName: 'invoice-ORD-1021.pdf',
    invoiceUploadedAt: minutesAgo(60 * 20),
    invoiceSentAt: minutesAgo(60 * 19),
    communicationMethod: 'whatsapp',
    whatsappRequested: true,
    v62Requested: false,
  },
  {
    id: 'order-1020',
    orderNumber: 'ORD-1020',
    customerName: 'David Wright',
    customerPhone: '07700 900654',
    reg: 'EF70 WQP',
    vehicleModel: 'Nissan Qashqai 1.3 DIG-T',
    plan: '6-month tax',
    items: [{name: 'Vehicle tax (6 months)', qty: 1}],
    total: 135,
    orderDate: '31 Aug 2026',
    deliveryAddress: '61 Poplar Grove, Sheffield, S1 3RE',
    assignedAt: minutesAgo(12),
    status: 'overdue',
    supplierResponse: 'overdue',
    invoiceStatus: 'pending',
    communicationMethod: 'email',
    whatsappRequested: false,
    v62Requested: false,
  },
];
