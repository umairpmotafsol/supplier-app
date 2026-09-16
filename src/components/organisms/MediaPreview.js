/**
 * Shows what was picked, whatever it is, and lets it be removed.
 *
 *  - images render through `CustomImage` (spinner, fallback, and the
 *    prototype's `mock://` uris handled);
 *  - videos play inline with native controls, paused until tapped — a
 *    preview that starts making noise is not a preview;
 *  - PDFs render in a WebView, which both platforms can do natively;
 *  - anything else gets a file tile with its name and size, because a
 *    blank box that "might be loading" is worse than saying what it is.
 *
 * Removing asks first (`AreYouSure`): the asset came from a camera or a
 * file the user may not be able to find again.
 *
 *   <MediaPreview asset={invoice} onRemove={() => setInvoice(null)} />
 */
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Video from 'react-native-video';
import { WebView } from 'react-native-webview';

import { colors, radius, s } from '../../theme/tokens';
import CustomImage from '../atoms/CustomImage';
import CustomText from '../atoms/CustomText';
import Icon, { iconSize } from '../atoms/Icon';
import AreYouSure from '../molecules/AreYouSure';
import {
  formatBytes,
  isImageMime,
  isPdfMime,
  isVideoMime,
  toMediaAsset,
} from '../../resources/utils/helper';

/** Which renderer an asset gets. Exported for tests and callers. */
export function previewKind(asset) {
  const { type, uri } = toMediaAsset(asset);
  if (uri.startsWith('mock://') || isImageMime(type)) {
    return 'image';
  }
  if (isVideoMime(type)) {
    return 'video';
  }
  if (isPdfMime(type)) {
    return 'pdf';
  }
  return 'file';
}

/**
 * @param {object} props
 * @param {object} props.asset anything a picker returned, or `{uri, type}`
 * @param {() => void} [props.onRemove] omit to hide the remove button
 * @param {number} [props.height]
 * @param {boolean} [props.confirmRemove] ask before removing (default true)
 */
export default function MediaPreview({
  asset,
  onRemove,
  height = s(220),
  confirmRemove = true,
  style,
}) {
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!asset) {
    return null;
  }

  const media = toMediaAsset(asset);
  const kind = failed ? 'file' : previewKind(media);

  const requestRemove = () => {
    if (confirmRemove) {
      setConfirming(true);
    } else {
      onRemove?.();
    }
  };

  return (
    <View style={[styles.frame, { height }, style]}>
      {kind === 'image' ? (
        <CustomImage
          uri={media.uri}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          accessibilityLabel={media.name}
        />
      ) : null}

      {kind === 'video' ? (
        <Video
          source={{ uri: media.uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          controls
          paused
          onError={() => setFailed(true)}
        />
      ) : null}

      {kind === 'pdf' ? (
        <WebView
          source={{ uri: media.uri }}
          style={styles.web}
          originWhitelist={['file://*', 'content://*', 'https://*']}
          /* A picked PDF is a local file; both platforms need leave to read it. */
          allowFileAccess
          allowingReadAccessToURL={
            Platform.OS === 'ios' ? media.uri : undefined
          }
          onError={() => setFailed(true)}
        />
      ) : null}

      {kind === 'file' ? (
        <View style={styles.file}>
          <Icon name="doc" size={s(40)} color={colors.ink3} strokeWidth={1.4} />
          <CustomText variant="label" numberOfLines={1} center>
            {media.name}
          </CustomText>
          {media.size ? (
            <CustomText variant="sub" style={styles.size}>
              {formatBytes(media.size)}
            </CustomText>
          ) : null}
        </View>
      ) : null}

      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove"
          hitSlop={s(8)}
          onPress={requestRemove}
          style={styles.remove}
        >
          <Icon
            family="feather"
            name="x"
            size={iconSize.sm}
            color={colors.ink}
          />
        </Pressable>
      ) : null}

      <AreYouSure
        visible={confirming}
        title="Remove this?"
        message="You will have to pick it again."
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          setConfirming(false);
          onRemove?.();
        }}
        onCancel={() => setConfirming(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.black,
    overflow: 'hidden',
  },
  web: { flex: 1, backgroundColor: colors.surface },
  file: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingHorizontal: s(16),
    backgroundColor: colors.surface,
  },
  size: { marginBottom: 0 },
  remove: {
    position: 'absolute',
    top: s(8),
    right: s(8),
    width: s(28),
    height: s(28),
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: colors.line,
  },
});
