/**
 * Who is signed in.
 *
 * Two kinds of account share one form: a supplier, scoped to their own
 * orders, and an admin, who monitors every supplier. The role comes back
 * from the account, so there is no "I am an admin" toggle to get wrong.
 *
 * Only this slice's `session` is persisted, and only after the password
 * has been stripped from it — see `sanitize` below.
 */
import { createSlice } from '@reduxjs/toolkit';

import { authenticate } from '../../data/mock';
import { clearToken, saveToken } from '../../security/keychainService';

/**
 * The account without its credentials. The prototype's accounts carry a
 * plain-text password so the mock sign-in can check it; that must never
 * reach disk, and nothing in the UI reads it.
 *
 * @param {import('../../data/mock').Account} account
 */
const sanitize = account => ({
  email: account.email,
  name: account.name,
  role: account.role,
  supplierId: account.supplierId,
});

const initialState = {
  /** @type {ReturnType<typeof sanitize> | null} */
  session: null,
  /** True while a sign-in is in flight. Never persisted. */
  signingIn: false,
  /** Set when the last sign-in attempt was rejected. Never persisted. */
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signInStarted(state) {
      state.signingIn = true;
      state.error = null;
    },
    signedIn: {
      reducer(state, action) {
        state.session = action.payload;
        state.signingIn = false;
        state.error = null;
      },
      prepare: account => ({ payload: sanitize(account) }),
    },
    signInFailed(state, action) {
      state.signingIn = false;
      state.error =
        action.payload ?? 'Those credentials do not match an account.';
    },
    /** Also clears the order alerts — see ordersSlice's extraReducers. */
    signedOut(state) {
      state.session = null;
      state.signingIn = false;
      state.error = null;
    },
    /** Profile edits the prototype can make without a backend. */
    profileUpdated(state, action) {
      if (state.session) {
        state.session = { ...state.session, ...action.payload };
      }
    },
  },
});

export const {
  signInStarted,
  signedIn,
  signInFailed,
  signedOut,
  profileUpdated,
} = authSlice.actions;

/**
 * Mock sign-in. Returns true when the credentials match one of the
 * prototype accounts — synchronously, exactly as the context store did,
 * so the sign-in button still reacts within the same tap.
 *
 * The session token is a stand-in: there is no auth server, so a local
 * value is written to the Keychain to prove the seam works and to give
 * the axios interceptor something to attach. That write is asynchronous
 * and is deliberately not awaited: a prototype must still sign in on a
 * device whose keychain is unavailable, so failures are swallowed.
 *
 * @returns {(dispatch: Function) => boolean}
 */
export const signIn = (email, password) => dispatch => {
  dispatch(signInStarted());
  const account = authenticate(email, password);
  if (!account) {
    dispatch(signInFailed());
    return false;
  }
  saveToken(`mock-session-${account.email}`).catch(() => {});
  dispatch(signedIn(account));
  return true;
};

/** Signs out and drops the stored token. */
export const signOut = () => dispatch => {
  clearToken().catch(() => {});
  dispatch(signedOut());
};

export default authSlice.reducer;
