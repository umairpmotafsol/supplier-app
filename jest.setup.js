/* eslint-env jest */
/**
 * SafeAreaProvider withholds its children until it has measured the
 * window, which never happens without a host view — so the whole app
 * renders as null in tests. The library ships a mock with fixed insets
 * for exactly this.
 */
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
