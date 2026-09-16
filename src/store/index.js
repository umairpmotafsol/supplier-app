/**
 * The app's store, and the persistor that rehydrates it.
 *
 * Importing this module starts persistence. Code that only needs a store
 * of its own (tests) should import `setupStore` from `./setupStore`.
 */
import { persistStore } from 'redux-persist';

import { setupStore } from './setupStore';

export { setupStore };

export const store = setupStore();

export const persistor = persistStore(store);

export default store;
