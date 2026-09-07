/**
 * The supplier's two tabs.
 *
 * Orders is the working screen and stays first, because the job is
 * still "photograph the invoice". Dashboard is the glance — read-only
 * numbers — so it sits second and nothing routes into it.
 */
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import SupplierHomeScreen from '../screens/SupplierHomeScreen';
import SupplierDashboardScreen from '../screens/SupplierDashboardScreen';
import {TabBar} from '../components/TabBar';
import {colors} from '../theme/tokens';
import type {SupplierTabParamList} from './types';

const Tab = createBottomTabNavigator<SupplierTabParamList>();

export default function SupplierTabs() {
  return (
    <Tab.Navigator
      /*
       * Rendered as an element, not handed over as `tabBar={TabBar}`.
       * The navigator calls this prop during its own render, so passing
       * the function bare would run TabBar's hooks inside the
       * navigator's render rather than its own. TabBar is defined at
       * module scope, so the arrow creates no new component type.
       */
      // eslint-disable-next-line react/no-unstable-nested-components
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {backgroundColor: colors.appBg},
      }}>
      <Tab.Screen
        name="Orders"
        component={SupplierHomeScreen}
        options={{title: 'Orders'}}
      />
      <Tab.Screen
        name="Dashboard"
        component={SupplierDashboardScreen}
        options={{title: 'Dashboard'}}
      />
    </Tab.Navigator>
  );
}
