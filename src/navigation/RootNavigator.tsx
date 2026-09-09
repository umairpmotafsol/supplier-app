/**
 * One stack, gated on the session.
 *
 * Signed out you get the login screen. Signed in, the landing page is
 * chosen by role: a supplier gets Orders and Dashboard as tabs, an
 * admin gets their monitoring board, which is already a dashboard.
 */
import React from 'react';
import {DarkTheme, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {colors} from '../theme/tokens';
import LoginScreen from '../screens/LoginScreen';
import SupplierTabs from './SupplierTabs';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import AdminHistoryScreen from '../screens/AdminHistoryScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import CaptureInvoiceScreen from '../screens/CaptureInvoiceScreen';
import RequestBankChangesScreen from '../screens/RequestBankChangesScreen';
import {OrderAlertModal} from '../components/OrderAlertModal';
import {useSupplier} from '../state/SupplierState';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.appBg,
    card: colors.appBar,
    border: colors.line,
    primary: colors.orange,
    text: colors.ink,
  },
};

export default function RootNavigator() {
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
  const navRef = React.useRef<{
    navigate: (name: string, params?: object) => void;
  } | null>(null);

  return (
    <NavigationContainer
      theme={theme}
      ref={ref => {
        navRef.current = ref as never;
      }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {backgroundColor: colors.appBg},
        }}>
        {!session ? (
          <Stack.Screen name="Main" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={isAdmin ? AdminHomeScreen : SupplierTabs}
            />
            {/*
             * An admin gets history instead of order detail: their view
             * is a list, with no per-order screen to drill into.
             */}
            {isAdmin ? (
              <Stack.Screen
                name="AdminHistory"
                component={AdminHistoryScreen}
              />
            ) : (
              <>
                <Stack.Screen
                  name="OrderDetail"
                  component={OrderDetailScreen}
                />
                <Stack.Screen
                  name="CaptureInvoice"
                  component={CaptureInvoiceScreen}
                />
                <Stack.Screen
                  name="RequestBankChanges"
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
          navRef.current?.navigate('CaptureInvoice', {orderId: order.id});
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
