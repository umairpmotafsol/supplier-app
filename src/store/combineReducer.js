/**
 * The root reducer, and the deliberate decision about what survives a
 * restart.
 *
 * Persisted (AsyncStorage):
 *  - `auth.session` — who is signed in, *without* the password. Keeps
 *    you signed in across a restart; the token itself lives in the
 *    Keychain, not here.
 *  - `color`, `language` — user preferences; pointless to ask twice.
 *  - `biometric.enabled` — a preference. The credential behind it is in
 *    the Keychain, and `supportedType`/`enrolled` are re-read from the
 *    device on launch, so they are not persisted.
 *
 * Not persisted:
 *  - `orders` — mock data seeded relative to "now" (see ordersSlice), and
 *    in production it belongs to the backend anyway.
 *  - `common` — the clock and busy flags: transient by definition.
 *  - `socket` — a connection cannot be restored from disk.
 */
import { combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer } from 'redux-persist';

import auth from './auth/authSlice';
import biometric from './biometric/biometricSlice';
import color from './color/colorSlice';
import common from './common/commonSlice';
import language from './language/languageSlice';
import orders from './orders/ordersSlice';
import socket from './socket/socketSlice';

/** Bump when a persisted slice's shape changes. */
export const PERSIST_VERSION = 1;

const authPersistConfig = {
  key: 'auth',
  version: PERSIST_VERSION,
  storage: AsyncStorage,
  /* Transient sign-in status and error must not come back from disk. */
  whitelist: ['session'],
};

const biometricPersistConfig = {
  key: 'biometric',
  version: PERSIST_VERSION,
  storage: AsyncStorage,
  whitelist: ['enabled'],
};

export const rootPersistConfig = {
  key: 'root',
  version: PERSIST_VERSION,
  storage: AsyncStorage,
  /* Only these reach disk; the nested configs narrow them further. */
  whitelist: ['auth', 'biometric', 'color', 'language'],
};

const combineReducer = combineReducers({
  auth: persistReducer(authPersistConfig, auth),
  biometric: persistReducer(biometricPersistConfig, biometric),
  color,
  common,
  language,
  orders,
  socket,
});

export default combineReducer;
