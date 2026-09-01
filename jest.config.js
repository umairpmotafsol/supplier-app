module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  /**
   * React Navigation, react-native-screens and react-native-svg all ship
   * untranspiled ESM, so they have to go through Babel like react-native
   * itself does.
   */
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|react-native|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-svg)/)',
  ],
};
