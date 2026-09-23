/**
 * Supplier Portal — frontend-only prototype.
 * Mock data throughout: no backend, no real file storage.
 *
 * The provider stack, outermost first, and why each sits where it does:
 *
 *  1. GestureHandlerRootView — gestures (bottom sheet, drawer, swipes)
 *     only register inside it, so it wraps everything, modals included.
 *  2. SafeAreaProvider — insets are read by the app bar, the dock, the
 *     tab bar, the toast and the bottom sheet.
 *  3. KeyboardProvider — tracks the keyboard for `Screen`'s avoiding view.
 *  4. Redux Provider → PersistGate — the store, held back from rendering
 *     until the persisted session and preferences are restored, so a
 *     signed-in user never sees the login screen flash first.
 *  5. BottomSheetModalProvider — sheets present above the navigator.
 *  6. ToastProvider — above the navigator, so any screen can toast and
 *     the toast draws over every screen.
 *  7. ClockDriver + AppNavigation — the one timer, and the
 *     NavigationContainer with the auth-gated stack.
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import CustomStatusBar from './src/components/atoms/CustomStatusBar';
import { ToastProvider } from './src/components/molecules/Toast';
import AppNavigation from './src/navigation/appNavigation';
import { setApiEventHandlers } from './src/resources/axios/AxiosInterceptorFunction';
import ClockDriver from './src/store/ClockDriver';
import OrdersPoller from './src/store/OrdersPoller';
import defaultStore, { persistor as defaultPersistor } from './src/store';
import { restoreSession, signOut } from './src/store/auth/authSlice';
import { colors } from './src/theme/tokens';

/**
 * `store` and `persistor` are injectable so tests can mount the real app
 * against a fresh store; the app itself uses the defaults.
 */
function App({ store = defaultStore, persistor = defaultPersistor }) {
  useEffect(
    () =>
      setApiEventHandlers({
        /* A refresh token that no longer works is a sign-out, not an error screen. */
        onUnauthorized: () => store.dispatch(signOut()),
      }),
    [store],
  );

  useEffect(() => {
    /* A stored token, if any, is checked against the API on launch. */
    store.dispatch(restoreSession());
  }, [store]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <CustomStatusBar barStyle="light-content" />
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <BottomSheetModalProvider>
                <ToastProvider>
                  <ClockDriver />
                  <OrdersPoller />
                  <AppNavigation />
                </ToastProvider>
              </BottomSheetModalProvider>
            </PersistGate>
          </Provider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appBg },
});

export default App;
