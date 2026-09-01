/**
 * TaxMyMotor Supplier Portal — frontend-only prototype.
 * Mock data throughout: no backend, no real file storage.
 *
 * @format
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import {ToastProvider} from './src/components/Toast';
import {SupplierProvider} from './src/state/SupplierState';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SupplierProvider>
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </SupplierProvider>
    </SafeAreaProvider>
  );
}

export default App;
