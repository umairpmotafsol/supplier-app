module.exports = {
  presets: ['module:@react-native/babel-preset'],
  /*
   * The Worklets plugin rewrites every function marked for the UI thread
   * (Reanimated animations, Gesture Handler callbacks, Keyboard
   * Controller handlers). It has to stay **last** in this list: it reads
   * the output of the plugins before it, so anything appended after it
   * would be applied to code it has already transformed.
   */
  plugins: ['react-native-worklets/plugin'],
};
