/**
 * The live-connection status.
 *
 * In production this app and the customer app would share a backend, and
 * a socket would be what pushes a newly routed order to the supplier and
 * a corrected mandate back from the customer — the two places the
 * prototype has to simulate by hand.
 *
 * No socket client is installed, because there is no server to connect
 * to and a mock screen must not depend on one. What lives here is the
 * connection state the UI would read, plus the events buffer, so wiring
 * a real client means dispatching these actions from its callbacks and
 * nothing else changes.
 *
 * Transient: never persisted.
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  /** 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error' */
  status: 'idle',
  /** Last connection error message, if any. */
  error: null,
  /** Epoch ms of the last message received. */
  lastEventAt: null,
  /** Most recent server events, newest first, capped so it cannot grow. */
  events: [],
};

const MAX_EVENTS = 25;

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    socketConnecting(state) {
      state.status = 'connecting';
      state.error = null;
    },
    socketConnected(state) {
      state.status = 'connected';
      state.error = null;
    },
    socketDisconnected(state, action) {
      state.status = 'disconnected';
      state.error = action.payload ?? null;
    },
    socketErrored(state, action) {
      state.status = 'error';
      state.error = action.payload ?? 'Socket error';
    },
    socketEventReceived: {
      reducer(state, action) {
        state.lastEventAt = action.payload.at;
        state.events.unshift(action.payload);
        state.events.splice(MAX_EVENTS);
      },
      prepare: (name, data) => ({
        payload: { name, data, at: Date.now() },
      }),
    },
    socketReset: () => initialState,
  },
});

export const {
  socketConnecting,
  socketConnected,
  socketDisconnected,
  socketErrored,
  socketEventReceived,
  socketReset,
} = socketSlice.actions;

export const selectSocketConnected = state =>
  state.socket.status === 'connected';

export default socketSlice.reducer;
