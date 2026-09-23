/**
 * THE ONE PLACE THE API BASE URL IS CONFIGURED.
 *
 * Points at tax-my-motor-backend. In debug builds this defaults to each
 * platform's loopback to a backend running on the same machine:
 *
 *  - Android emulator: 10.0.2.2 is the host machine, by Android's own
 *    convention.
 *  - iOS simulator: localhost works directly, same machine.
 *  - A physical device (either platform) can't reach either of those —
 *    replace the debug value with your machine's LAN IP (e.g.
 *    'http://192.168.1.23:4000/api') and make sure the backend's
 *    CORS_ORIGINS / firewall allow it.
 *
 * Production must be a real HTTPS host — the iOS and Android projects
 * only allow cleartext traffic to the local Metro bundler in debug
 * builds.
 */
import { Platform } from 'react-native';

/**
 * The API root, e.g. 'https://api.example.com/api'. Empty would mean
 * "not configured"; see `isApiConfigured` below.
 */
export const BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:4000/api'
    : 'http://localhost:4000/api'
  : 'https://api.your-domain.example';

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
