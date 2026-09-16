/* eslint-env jest */
/** Stand-in for an icon-font component: renders the glyph name as text. */
const React = require('react');
const { Text } = require('react-native');

function MockIcon({ name, ...props }) {
  return React.createElement(Text, props, name);
}

module.exports = { __esModule: true, default: MockIcon };
