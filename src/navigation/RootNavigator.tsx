import React from 'react';
import {DarkTheme, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {colors} from '../theme/tokens';
import DashboardScreen from '../screens/DashboardScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import AppTabBar from './AppTabBar';
import type {MainTabParamList, RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

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

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={AppTabBar}
      screenOptions={{
        headerShown: false,
        sceneStyle: {backgroundColor: colors.appBg},
      }}>
      <Tab.Screen name="DashboardTab" component={DashboardScreen} />
      <Tab.Screen name="OrdersTab" component={OrdersScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {backgroundColor: colors.appBg},
        }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
