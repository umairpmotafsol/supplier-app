/** Shared one-liner styles, so layout tweaks stay out of JSX. */
import {StyleSheet} from 'react-native';

import {CONTENT_MAX, IS_TABLET, s} from './tokens';

export const common = StyleSheet.create({
  spacer: {flex: 1},
  fill: {flex: 1, minWidth: 0},
  row: {flexDirection: 'row'},
  rowEnd: {alignItems: 'flex-end'},
  flush: {marginBottom: 0},
  centered: {justifyContent: 'center'},
  textCenter: {textAlign: 'center'},
  absolute: {position: 'absolute'},
  uppercase: {textTransform: 'uppercase'},
  transparent: {backgroundColor: 'transparent'},
  hairline: {borderWidth: 1},
  tiles: {flexDirection: 'row', gap: s(10), marginBottom: s(16)},
});

/**
 * Centres a content column on tablets and does nothing on phones, so
 * the same screens serve both without a second layout.
 */
export const column = IS_TABLET
  ? ({width: '100%', maxWidth: CONTENT_MAX, alignSelf: 'center'} as const)
  : null;
