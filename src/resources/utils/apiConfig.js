/**
 * THE ONE PLACE THE API BASE URL IS CONFIGURED.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  Set BASE_URL below to point the app at a backend.               │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * It is deliberately empty. This app is a frontend-only prototype: the
 * order book, the accounts and the invoice upload are all mocked, and no
 * screen calls the network. Inventing a URL here would mean shipping an
 * app that tries to reach a host that does not exist, fails, and shows
 * errors for work it already did locally.
 *
 * With BASE_URL empty:
 *  - every screen works exactly as it does now, offline;
 *  - `apiUrl()` and the axios instance throw a clear, named error
 *    (`API_NOT_CONFIGURED`) rather than firing a request at "undefined".
 *
 * When there is a backend, set BASE_URL (or read it from your build
 * flavour / scheme here — this is the only file that has to change) and
 * the axios instance, the interceptor and `useUploadMedia` start
 * working with no other edits.
 */
import { Platform } from 'react-native';

/**
 * The API root, e.g. 'https://api.example.com/v1'. Empty = not
 * configured; see above.
 *
 * Note for local development: an Android emulator reaches the host
 * machine on 10.0.2.2, not localhost — hence the helper below.
 */
export const BASE_URL = '';

/** True when a backend has been configured. */
export const isApiConfigured = () => BASE_URL.trim().length > 0;

/**
 * Rewrites localhost for the Android emulator, which cannot see the
 * host machine's loopback address.
 */
export function resolveBaseUrl(url = BASE_URL) {
  if (Platform.OS === 'android') {
    return url
      .replace('//localhost', '//10.0.2.2')
      .replace('//127.0.0.1', '//10.0.2.2');
  }
  return url;
}

/** How long a request may take before it is abandoned, in ms. */
export const REQUEST_TIMEOUT_MS = 30000;

/** Uploads carry photos, so they get longer. */
export const UPLOAD_TIMEOUT_MS = 120000;

/** Thrown/reported when something calls the API with no BASE_URL set. */
export const API_NOT_CONFIGURED = 'API_NOT_CONFIGURED';

export const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};
