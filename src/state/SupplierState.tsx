/**
 * Single in-memory store for the supplier portal prototype: the orders
 * assigned to this supplier, the 7-minute response timer, and the
 * invoice upload/send actions.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  INITIAL_ORDERS,
  Order,
  RESPONSE_TIMEOUT_MS,
  SUPPLIER_NAME,
  nextOrderNumber,
  randomCustomerName,
} from '../data/mock';

type Store = {
  supplierName: string;
  orders: Order[];
  /** Ticks every second so screens can render live countdowns. */
  now: number;
  acceptOrder: (id: string) => void;
  uploadInvoice: (id: string, fileName: string) => void;
  sendToCustomer: (id: string) => void;
  simulateNewOrder: () => void;
};

const SupplierContext = createContext<Store | null>(null);

export function useSupplier() {
  const store = useContext(SupplierContext);
  if (!store) {
    throw new Error('useSupplier must be used inside <SupplierProvider>');
  }
  return store;
}

export function SupplierProvider({children}: {children: React.ReactNode}) {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    /*
     * This is a frontend-only prototype timer. In production the
     * 7-minute supplier response window must be enforced server-side
     * (e.g. a scheduled job or a queue with a visibility timeout),
     * since a `setInterval` here stops the moment the app or browser
     * tab is closed and can't be trusted to fire the timeout.
     */
    const id = setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      setOrders(current => {
        let changed = false;
        const next = current.map(order => {
          if (order.status !== 'awaiting_supplier') {
            return order;
          }
          const elapsed = tick - new Date(order.assignedAt).getTime();
          if (elapsed < RESPONSE_TIMEOUT_MS) {
            return order;
          }
          changed = true;
          return {
            ...order,
            status: 'overdue' as const,
            supplierResponse: 'overdue' as const,
          };
        });
        return changed ? next : current;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const acceptOrder = useCallback((id: string) => {
    setOrders(current =>
      current.map(order =>
        order.id === id && order.status === 'awaiting_supplier'
          ? {...order, status: 'processing', supplierResponse: 'accepted'}
          : order,
      ),
    );
  }, []);

  const uploadInvoice = useCallback((id: string, fileName: string) => {
    setOrders(current =>
      current.map(order =>
        order.id === id
          ? {
              ...order,
              status: 'invoice_uploaded',
              invoiceStatus: 'uploaded',
              invoiceFileName: fileName,
              invoiceUploadedAt: new Date().toISOString(),
            }
          : order,
      ),
    );
  }, []);

  const sendToCustomer = useCallback((id: string) => {
    /*
     * Mock only — the real send (email / in-app delivery) will be a
     * backend integration. For now this just flips frontend state.
     */
    setOrders(current =>
      current.map(order =>
        order.id === id
          ? {
              ...order,
              status: 'invoice_sent',
              invoiceStatus: 'sent',
              invoiceSentAt: new Date().toISOString(),
            }
          : order,
      ),
    );
  }, []);

  const simulateNewOrder = useCallback(() => {
    const order: Order = {
      id: 'order-' + Date.now(),
      orderNumber: nextOrderNumber(),
      customerName: randomCustomerName(),
      customerPhone: '07700 900' + Math.floor(100 + Math.random() * 900),
      reg: 'AB' + Math.floor(10 + Math.random() * 89) + ' XYZ',
      vehicleModel: 'Ford Focus 1.5 EcoBlue',
      plan: '12-month tax',
      items: [{name: 'Vehicle tax (12 months)', qty: 1}],
      total: 220,
      orderDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      deliveryAddress: '10 Test Street, London, E1 6AN',
      assignedAt: new Date().toISOString(),
      status: 'awaiting_supplier',
      supplierResponse: 'pending',
      invoiceStatus: 'pending',
      communicationMethod: 'email',
      whatsappRequested: false,
      v62Requested: false,
    };
    setOrders(current => [order, ...current]);
  }, []);

  const value = useMemo<Store>(
    () => ({
      supplierName: SUPPLIER_NAME,
      orders,
      now,
      acceptOrder,
      uploadInvoice,
      sendToCustomer,
      simulateNewOrder,
    }),
    [orders, now, acceptOrder, uploadInvoice, sendToCustomer, simulateNewOrder],
  );

  return (
    <SupplierContext.Provider value={value}>
      {children}
    </SupplierContext.Provider>
  );
}
