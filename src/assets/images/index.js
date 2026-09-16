/**
 * Every bundled image, in one place.
 *
 * Screens import from here rather than writing `require('../../assets/
 * images/thing.png')` inline: Metro needs a static literal path, so a
 * require scattered through the screens cannot be renamed or audited,
 * and a typo in one is a red box at runtime rather than an error here.
 *
 * The app is drawn rather than illustrated — the icons are SVG paths and
 * the surfaces are gradients — so there is exactly one raster asset: the
 * neutral tile `CustomImage` shows while a remote image loads, and
 * instead of it if the image fails or the uri is one of the prototype's
 * `mock://` invoice placeholders.
 *
 * The app's *fonts* are not here: they are linked natively from
 * `assets/fonts` (see `react-native.config.js`) and referenced by family
 * name through `theme/tokens.js`.
 */

export const images = {
  /** Neutral surface-coloured tile: placeholder, loading and error state. */
  mediaPlaceholder: require('./media-placeholder.png'),
};

export default images;
