/**
 * The supplier's two tabs.
 *
 * Orders is the working screen and stays first, because the job is
 * still "photograph the invoice". Dashboard is the glance — read-only
 * numbers — so it sits second and nothing routes into it.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SupplierHomeScreen from '../screens/SupplierHomeScreen';
import SupplierDashboardScreen from '../screens/SupplierDashboardScreen';
import { TabBar } from '../components/TabBar';
import { TAB_OPTIONS, tabScreenOptions } from './navigationConfig';
import { TAB_ROUTES } from './routes';

const Tab = createBottomTabNavigator();

/*
 * Rendered as an element, not handed over as `tabBar={TabBar}`. The
 * navigator calls this prop during its own render, so passing the
 * function bare would run TabBar's hooks inside the navigator's render
 * rather than its own. Defined at module scope so it is not a new
 * component type on every render.
 */
const renderTabBar = props => <TabBar {...props} />;

export default function BottomNavigator() {
  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={tabScreenOptions}>
      <Tab.Screen
        name={TAB_ROUTES.ORDERS}
        component={SupplierHomeScreen}
        options={TAB_OPTIONS[TAB_ROUTES.ORDERS]}
      />
      <Tab.Screen
        name={TAB_ROUTES.DASHBOARD}
        component={SupplierDashboardScreen}
        options={TAB_OPTIONS[TAB_ROUTES.DASHBOARD]}
      />
    </Tab.Navigator>
  );
}
