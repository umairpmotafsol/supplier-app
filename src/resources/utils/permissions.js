/**
 * Camera, photo-library and microphone permissions, in one place.
 *
 * Two things this handles that a bare `request()` does not:
 *
 *  1. **Ask for the least the OS needs, and nothing on Android's photo
 *     library.** image-crop-picker opens the gallery through Android's
 *     system Photo Picker: built in from Android 13 (API 33), and
 *     backported to older versions through Google Play services (the
 *     library's manifest registers that backport). The picker runs in
 *     another process and hands back only what the user chose, so *no*
 *     storage or media permission is needed on any version — and
 *     declaring READ_MEDIA_IMAGES would both add a needless prompt and
 *     put the app under Google Play's photo-permission policy. The camera
 *     is different: it is a runtime permission on every supported
 *     version (minSdk 24), because the manifest declares it.
 *     The microphone is only asked for on iOS, where the camera sheet
 *     records video in-process; on Android capture is delegated to the
 *     system camera app, which holds its own microphone permission.
 *  2. **"Denied" and "blocked" are different.** Denied can be asked
 *     again; blocked cannot — the only way forward is the Settings app.
 *     Callers get that distinction so they can offer the right thing.
 */
import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  openSettings,
  request,
} from 'react-native-permissions';

/** What every helper here resolves to. */
export const PERMISSION_STATUS = {
  granted: 'granted',
  /** Refused this time; asking again is allowed. */
  denied: 'denied',
  /** Refused for good, or restricted by policy. Settings is the only route. */
  blocked: 'blocked',
  /** No such permission on this platform/version — treat as granted. */
  unavailable: 'unavailable',
};

/**
 * The permission the current OS actually wants for a given job, or null
 * when this OS version does not require one.
 *
 * @param {'camera' | 'photoLibrary' | 'microphone'} kind
 * @returns {string | null}
 */
export function permissionFor(kind) {
  if (Platform.OS === 'ios') {
    return {
      camera: PERMISSIONS.IOS.CAMERA,
      photoLibrary: PERMISSIONS.IOS.PHOTO_LIBRARY,
      microphone: PERMISSIONS.IOS.MICROPHONE,
    }[kind];
  }

  if (Platform.OS !== 'android') {
    return null;
  }

  switch (kind) {
    case 'camera':
      return PERMISSIONS.ANDROID.CAMERA;
    case 'photoLibrary':
      /* System Photo Picker, on every Android version — see the header. */
      return null;
    case 'microphone':
      /* Capture is delegated to the camera app — see the header. */
      return null;
    default:
      return null;
  }
}

const normalise = result => {
  switch (result) {
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      /* Limited = "selected photos only", which is enough to pick one. */
      return PERMISSION_STATUS.granted;
    case RESULTS.BLOCKED:
      return PERMISSION_STATUS.blocked;
    case RESULTS.UNAVAILABLE:
      return PERMISSION_STATUS.unavailable;
    default:
      return PERMISSION_STATUS.denied;
  }
};

/** Checks without prompting. */
export async function checkPermission(kind) {
  const permission = permissionFor(kind);
  if (!permission) {
    return PERMISSION_STATUS.granted;
  }
  try {
    return normalise(await check(permission));
  } catch {
    return PERMISSION_STATUS.denied;
  }
}

/**
 * Checks, and prompts only if that would help. Already-blocked
 * permissions are not re-requested: on iOS the second request resolves
 * immediately without a dialog, which looks to the user like the app
 * ignoring them.
 *
 * @returns {Promise<'granted' | 'denied' | 'blocked' | 'unavailable'>}
 */
export async function requestPermission(kind) {
  const permission = permissionFor(kind);
  if (!permission) {
    return PERMISSION_STATUS.granted;
  }

  const current = await checkPermission(kind);
  if (current !== PERMISSION_STATUS.denied) {
    return current;
  }

  try {
    return normalise(await request(permission));
  } catch {
    return PERMISSION_STATUS.denied;
  }
}

/** Camera capture also needs the mic when it can record video. */
export async function requestCameraPermissions({
  withMicrophone = false,
} = {}) {
  const camera = await requestPermission('camera');
  if (camera !== PERMISSION_STATUS.granted || !withMicrophone) {
    return camera;
  }
  return requestPermission('microphone');
}

/** Opens this app's page in the Settings app. Never throws. */
export async function openAppSettings() {
  try {
    await openSettings();
    return true;
  } catch {
    return false;
  }
}

/** Copy for the "we cannot ask again" prompt. */
export function blockedMessage(kind) {
  const what = {
    camera: 'the camera',
    photoLibrary: 'your photos',
    microphone: 'the microphone',
  }[kind];
  return `Access to ${what} is turned off for this app. You can turn it back on in Settings.`;
}
