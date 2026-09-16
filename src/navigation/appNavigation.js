/**
 * The navigation root: one stack, gated on the session.
 *
 * Signed out you get the login screen. Signed in, the landing page is
 * chosen by role: a supplier gets Orders and Dashboard as tabs, an
 * admin gets their monitoring board, which is already a dashboard.
 *
 * The detail screens are pushed onto this root stack, *over* the tabs,
 * which is what hides the tab bar on them: the tab navigator is simply
 * underneath.
 */
import React from 'react';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import AdminHistoryScreen from '../screens/AdminHistoryScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import CaptureInvoiceScreen from '../screens/CaptureInvoiceScreen';
import RequestBankChangesScreen from '../screens/RequestBankChangesScreen';
import { OrderAlertModal } from '../components/OrderAlertModal';
import { useSupplier } from '../store/useSupplier';
import BottomNavigator from './BottomNavigator';
import DrawerNavigator from './DrawerNavigator';
import {
  USE_DRAWER,
  navigationTheme,
  rootStackScreenOptions,
} from './navigationConfig';
import { ROUTES } from './routes';

const Stack = createNativeStackNavigator();

/**
 * For navigating from outside a screen — the alerts below are mounted
 * beside the stack, not in it, so they have no `navigation` prop.
 */
export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export default function AppNavigation() {
  const {
    session,
    isAdmin,
    newOrder,
    readyToSend,
    now,
    dismissNewOrder,
    dismissReadyToSend,
    sendInvoice,
  } = useSupplier();

  return (
    <NavigationContainer theme={navigationTheme} ref={navigationRef}>
      <Stack.Navigator screenOptions={rootStackScreenOptions}>
        {!session ? (
          <Stack.Screen name={ROUTES.MAIN} component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen
              name={ROUTES.MAIN}
              component={
                USE_DRAWER
                  ? DrawerNavigator
                  : isAdmin
                  ? AdminHomeScreen
                  : BottomNavigator
              }
            />
            {/*
             * An admin gets history instead of order detail: their view
             * is a list, with no per-order screen to drill into.
             */}
            {isAdmin ? (
              <Stack.Screen
                name={ROUTES.ADMIN_HISTORY}
                component={AdminHistoryScreen}
              />
            ) : (
              <>
                <Stack.Screen
                  name={ROUTES.ORDER_DETAIL}
                  component={OrderDetailScreen}
                />
                <Stack.Screen
                  name={ROUTES.CAPTURE_INVOICE}
                  component={CaptureInvoiceScreen}
                />
                <Stack.Screen
                  name={ROUTES.REQUEST_BANK_CHANGES}
                  component={RequestBankChangesScreen}
                />
              </>
            )}
          </>
        )}
      </Stack.Navigator>

      {/*
       * Both alerts live outside the stack so they interrupt whatever
       * screen you are on, the way a push notification would.
       */}
      <OrderAlertModal
        order={newOrder}
        now={now}
        eyebrow="NEW ORDER ASSIGNED TO YOU"
        actionLabel="Upload Invoice"
        actionIcon="camera"
        onAction={order => {
          dismissNewOrder();
          navigate(ROUTES.CAPTURE_INVOICE, { orderId: order.id });
        }}
        onDismiss={dismissNewOrder}
      />

      {/*
       * The admin's half of the WhatsApp flow: the supplier has uploaded,
       * so this order needs sending. The button goes straight to the
       * phone's share sheet — there is no order screen in between.
       */}
      <OrderAlertModal
        order={readyToSend}
        now={now}
        eyebrow="READY TO SEND VIA WHATSAPP"
        icon="whatsapp"
        showCustomer
        actionLabel="Send via WhatsApp"
        actionIcon="whatsapp"
        onAction={order => {
          dismissReadyToSend();
          sendInvoice(order.id);
        }}
        onDismiss={dismissReadyToSend}
      />
    </NavigationContainer>
  );
}
