/**
 * The screens' view of the store.
 *
 * State lives in Redux (see the slices next door); this hook is the
 * selector/dispatch facade over it, and keeps the shape the screens were
 * written against so wiring a real backend in did not mean rewriting
 * every screen underneath them. What changed: several actions now talk
 * to the server, so they return a promise a caller can `await` — RTK's
 * thunks are otherwise a drop-in replacement for the plain ones this
 * used to dispatch.
 *
 * Use plain `useSelector` for anything new and narrow — this hook
 * re-renders on the clock tick, because most of what reads it is a
 * countdown.
 */
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { signIn as signInThunk, signOut as signOutThunk } from './auth/authSlice';
import {
  approveBankDetails as approveBankDetailsThunk,
  newOrderDismissed,
  readyToSendDismissed,
  requestBankChanges as requestBankChangesThunk,
  sendInvoice as sendInvoiceThunk,
  uploadInvoice as uploadInvoiceThunk,
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
      /** Resolves false when the credentials do not match an account. */
      signIn: async (email, password) => {
        try {
          await dispatch(signInThunk({ email, password })).unwrap();
          return true;
        } catch {
          return false;
        }
      },
      signOut: () => dispatch(signOutThunk()),

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
        dispatch(requestBankChangesThunk({ id, fields, message })).unwrap(),
      approveBankDetails: id =>
        dispatch(approveBankDetailsThunk(id)).unwrap(),

      uploadInvoice: (id, photo) =>
        dispatch(uploadInvoiceThunk({ id, photo })).unwrap(),
      /** Resolves false when the admin dismissed the share sheet. */
      sendInvoice: id =>
        dispatch(sendInvoiceThunk(id))
          .unwrap()
          .then(result => result.sent)
          .catch(() => false),
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
