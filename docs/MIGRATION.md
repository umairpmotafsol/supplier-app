# Migration: TypeScript / RN 0.87 → JavaScript boilerplate / RN 0.83

## 1. Architecture before the migration (commit 2e6de5a)

- **Runtime**: React Native 0.87.1, React 19.2.3, TypeScript, New Architecture + Hermes,
  Android edge-to-edge on, iPhone portrait / iPad all orientations.
- **Entry**: `index.js` → `App.tsx` → `SafeAreaProvider` → `StatusBar` →
  `SupplierProvider` (context store) → `ToastProvider` → `RootNavigator`.
- **State** (`src/state/SupplierState.tsx`): one React context holding
  - `session` (signed-in `Account`, supplier or admin),
  - `orders` (seeded from `INITIAL_ORDERS`), `now` (1 s tick),
  - `newOrderId` (supplier's New Order alert), `readyToSendId` (admin's WhatsApp alert),
  - actions: `signIn`, `signOut`, `uploadInvoice`, `requestBankChanges`,
    `approveBankDetails`, `simulateCustomerBankUpdate`, `markDelivered`,
    `sendInvoice` (share sheet), `simulateNewOrder`,
  - derived: `isAdmin`, `visibleOrders`, `newOrder`, `readyToSend`,
    `whatsappQueue`, `bankQueue`,
  - the 1 s interval that flips late orders to `overdue` (paused while a
    Direct Debit order is with the customer).
- **Navigation** (`src/navigation`): one native stack, `slide_from_right`, no headers.
  - Signed out: `Main` = `LoginScreen`.
  - Supplier: `Main` = `SupplierTabs` (custom `TabBar`: **Orders**, **Dashboard**),
    plus `OrderDetail`, `CaptureInvoice`, `RequestBankChanges` pushed over the
    tabs (so the tab bar is hidden on those screens).
  - Admin: `Main` = `AdminHomeScreen`, plus `AdminHistory`.
  - Two `OrderAlertModal`s mounted beside the stack (New Order, Ready to send).
- **Design system**: `src/theme/tokens.ts` (scale `s()`, colours, fonts, radius,
  type, layout, tablet column), `src/theme/common.ts`; custom SVG icon sprite;
  UI kit in `src/components/ui.tsx`; bundled Archivo/Inter/Oswald fonts.
- **Mock seams**: `src/data/mock.ts` (accounts, suppliers, routing, seed orders,
  rules), `src/lib/camera.ts` (fake shutter), `src/lib/share.ts` (real `Share`).
- **Tests**: `__tests__/App.test.tsx` (smoke), `flow.test.tsx` (routing, sign-in,
  timer, lifecycle, WhatsApp hand-off, share sheet, admin board, dashboard tab
  via real navigator, bank review), `tablet.test.tsx` (iPad column).

> The migration brief also mentions Home/Orders/Refer/Settings tabs, a checkout
> stack, onboarding and delivery preferences. Those do not exist in this
> repository; the behaviours actually present (above) are what is preserved.

## 2. File-by-file map

| Old | New | Notes |
| --- | --- | --- |
| `App.tsx` | `App.js` | Root providers: GestureHandlerRootView → SafeAreaProvider → KeyboardProvider → Redux Provider → PersistGate → BottomSheetModalProvider → ToastProvider → ClockDriver + navigation |
| `index.js` | `index.js` | `import 'react-native-gesture-handler'` first |
| `src/state/SupplierState.tsx` | `src/store/orders/ordersSlice.js`, `src/store/auth/authSlice.js`, `src/store/common/commonSlice.js`, `src/store/selectors.js`, `src/store/useSupplier.js`, `src/store/ClockDriver.js` | Context → Redux Toolkit; `useSupplier()` keeps the same shape over Redux |
| — | `src/store/index.js`, `src/store/setupStore.js`, `src/store/combineReducer.js` | configureStore + redux-persist (`setupStore` is side-effect free for tests) |
| — | `src/store/{biometric,color,language,socket}/*Slice.js` | New preference / connection slices |
| `src/data/mock.ts` | `src/data/mock.js` | Types → JSDoc typedefs; every export kept |
| `src/theme/tokens.ts` | `src/theme/tokens.js` | Unchanged values |
| `src/theme/common.ts` | `src/theme/common.js` | Unchanged values |
| `src/lib/camera.ts` | `src/lib/camera.js` | Mock shutter kept |
| `src/lib/share.ts` | `src/lib/share.js` | |
| `src/components/Icon.tsx` | `src/components/atoms/Icon.js` | SVG sprite kept; adds vector-icon families |
| `src/components/ui.tsx` (Cta) | `src/components/atoms/CustomButton.js` | `Cta` re-exported from `ui.js` |
| `src/components/ui.tsx` (H1/H2/H3/Sub/Eyebrow) | `src/components/atoms/CustomText.js` | Same styles as variants; wrappers kept in `ui.js` |
| — | `src/components/atoms/CustomImage.js`, `CustomStatusBar.js` | |
| `src/components/ui.tsx` (rest) | `src/components/ui.js` | Card, StatTile, Plate, Field, Input, Row2, Banner, Hint, Badge, List, ListItem, SummaryRow |
| `src/components/AppBar.tsx` | `src/components/molecules/CustomHeader.js` | Default export + `IconButton` |
| `src/components/OrderAlertModal.tsx` | `src/components/OrderAlertModal.js` | Now built on `molecules/ModalSkeleton` |
| `src/components/Toast.tsx` | `src/components/molecules/Toast.js` | Adds imperative `showToast()` for non-React code |
| — | `src/components/molecules/{CustomBottomSheet,ModalSkeleton,PopUp,AreYouSure}.js` | |
| — | `src/components/organisms/{MediaPicker,MediaPreview}.js` | |
| `src/components/{AdminOrderRow,BankPanel,Countdown,Gradient,OrderCard,TabBar}.tsx` | same names, `.js` | TabBar icons now come from `navigationConfig` |
| `src/components/Screen.tsx` | `src/components/Screen.js` | Uses Keyboard Controller's `KeyboardAvoidingView` (`padding`) — required once `KeyboardProvider` + edge-to-edge stop the Android window resizing |
| `src/navigation/RootNavigator.tsx` | `src/navigation/appNavigation.js` | Auth gate + role routing + alert modals |
| `src/navigation/SupplierTabs.tsx` | `src/navigation/BottomNavigator.js` | |
| `src/navigation/types.ts` | `src/navigation/routes.js` | Param lists → route constants |
| — | `src/navigation/navigationConfig.js` | Theme, stack/tab screen options |
| — | `src/navigation/{DrawerNavigator,CustomDrawerContent}.js` | Implemented; gated off by `USE_DRAWER = false` in `navigationConfig.js` (mounting it would change existing flows) |
| `src/screens/*.tsx` | `src/screens/*.js` | Same UI; imports updated |
| — | `src/resources/axios/AxiosInterceptorFunction.js` | |
| — | `src/resources/utils/{apiConfig,apiUrl,helper,permissions,uploadMediaHook}.js` | |
| — | `src/security/keychainService.js` | |
| — | `src/assets/images/index.js` | |
| `__tests__/App.test.tsx` | `__tests__/App.test.js` | Also asserts PersistGate lets the app through |
| `__tests__/flow.test.tsx` | `__tests__/flow.test.js` | Same 28 tests, mounted on a fresh Redux store |
| `__tests__/tablet.test.tsx` | `__tests__/tablet.test.js` | Unchanged |
| — | `__tests__/store.test.js`, `__tests__/resources.test.js` | Persistence, clock, alerts, API-not-configured, permissions, picker outcomes |
| — | `test-utils/SupplierTestProvider.js`, `test-utils/mockIconFont.js` | Test harness |
| — | `src/assets/images/{index.js,media-placeholder.png}` | CustomImage placeholder |
| `tsconfig.json` | removed | |
| `package.json` | `package.json` | RN 0.83.10 / React 19.2.0; TypeScript, `@types/*`, `@react-native/typescript-config`, `@react-native/jest-preset` and the unused `@react-native/new-app-screen` removed |
| `jest.config.js`, `jest.setup.js`, `babel.config.js` | updated | Worklets plugin last; native mocks |
