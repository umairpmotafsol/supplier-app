module.exports = {
  preset: 'react-native',
  setupFiles: [
    '<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js',
    '<rootDir>/node_modules/@react-native-documents/picker/jest/build/jest/setup.js',
    '<rootDir>/jest.setup.js',
  ],
  /**
   * These libraries ship untranspiled ESM (or JSX), so they have to go
   * through Babel like react-native itself does.
   */
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native[^/]*|react-native[^/]*|@react-navigation|@reduxjs|react-redux|redux[^/]*|@gorhom|@callstack|immer|reselect)/)',
  ],
};
