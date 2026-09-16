/**
 * An `Image` that behaves while it loads and when it fails.
 *
 * Three things every remote image in the app needs, and none of them
 * belong in a screen:
 *
 *  - a spinner over the space it will occupy, not a blank hole;
 *  - a fallback when the load fails, so a dead link is a neutral tile
 *    rather than an invisible gap;
 *  - the prototype's `mock://` uris treated as "no image yet" instead of
 *    being handed to the loader, which would only fail.
 *
 *   <CustomImage uri={photo.uri} style={styles.shot} rounded />
 *   <CustomImage source={images.mediaPlaceholder} />
 */
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { colors, radius } from '../../theme/tokens';
import { images } from '../../assets/images';

/** The prototype stands in for captured photos with `mock://` uris. */
export const isMockUri = uri =>
  typeof uri === 'string' && uri.startsWith('mock://');

/**
 * @param {object} props
 * @param {string} [props.uri] remote or file:// source
 * @param {number|object} [props.source] a `require`d asset, wins over `uri`
 * @param {number|object} [props.fallback] shown on error
 * @param {boolean} [props.rounded]
 * @param {'cover'|'contain'|'stretch'|'center'} [props.resizeMode]
 */
export default function CustomImage({
  uri,
  source,
  fallback = images.mediaPlaceholder,
  style,
  resizeMode = 'cover',
  rounded,
  onLoadEnd,
  accessibilityLabel,
  ...props
}) {
  const usable = source ?? (uri && !isMockUri(uri) ? { uri } : null);

  const [loading, setLoading] = useState(!!usable);
  const [failed, setFailed] = useState(false);

  const resolved = !usable || failed ? fallback : usable;
  const showSpinner = loading && !failed && !!usable;

  return (
    <View style={[styles.wrap, rounded && styles.rounded, style]}>
      <Image
        {...props}
        source={resolved}
        resizeMode={resizeMode}
        accessibilityLabel={accessibilityLabel}
        style={StyleSheet.absoluteFill}
        onLoadStart={() => setLoading(true)}
        onError={() => {
          setFailed(true);
          setLoading(false);
        }}
        onLoadEnd={() => {
          setLoading(false);
          onLoadEnd?.();
        }}
      />
      {showSpinner ? (
        <View style={[StyleSheet.absoluteFill, styles.centre]}>
          <ActivityIndicator size="small" color={colors.orange} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.surface2,
  },
  rounded: { borderRadius: radius.card },
  centre: { alignItems: 'center', justifyContent: 'center' },
});
