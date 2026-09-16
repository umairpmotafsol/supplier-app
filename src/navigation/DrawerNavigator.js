/**
 * A side drawer around the signed-in landing page.
 *
 * Available, and switched off. The app's flows today are the auth gate,
 * the supplier's two tabs with detail screens pushed over them, and the
 * admin's board — none of which has anywhere a drawer adds something the
 * app bar does not already offer. Mounting one would add an edge swipe
 * and a second route to sign-out, and change the Android back button's
 * behaviour on the landing page (it would close the drawer first).
 *
 * So it is wired but gated behind `USE_DRAWER` in `navigationConfig.js`.
 * Flipping that one flag puts it in `appNavigation.js`'s `Main` route
 * with nothing else to change.
 */
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import AdminHomeScreen from '../screens/AdminHomeScreen';
import { useSupplier } from '../store/useSupplier';
import { colors, font, s } from '../theme/tokens';
import BottomNavigator from './BottomNavigator';
import CustomDrawerContent from './CustomDrawerContent';
import { drawerScreenOptions } from './navigationConfig';
import { DRAWER_ROUTES } from './routes';

const Drawer = createDrawerNavigator();

const renderDrawerContent = props => <CustomDrawerContent {...props} />;

export default function DrawerNavigator() {
  const { isAdmin } = useSupplier();

  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={{
        ...drawerScreenOptions,
        drawerActiveTintColor: colors.orange,
        drawerInactiveTintColor: colors.ink2,
        drawerActiveBackgroundColor: colors.orangeSoft,
        drawerLabelStyle: { fontFamily: font.semibold, fontSize: s(11.5) },
      }}
    >
      <Drawer.Screen
        name={DRAWER_ROUTES.HOME}
        component={isAdmin ? AdminHomeScreen : BottomNavigator}
        options={{ title: isAdmin ? "Today's board" : 'Orders' }}
      />
    </Drawer.Navigator>
  );
}
