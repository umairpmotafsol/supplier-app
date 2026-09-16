/**
 * Every route name in the app.
 *
 * Screens navigate with these constants rather than string literals, so a
 * renamed route is one edit here and a typo is an `undefined` that fails
 * loudly instead of a silent no-op navigation.
 *
 * The params each route takes are documented next to it; they are the
 * contract `route.params` is read against on the other end.
 */

/** The root stack. */
export const ROUTES = Object.freeze({
  /**
   * Whichever landing page the session gets: the login screen when
   * signed out, the supplier's tabs, or the admin's monitoring board.
   * No params.
   */
  MAIN: 'Main',
  /** Admin only — the full order history behind today's board. No params. */
  ADMIN_HISTORY: 'AdminHistory',
  /** Supplier only. Params: `{orderId: string}`. */
  ORDER_DETAIL: 'OrderDetail',
  /** Supplier only. Params: `{orderId: string}`. */
  CAPTURE_INVOICE: 'CaptureInvoice',
  /** Supplier only — flagging a Direct Debit order's bank details. Params: `{orderId: string}`. */
  REQUEST_BANK_CHANGES: 'RequestBankChanges',
});

/**
 * The supplier's tabs, nested inside `Main`. Orders is the work;
 * Dashboard is a read-only glance at the same book.
 */
export const TAB_ROUTES = Object.freeze({
  ORDERS: 'Orders',
  DASHBOARD: 'Dashboard',
});

/**
 * The drawer's routes. See `DrawerNavigator.js` for why the drawer is
 * available but not mounted in the current flow.
 */
export const DRAWER_ROUTES = Object.freeze({
  HOME: 'DrawerHome',
});
