/**
 * "Add a photo / video / document": a bottom sheet of sources, the
 * permission dance, and the native picker behind each source.
 *
 * Every outcome a picker can have is handled here rather than in the
 * screen that wanted a photo:
 *
 *  - **cancelled** — the user backed out. Nothing happens, and in
 *    particular no error is shown: backing out is not a failure;
 *  - **blocked** — the permission is off for good. The OS will not ask
 *    again, so a PopUp offers the Settings app instead of a dead button;
 *  - **denied** — refused this time. Quietly stops; the next tap asks
 *    again;
 *  - **error** — anything else (no camera on the simulator, low memory).
 *    Reported through `onError`, and shown as a toast by default.
 *
 * The headless `pickMedia()` does the same work without the UI, for a
 * caller that already knows which source it wants.
 *
 *   <MediaPicker
 *     visible={adding}
 *     onClose={() => setAdding(false)}
 *     onPick={([asset]) => setInvoice(asset)}
 *     sources={['camera', 'library']}
 *   />
 */
import React, { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';

import { colors, font, radius, s } from '../../theme/tokens';
import CustomText from '../atoms/CustomText';
import Icon, { iconSize } from '../atoms/Icon';
import CustomBottomSheet from '../molecules/CustomBottomSheet';
import PopUp from '../molecules/PopUp';
import { showToast } from '../molecules/Toast';
import {
  PERMISSION_STATUS,
  blockedMessage,
  openAppSettings,
  requestCameraPermissions,
  requestPermission,
} from '../../resources/utils/permissions';
import { toMediaAsset } from '../../resources/utils/helper';

export const MEDIA_SOURCES = {
  camera: { label: 'Take a photo', icon: 'camera' },
  library: { label: 'Choose from library', icon: 'upload' },
  document: { label: 'Choose a document', icon: 'doc' },
};

/** image-crop-picker's "the user backed out" and permission codes. */
const PICKER_CANCELLED = 'E_PICKER_CANCELLED';
const PICKER_PERMISSION = {
  E_NO_CAMERA_PERMISSION: 'camera',
  E_NO_LIBRARY_PERMISSION: 'photoLibrary',
};

const cropPickerMediaType = mediaType =>
  mediaType === 'any' ? 'any' : mediaType === 'video' ? 'video' : 'photo';

/**
 * Picks from one source, with permissions handled.
 *
 * @param {'camera'|'library'|'document'} source
 * @param {object} [options]
 * @param {'photo'|'video'|'any'} [options.mediaType]
 * @param {boolean} [options.multiple] library and document only
 * @param {boolean} [options.cropping] photos only
 * @returns {Promise<
 *   | {status: 'picked', assets: object[]}
 *   | {status: 'cancelled'}
 *   | {status: 'denied' | 'blocked', permission: string}
 *   | {status: 'error', message: string}
 * >}
 */
export async function pickMedia(source, options = {}) {
  const { mediaType = 'photo', multiple = false, cropping = false } = options;

  try {
    if (source === 'camera') {
      const permission = await requestCameraPermissions({
        withMicrophone: mediaType !== 'photo',
      });
      if (
        permission === PERMISSION_STATUS.denied ||
        permission === PERMISSION_STATUS.blocked
      ) {
        return { status: permission, permission: 'camera' };
      }
      const shot = await ImagePicker.openCamera({
        mediaType: cropPickerMediaType(mediaType),
        cropping: cropping && mediaType === 'photo',
        compressImageQuality: 0.8,
        forceJpg: true,
      });
      return { status: 'picked', assets: [toMediaAsset(shot)] };
    }

    if (source === 'library') {
      const permission = await requestPermission('photoLibrary');
      if (
        permission === PERMISSION_STATUS.denied ||
        permission === PERMISSION_STATUS.blocked
      ) {
        return { status: permission, permission: 'photoLibrary' };
      }
      const picked = await ImagePicker.openPicker({
        mediaType: cropPickerMediaType(mediaType),
        multiple,
        cropping: cropping && !multiple && mediaType === 'photo',
        compressImageQuality: 0.8,
        forceJpg: true,
      });
      const list = Array.isArray(picked) ? picked : [picked];
      return { status: 'picked', assets: list.map(toMediaAsset) };
    }

    if (source === 'document') {
      /* The system document UI needs no runtime permission on either OS. */
      const files = await pick({
        allowMultiSelection: multiple,
        type: [types.pdf, types.images],
      });
      /*
       * A picked document's uri is a content:// grant (Android) or a
       * security-scoped URL (iOS) that can stop working once the picker
       * is gone. Copying it into the app's cache gives a stable file://
       * path that an upload can still read later.
       */
      const copies = await keepLocalCopy({
        files: files.map(file => ({
          uri: file.uri,
          fileName: file.name ?? 'document',
        })),
        destination: 'cachesDirectory',
      });
      const assets = files.map((file, index) => {
        const copy = copies[index];
        return toMediaAsset({
          ...file,
          uri: copy?.status === 'success' ? copy.localUri : file.uri,
        });
      });
      return { status: 'picked', assets };
    }

    return { status: 'error', message: `Unknown media source "${source}"` };
  } catch (error) {
    if (error?.code === PICKER_CANCELLED) {
      return { status: 'cancelled' };
    }
    if (
      isErrorWithCode(error) &&
      error.code === errorCodes.OPERATION_CANCELED
    ) {
      return { status: 'cancelled' };
    }
    /*
     * The native picker can refuse after our own check said yes — the
     * user revoked access from Control Centre in between, say.
     */
    if (PICKER_PERMISSION[error?.code]) {
      return { status: 'blocked', permission: PICKER_PERMISSION[error.code] };
    }
    if (error?.code === 'E_PICKER_CANNOT_RUN_CAMERA_ON_SIMULATOR') {
      return {
        status: 'error',
        message: 'There is no camera on the simulator',
      };
    }
    return {
      status: 'error',
      message: error?.message ?? 'Could not open the picker',
    };
  }
}

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onClose
 * @param {(assets: object[]) => void} props.onPick
 * @param {(message: string) => void} [props.onError] defaults to a toast
 * @param {(keyof typeof MEDIA_SOURCES)[]} [props.sources]
 * @param {'photo'|'video'|'any'} [props.mediaType]
 * @param {boolean} [props.multiple]
 * @param {boolean} [props.cropping]
 * @param {string} [props.title]
 */
export default function MediaPicker({
  visible,
  onClose,
  onPick,
  onError,
  sources = ['camera', 'library', 'document'],
  mediaType = 'photo',
  multiple = false,
  cropping = false,
  title = 'Add media',
}) {
  const [blocked, setBlocked] = useState(null);
  /*
   * The source the user tapped, waiting for the sheet to finish closing.
   * iOS will not present the camera over a view controller that is still
   * animating away, so the picker is launched from the sheet's dismiss
   * callback rather than from the tap.
   */
  const pendingRef = useRef(null);

  const reportError = useCallback(
    message => {
      if (onError) {
        onError(message);
      } else {
        showToast({ message, icon: 'alert' });
      }
    },
    [onError],
  );

  const launch = useCallback(
    async source => {
      const result = await pickMedia(source, { mediaType, multiple, cropping });
      switch (result.status) {
        case 'picked':
          onPick?.(result.assets);
          break;
        case 'blocked':
          setBlocked(result.permission);
          break;
        case 'error':
          reportError(result.message);
          break;
        default:
          /* cancelled / denied: the user chose not to; say nothing. */
          break;
      }
    },
    [cropping, mediaType, multiple, onPick, reportError],
  );

  const handleSheetClosed = useCallback(() => {
    onClose?.();
    const source = pendingRef.current;
    pendingRef.current = null;
    if (source) {
      launch(source);
    }
  }, [launch, onClose]);

  const choose = source => {
    pendingRef.current = source;
    onClose?.();
    /*
     * Android has no presentation conflict, and a sheet that is already
     * closed will not fire its dismiss callback again — launch directly.
     */
    if (Platform.OS === 'android' || !visible) {
      pendingRef.current = null;
      launch(source);
    }
  };

  return (
    <>
      <CustomBottomSheet
        visible={visible}
        onClose={handleSheetClosed}
        title={title}
      >
        {sources.map((source, index) => {
          const option = MEDIA_SOURCES[source];
          if (!option) {
            return null;
          }
          return (
            <Pressable
              key={source}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              onPress={() => choose(source)}
              style={({ pressed }) => [
                styles.row,
                index === sources.length - 1 && styles.rowLast,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.iconWrap}>
                <Icon
                  name={option.icon}
                  size={iconSize.md}
                  color={colors.orange}
                />
              </View>
              <CustomText variant="label" style={styles.label}>
                {option.label}
              </CustomText>
              <Icon name="chev" size={s(16)} color={colors.ink4} />
            </Pressable>
          );
        })}
      </CustomBottomSheet>

      <PopUp
        visible={!!blocked}
        tone="orange"
        icon={blocked === 'camera' ? 'camera' : 'lock'}
        title="Permission needed"
        message={blocked ? blockedMessage(blocked) : ''}
        confirmLabel="Open Settings"
        onConfirm={() => {
          setBlocked(null);
          openAppSettings();
        }}
        cancelLabel="Not now"
        onCancel={() => setBlocked(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingVertical: s(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { opacity: 0.7 },
  iconWrap: {
    width: s(32),
    height: s(32),
    borderRadius: radius.ctl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orangeSoft,
  },
  label: { flex: 1, fontFamily: font.semibold },
});
