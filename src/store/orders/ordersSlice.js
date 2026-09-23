/**
 * The order book, from tax-my-motor-backend. The rules are unchanged
 * from the prototype: an order is *assigned* by the routing rules and
 * never accepted, the invoice upload is what stops the clock, an email
 * order finishes at the upload and a WhatsApp order then waits on an
 * admin, and a Direct Debit order cannot be invoiced until its mandate
 * details are approved. The server enforces every one of those now —
 * this slice just reflects what it says back.
 *
 * Not persisted (see combineReducer.js): fetched on sign-in and kept
 * warm by OrdersPoller for as long as somebody is signed in, the way a
 * real device would have the book pushed to it.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { fileNameFromUri, mimeTypeFor } from '../../resources/utils/helper';
import { api } from '../../resources/axios/AxiosInterceptorFunction';
import { API_URL, buildUrl } from '../../resources/utils/apiUrl';
import { awaitingWhatsappSend, toAppOrder } from '../../data/mock';
import { shareInvoice } from '../../lib/share';
import { signOut } from '../auth/authSlice';

const initialState = {
  /** @type {import('../../data/mock').Order[]} */
  items: [],
  status: 'idle',
  error: null,
  /** True once the first fetch for the current session has landed. */
  hasLoadedOnce: false,
  /** The most recent unseen assignment, shown as the New Order popup. */
  newOrderId: null,
  /** A WhatsApp order an admin has not been shown yet. */
  readyToSendId: null,
};

/**
 * The signed-in supplier's own book, or — for an admin — every order.
 * The server does the scoping (SupplierOrdersController filters to the
 * caller's own supplier), so there is nothing to filter again here.
 *
 * The two endpoints do not speak the same language, though: a supplier's
 * orders arrive already in this app's four states, an admin's arrive in
 * the order book's own six. `toAppOrder` translates the admin feed here,
 * at the edge, so that past this point there is one vocabulary and no
 * screen has to ask who is signed in.
 */
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { getState, rejectWithValue }) => {
    const isAdmin = getState().auth.session?.role === 'admin';
    try {
      const page = await api.get(
        isAdmin ? API_URL.ADMIN_ORDERS : API_URL.SUPPLIER_ORDERS,
        { params: { limit: 100 }, silent: true },
      );
      return isAdmin ? page.items.map(toAppOrder) : page.items;
    } catch (error) {
      return rejectWithValue(error?.described?.message ?? error.message);
    }
  },
);

/**
 * Uploads the photographed invoice. Always stops the timer; what happens
 * next — finished outright, or parked for an admin to send — is decided
 * server-side from the order's own communication method, so the updated
 * order the server hands back is the one thing this needs to store.
 */
export const uploadInvoice = createAsyncThunk(
  'orders/uploadInvoice',
  async ({ id, photo }, { rejectWithValue }) => {
    const body = new FormData();
    body.append('file', {
      uri: photo.uri,
      name: fileNameFromUri(photo.uri),
      type: mimeTypeFor(photo.uri),
    });
    try {
      return await api.post(
        buildUrl(API_URL.INVOICE_UPLOAD, { orderId: id }),
        body,
      );
    } catch (error) {
      return rejectWithValue(error?.described?.message ?? error.message);
    }
  },
);

/** Signs off the mandate so the invoice can be raised. */
export const approveBankDetails = createAsyncThunk(
  'orders/approveBankDetails',
  async (id, { rejectWithValue }) => {
    try {
      return await api.post(
        buildUrl(API_URL.SUPPLIER_ORDER_BANK_APPROVE, { id }),
      );
    } catch (error) {
      return rejectWithValue(error?.described?.message ?? error.message);
    }
  },
);

/** Flag what is wrong and hand the order back. The flags and the note both travel. */
export const requestBankChanges = createAsyncThunk(
  'orders/requestBankChanges',
  async ({ id, fields, message }, { rejectWithValue }) => {
    try {
      return await api.post(
        buildUrl(API_URL.SUPPLIER_ORDER_BANK_REQUEST_CHANGES, { id }),
        { fields, message },
      );
    } catch (error) {
      return rejectWithValue(error?.described?.message ?? error.message);
    }
  },
);

/**
 * Opens the phone's share sheet for a WhatsApp order and records the
 * send with the server only once the admin has actually shared it.
 * Resolves false when they backed out or the sheet failed, so a
 * dismissed sheet never marks the order as delivered.
 */
export const sendInvoice = createAsyncThunk(
  'orders/sendInvoice',
  async (id, { getState, rejectWithValue }) => {
    const order = getState().orders.items.find(o => o.id === id);
    if (!order || !awaitingWhatsappSend(order)) {
      return { sent: false, order: null };
    }
    const shared = await shareInvoice(order);
    if (!shared) {
      return { sent: false, order: null };
    }
    try {
      const updated = await api.post(
        buildUrl(API_URL.ADMIN_ORDER_SEND, { id }),
      );
      /* An admin route, so an admin-shaped order — translated like the list. */
      return { sent: true, order: toAppOrder(updated) };
    } catch (error) {
      return rejectWithValue(error?.described?.message ?? error.message);
    }
  },
);

const upsert = (state, order) => {
  const index = state.items.findIndex(o => o.id === order.id);
  if (index >= 0) {
    state.items[index] = order;
  } else {
    state.items.unshift(order);
  }
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    newOrderDismissed(state) {
      state.newOrderId = null;
    },
    readyToSendDismissed(state) {
      state.readyToSendId = null;
    },
  },

  extraReducers: builder => {
    builder
      .addCase(fetchOrders.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        /*
         * Diffed against the previous poll, not the seed book: an order
         * that was already waiting when you signed in is not "new", but
         * one that appears between two polls is exactly what the New
         * Order popup exists for. Gated on `hasLoadedOnce` so the very
         * first fetch after signing in never pops it for the whole book
         * at once.
         */
        if (state.hasLoadedOnce) {
          const previous = new Map(state.items.map(o => [o.id, o]));
          const freshlyAssigned = action.payload.find(
            o => !previous.has(o.id),
          );
          if (freshlyAssigned) {
            state.newOrderId = freshlyAssigned.id;
          }
          const freshlyReady = action.payload.find(o => {
            const before = previous.get(o.id);
            return (
              awaitingWhatsappSend(o) &&
              !(before && awaitingWhatsappSend(before))
            );
          });
          if (freshlyReady) {
            state.readyToSendId = freshlyReady.id;
          }
        }
        state.items = action.payload;
        state.hasLoadedOnce = true;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Could not load the order book.';
      })

      .addCase(uploadInvoice.fulfilled, (state, action) => {
        upsert(state, action.payload);
      })

      .addCase(approveBankDetails.fulfilled, (state, action) => {
        upsert(state, action.payload);
      })

      .addCase(requestBankChanges.fulfilled, (state, action) => {
        upsert(state, action.payload);
      })

      .addCase(sendInvoice.fulfilled, (state, action) => {
        if (!action.payload.sent) {
          return;
        }
        upsert(state, action.payload.order);
        if (state.readyToSendId === action.payload.order.id) {
          state.readyToSendId = null;
        }
      })

      /* Signing out clears the book and both alerts, same as before. */
      .addCase(signOut.fulfilled, () => initialState);
  },
});

export const { newOrderDismissed, readyToSendDismissed } = ordersSlice.actions;

export default ordersSlice.reducer;
