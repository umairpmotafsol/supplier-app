/**
 * App-wide transient state: the shared clock and a global busy flag.
 *
 * `now` ticks once a second so every countdown on screen updates in
 * lockstep off one timer rather than one timer per card. It is the
 * definition of transient state, so nothing here is persisted.
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  /** Epoch ms, refreshed every second by ClockDriver. */
  now: Date.now(),
  /** Set by long-running work that should block the UI. */
  busy: false,
  /** Last non-fatal error surfaced to the user, for debugging. */
  lastError: null,
};

const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {
    /**
     * One tick of the shared clock. Other slices listen for this action
     * (ordersSlice flips late orders to overdue on it), so the whole
     * second's work lands in a single dispatch and a single render.
     */
    clockTicked(state, action) {
      state.now = action.payload;
    },
    busyChanged(state, action) {
      state.busy = action.payload;
    },
    errorReported(state, action) {
      state.lastError = action.payload;
    },
  },
});

export const { clockTicked, busyChanged, errorReported } = commonSlice.actions;

export default commonSlice.reducer;
