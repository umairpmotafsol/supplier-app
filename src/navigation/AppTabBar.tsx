/**
 * Adapter between React Navigation's tab navigator and the designed
 * `BottomNav`. Keeping BottomNav presentational means the design file
 * stays free of navigation concerns.
 */
import React from 'react';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

import BottomNav, {TabKey} from '../components/BottomNav';

export default function AppTabBar({state, navigation}: BottomTabBarProps) {
  const route = state.routes[state.index];
  const active = route.name.replace('Tab', '') as TabKey;

  const onNavigate = (key: TabKey) => {
    navigation.navigate((key + 'Tab') as never);
  };

  return <BottomNav active={active} onNavigate={onNavigate} />;
}
