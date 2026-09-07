import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

/**
 * One stack. `Main` is whichever landing page the signed-in role gets:
 * the supplier's tabs, or the admin's monitoring view.
 */
export type RootStackParamList = {
  Main: undefined;
  /** Admin only — the full order history behind today's board. */
  AdminHistory: undefined;
  OrderDetail: {orderId: string};
  CaptureInvoice: {orderId: string};
  /** Supplier only — flagging a Direct Debit order's bank details. */
  RequestBankChanges: {orderId: string};
};

export type RootNav = NativeStackNavigationProp<RootStackParamList>;

/**
 * The supplier's tabs, nested inside `Main`. Orders is the work;
 * Dashboard is a read-only glance at the same book.
 */
export type SupplierTabParamList = {
  Orders: undefined;
  Dashboard: undefined;
};
