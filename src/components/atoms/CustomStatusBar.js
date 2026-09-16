/**
 * The status bar.
 *
 * The app is drawn dark throughout, so the default is light content on
 * the app-bar colour — which is what `App.js` mounted inline before.
 * Having it as a component means a screen that needs something else (a
 * full-bleed viewfinder, say) can say so in its own JSX.
 *
 * Android only: `backgroundColor` is ignored under edge-to-edge (which
 * this app enables), where the system bar is transparent by design and
 * the content behind it shows through.
 */
import React from 'react';
import { Platform, StatusBar } from 'react-native';

import { colors } from '../../theme/tokens';

/**
 * @param {object} props
 * @param {'light-content' | 'dark-content'} [props.barStyle]
 * @param {string} [props.backgroundColor] Android, non-edge-to-edge only
 * @param {boolean} [props.translucent] Android
 * @param {boolean} [props.hidden]
 */
export default function CustomStatusBar({
  barStyle = 'light-content',
  backgroundColor = colors.appBar,
  translucent = true,
  hidden = false,
  animated = true,
}) {
  return (
    <StatusBar
      barStyle={barStyle}
      hidden={hidden}
      animated={animated}
      {...(Platform.OS === 'android' ? { backgroundColor, translucent } : null)}
    />
  );
}
