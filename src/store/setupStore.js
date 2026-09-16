/**
 * Builds a store. Kept apart from `index.js` so importing it has no side
 * effects: `index.js` also starts redux-persist, which reads storage and
 * arms a rehydrate timeout the moment it is imported. Tests build fresh
 * stores from here without starting any of that.
 */
import { configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
} from 'redux-persist';

import combineReducer, { rootPersistConfig } from './combineReducer';

const persistedReducer = persistReducer(rootPersistConfig, combineReducer);

/**
 * redux-persist dispatches actions carrying non-serialisable callbacks
 * (`register`, `rehydrate`), so they are excluded from the serialisable
 * check rather than switching the check off.
 */
const middleware = getDefaultMiddleware =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  });

export function setupStore(preloadedState) {
  return configureStore({
    reducer: persistedReducer,
    middleware,
    preloadedState,
    devTools: __DEV__,
  });
}

export default setupStore;
