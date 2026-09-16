/* eslint-env jest */
/**
 * Native modules do not exist under Jest, so every library that reaches
 * for one is mocked here. Where the library ships its own mock it is
 * used; the hand-written ones below cover libraries that do not, and are
 * kept to the calls the app actually makes.
 */

/*
 * SafeAreaProvider withholds its children until it has measured the
 * window, which never happens without a host view — so the whole app
 * renders as null in tests. The library ships a mock with fixed insets
 * for exactly this.
 */
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

/*
 * Reanimated 4.6 picks its `initializers.native` module under this Jest
 * preset, which registers a CSS event handler on the JS fallback module —
 * and the JS fallback throws on that call. Nothing under test animates,
 * so the initializer is stubbed and the library's own mock does the rest.
 */
jest.mock('react-native-reanimated/src/initializers', () => ({
  initializeReanimatedModule: () => {},
}));
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock'),
);

jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

jest.mock('react-native-permissions', () =>
  require('react-native-permissions/mock'),
);

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

/* An in-memory keychain, so sign-in and the token helpers behave. */
jest.mock('react-native-keychain', () => {
  const entries = new Map();
  const key = options => options?.service ?? 'default';
  return {
    ACCESSIBLE: {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
    },
    ACCESS_CONTROL: { BIOMETRY_CURRENT_SET: 'BiometryCurrentSet' },
    BIOMETRY_TYPE: {
      FACE_ID: 'FaceID',
      TOUCH_ID: 'TouchID',
      FINGERPRINT: 'Fingerprint',
    },
    setGenericPassword: jest.fn(async (username, password, options) => {
      entries.set(key(options), { username, password });
      return { service: key(options), storage: 'mock' };
    }),
    getGenericPassword: jest.fn(async options => {
      const entry = entries.get(key(options));
      return entry
        ? { ...entry, service: key(options), storage: 'mock' }
        : false;
    }),
    hasGenericPassword: jest.fn(async options => entries.has(key(options))),
    resetGenericPassword: jest.fn(async options =>
      entries.delete(key(options)),
    ),
    getSupportedBiometryType: jest.fn(async () => null),
  };
});

jest.mock('react-native-image-crop-picker', () => ({
  __esModule: true,
  default: {
    openCamera: jest.fn(),
    openPicker: jest.fn(),
    clean: jest.fn(async () => {}),
  },
}));

jest.mock('react-native-video', () => {
  const { View } = require('react-native');
  const Video = props =>
    require('react').createElement(View, { ...props, testID: 'video' });
  return { __esModule: true, default: Video, Video };
});

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  const WebView = props =>
    require('react').createElement(View, { ...props, testID: 'webview' });
  return { __esModule: true, default: WebView, WebView };
});

jest.mock('@callstack/liquid-glass', () => {
  const { View } = require('react-native');
  return {
    LiquidGlassView: View,
    LiquidGlassContainerView: View,
    isLiquidGlassSupported: false,
  };
});

/* The icon fonts load through a native module; a Text stands in. */
jest.mock('@react-native-vector-icons/ionicons/static', () =>
  require('./test-utils/mockIconFont'),
);
jest.mock('@react-native-vector-icons/feather/static', () =>
  require('./test-utils/mockIconFont'),
);
jest.mock('@react-native-vector-icons/material-design-icons/static', () =>
  require('./test-utils/mockIconFont'),
);
