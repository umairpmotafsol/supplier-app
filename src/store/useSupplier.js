/**
 * The screens' view of the store.
 *
 * State lives in Redux (see the slices next door); this hook is the
 * selector/dispatch facade over it, and keeps the shape the screens were
 * written against so the migration did not have to rewrite every screen
 * to prove the store changed underneath them.
 *
 * Use plain `useSelector` for anything new and narrow — this hook
 * re-renders on the clock tick, because most of what reads it is a
 * countdown.
 */
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { signIn, signOut } from './auth/authSlice';
import {
  bankChangesRequested,
  bankDetailsApproved,
  invoiceDelivered,
  invoiceUploaded,
  newOrderDismissed,
  readyToSendDismissed,
  sendInvoice,
  simulateCustomerBankUpdate,
  simulateNewOrder,
} from './orders/ordersSlice';
import {
  selectBankQueue,
  selectIsAdmin,
  selectNewOrder,
  selectNow,
  selectOrders,
  selectReadyToSend,
  selectSession,
  selectVisibleOrders,
  selectWhatsappQueue,
} from './selectors';

export function useSupplier() {
  const dispatch = useDispatch();

  const session = useSelector(selectSession);
  const isAdmin = useSelector(selectIsAdmin);
  const orders = useSelector(selectOrders);
  const visibleOrders = useSelector(selectVisibleOrders);
  const now = useSelector(selectNow);
  const newOrder = useSelector(selectNewOrder);
  const readyToSend = useSelector(selectReadyToSend);
  const whatsappQueue = useSelector(selectWhatsappQueue);
  const bankQueue = useSelector(selectBankQueue);

  return useMemo(
    () => ({
      session,
      isAdmin,
      /** Returns false when the credentials do not match an account. */
      signIn: (email, password) => dispatch(signIn(email, password)),
      signOut: () => dispatch(signOut()),

      orders,
      visibleOrders,
      now,

      newOrder,
      dismissNewOrder: () => dispatch(newOrderDismissed()),
      readyToSend,
      dismissReadyToSend: () => dispatch(readyToSendDismissed()),
      whatsappQueue,
      bankQueue,

      requestBankChanges: (id, fields, message) =>
        dispatch(bankChangesRequested(id, fields, message)),
      approveBankDetails: id => dispatch(bankDetailsApproved(id)),
      simulateCustomerBankUpdate: id =>
        dispatch(simulateCustomerBankUpdate(id)),

      uploadInvoice: (id, photo) => dispatch(invoiceUploaded(id, photo)),
      /** Resolves false when the admin dismissed the share sheet. */
      sendInvoice: id => dispatch(sendInvoice(id)),
      markDelivered: id => dispatch(invoiceDelivered(id)),
      simulateNewOrder: orderType => dispatch(simulateNewOrder(orderType)),
    }),
    [
      dispatch,
      session,
      isAdmin,
      orders,
      visibleOrders,
      now,
      newOrder,
      readyToSend,
      whatsappQueue,
      bankQueue,
    ],
  );
}

export default useSupplier;
