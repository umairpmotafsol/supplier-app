/**
 * How the navigators look and move, kept out of the navigators so the
 * JSX in `appNavigation.js` reads as the route structure and nothing
 * else.
 *
 * Every value here is the one the app shipped with before the move: the
 * dark navigation theme built on the design tokens, headerless screens
 * that slide in from the right, and the tab bar's icons.
 */
import { DarkTheme } from '@react-navigation/native';

import { colors } from '../theme/tokens';
import { TAB_ROUTES } from './routes';

/**
 * Whether the signed-in landing page sits inside a side drawer. Off: see
 * `DrawerNavigator.js` for why, and what turning it on changes.
 */
export const USE_DRAWER = false;

/** React Navigation's theme, mapped onto the app's own colours. */
export const navigationTheme = {
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

/** The root stack: no native header (each screen draws its own app bar). */
export const rootStackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: colors.appBg },
};

/** The supplier's tabs: the custom TabBar draws everything. */
export const tabScreenOptions = {
  headerShown: false,
  sceneStyle: { backgroundColor: colors.appBg },
};

/** Tab titles, in display order. */
export const TAB_OPTIONS = {
  [TAB_ROUTES.ORDERS]: { title: 'Orders' },
  [TAB_ROUTES.DASHBOARD]: { title: 'Dashboard' },
};

/** Which sprite glyph each tab shows. */
export const TAB_ICONS = {
  [TAB_ROUTES.ORDERS]: 'clipboard',
  [TAB_ROUTES.DASHBOARD]: 'home',
};

/** Drawer styling, matched to the app bar. */
export const drawerScreenOptions = {
  headerShown: false,
  drawerType: 'front',
  overlayColor: 'rgba(0,0,0,0.66)',
  drawerStyle: {
    backgroundColor: colors.appBar,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  sceneStyle: { backgroundColor: colors.appBg },
};
