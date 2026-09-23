/**
 * Who is signed in.
 *
 * Two kinds of account share one form: a supplier, scoped to their own
 * orders, and an admin, who monitors every supplier. The role comes back
 * from the account, so there is no "I am an admin" toggle to get wrong.
 *
 * Only this slice's `session` is persisted. Tokens never go through
 * Redux at all — they live in the Keychain (security/keychainService.js)
 * — so there is nothing to strip before it reaches disk.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { api } from '../../resources/axios/AxiosInterceptorFunction';
import { API_URL } from '../../resources/utils/apiUrl';
import {
  clearSession,
  getRefreshToken,
  getToken,
  saveRefreshToken,
  saveToken,
} from '../../security/keychainService';

/** The account as the store keeps it — exactly what the screens read. */
const sanitize = user => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  supplierId: user.supplierId ?? null,
});

const initialState = {
  /** @type {ReturnType<typeof sanitize> | null} */
  session: null,
  /** True while a sign-in is in flight. Never persisted. */
  signingIn: false,
  /** Set when the last sign-in attempt was rejected. Never persisted. */
  error: null,
};

async function persistTokens(tokens) {
  await Promise.all([
    saveToken(tokens.accessToken),
    saveRefreshToken(tokens.refreshToken),
  ]);
}

/**
 * Checks a stored token against the API on launch, so a session survives
 * an app restart with an up-to-date profile. If the token has gone bad
 * the request 401s, and it is the axios layer's `onUnauthorized` handler
 * (wired in App.js) — not this thunk — that actually signs the app out.
 */
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    const token = await getToken();
    if (!token) {
      return rejectWithValue(null);
    }
    try {
      return await api.get(API_URL.ME, { silent: true });
    } catch (error) {
      return rejectWithValue(error?.described?.message ?? error.message);
    }
  },
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const result = await api.post(
        API_URL.LOGIN,
        { email, password },
        { skipAuth: true, silent: true },
      );
      await persistTokens(result);
      return result.user;
    } catch (error) {
      return rejectWithValue(
        error?.described?.message ??
          'Those credentials do not match an account.',
      );
    }
  },
);

/**
 * The gate flips straight away; ending the session on the server and
 * clearing the Keychain happen behind it and cannot hold the user on a
 * signed-in screen — sign-out must never get stuck on a failed request.
 *
 * The server is only told while there is still a session to end. Arriving
 * here from a 401, the tokens are already gone and `/auth/logout` — an
 * authenticated route — would 401 in turn, which is what used to call
 * this thunk again from the interceptor, over and over.
 */
export const signOut = createAsyncThunk('auth/signOut', async () => {
  const [token, refreshToken] = await Promise.all([
    getToken(),
    getRefreshToken(),
  ]);
  if (token) {
    try {
      await api.post(
        API_URL.LOGOUT,
        { refreshToken },
        { silent: true, skipAuthEvents: true },
      );
    } catch {
      // Best-effort — the local session clears either way.
    }
  }
  await clearSession().catch(() => {});
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.session = sanitize(action.payload);
      })
      .addCase(restoreSession.rejected, () => {
        /* No stored token, or it didn't check out — stay signed out. */
      })

      .addCase(signIn.pending, state => {
        state.signingIn = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.signingIn = false;
        state.session = sanitize(action.payload);
      })
      .addCase(signIn.rejected, (state, action) => {
        state.signingIn = false;
        state.error =
          action.payload ?? 'Those credentials don’t match an account.';
      })

      .addCase(signOut.fulfilled, state => {
        state.session = null;
        state.signingIn = false;
        state.error = null;
      });
  },
});

export default authSlice.reducer;
