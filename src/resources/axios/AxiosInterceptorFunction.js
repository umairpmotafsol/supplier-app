/**
 * The app's HTTP client: one axios instance, with the request and
 * response interceptors attached.
 *
 * Request side: refuses to run until an API base URL is configured,
 * attaches the session token from the Keychain (never from Redux or
 * AsyncStorage), and lets multipart bodies set their own Content-Type,
 * because axios has to add the multipart boundary itself.
 *
 * Response side: unwraps the backend's `{success, data}` envelope (see
 * tax-my-motor-backend's common/interceptors/transform.interceptor.ts),
 * refreshes an expired access token and replays the request once before
 * giving up on it, and on a failure turns the error into one readable
 * sentence, shows it as a toast, and re-throws so the caller can still
 * handle it. A cancelled request is silent — the user cancelled it, so
 * telling them it "failed" would be a lie.
 *
 * Per-request options (pass them in the axios config):
 *   skipAuth: true        do not attach the token (sign-in, refresh)
 *   silent: true          do not toast on failure; the caller will handle it
 *   skipAuthEvents: true  a 401 here must not refresh, clear the session or
 *                         call onUnauthorized — for the sign-out request
 *                         itself, which would otherwise re-enter sign-out
 *                         and loop.
 */
import axios from 'axios';

import { showToast } from '../../components/molecules/Toast';
import {
  clearSession,
  getRefreshToken,
  getToken,
  saveRefreshToken,
  saveToken,
} from '../../security/keychainService';
import {
  API_NOT_CONFIGURED,
  DEFAULT_HEADERS,
  REQUEST_TIMEOUT_MS,
  isApiConfigured,
  resolveBaseUrl,
} from '../utils/apiConfig';
import { API_URL } from '../utils/apiUrl';
import { describeRequestError } from '../utils/helper';

/**
 * Hooks the app registers once at startup (App.js), so this module never
 * imports the store or navigation and stays usable from anywhere.
 */
const handlers = { onUnauthorized: null };

/** @returns {() => void} unregisters the handlers again */
export function setApiEventHandlers(next = {}) {
  Object.assign(handlers, next);
  return () => {
    Object.keys(next).forEach(key => {
      if (handlers[key] === next[key]) {
        handlers[key] = null;
      }
    });
  };
}

export const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: REQUEST_TIMEOUT_MS,
  headers: DEFAULT_HEADERS,
});

/* ------------------------------ request side ------------------------------ */

apiClient.interceptors.request.use(async config => {
  if (!isApiConfigured()) {
    /*
     * Fail here rather than firing a request at a relative URL: the
     * error names the one file that has to be edited, which is a far
     * better bug report than a network timeout.
     */
    const error = new Error(
      'No API base URL is configured. Set BASE_URL in src/resources/utils/apiConfig.js.',
    );
    error.code = API_NOT_CONFIGURED;
    error.config = config;
    throw error;
  }

  if (!config.skipAuth) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  /*
   * FormData must keep the boundary axios generates for it. Setting a
   * bare 'multipart/form-data' header here would drop it and the server
   * would reject the body.
   */
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

/* ------------------------------ response side ----------------------------- */

/**
 * One in-flight refresh at a time: several requests failing together
 * (e.g. a screen that fires off two calls on mount) must not each start
 * their own — the backend rotates refresh tokens, so a second one would
 * find the first already spent.
 */
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return null;
    }
    try {
      const res = await axios.post(
        resolveBaseUrl() + API_URL.REFRESH,
        { refreshToken },
        { headers: DEFAULT_HEADERS, timeout: REQUEST_TIMEOUT_MS },
      );
      const tokens = res.data?.data ?? res.data;
      if (!tokens?.accessToken) {
        return null;
      }
      await Promise.all([
        saveToken(tokens.accessToken),
        saveRefreshToken(tokens.refreshToken),
      ]);
      return tokens.accessToken;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const config = error?.config ?? {};
    const status = error?.response?.status;

    /*
     * A short-lived access token expiring mid-session is routine, not a
     * sign-out — refresh once and replay the request before giving up
     * on it. `_retried` stops a genuinely bad refresh token from
     * looping.
     */
    if (
      status === 401 &&
      !config.skipAuth &&
      !config.skipAuthEvents &&
      !config._retried
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiClient({ ...config, _retried: true });
      }
    }

    const described = describeRequestError(error);
    /* Attach the description so callers do not re-derive it. */
    error.described = described;

    if (described.status === 401 && !config.skipAuth && !config.skipAuthEvents) {
      await clearSession().catch(() => {});
      handlers.onUnauthorized?.(described);
    }

    if (!described.cancelled && !config.silent) {
      showToast({ message: described.message, icon: 'alert' });
    }

    return Promise.reject(error);
  },
);

/**
 * The backend's TransformInterceptor wraps every success as
 * `{success: true, data}` — these resolve straight to `data`, so call
 * sites never unwrap the envelope by hand. A file download (the invoice
 * photo) isn't wrapped, so it passes through unchanged.
 */
const unwrap = response => {
  const body = response.data;
  return body && typeof body === 'object' && 'success' in body && 'data' in body
    ? body.data
    : body;
};

/** The verbs the store's thunks call. */
export const api = {
  get: (url, config) => apiClient.get(url, config).then(unwrap),
  post: (url, data, config) => apiClient.post(url, data, config).then(unwrap),
  put: (url, data, config) => apiClient.put(url, data, config).then(unwrap),
  patch: (url, data, config) => apiClient.patch(url, data, config).then(unwrap),
  delete: (url, config) => apiClient.delete(url, config).then(unwrap),
};

/**
 * One request, with the response body unwrapped. Kept for
 * `useUploadMedia`, which needs `onUploadProgress`/`signal` on a call
 * shaped by method+url+data rather than one of the verbs above.
 *
 * @param {object} options
 * @param {'get'|'post'|'put'|'patch'|'delete'} [options.method]
 * @param {string} options.url path relative to the configured base URL
 * @param {object} [options.data] request body
 * @param {object} [options.params] query string
 * @param {AbortSignal} [options.signal] from an AbortController, to cancel
 * @param {(progress: number) => void} [options.onUploadProgress] 0..1
 * @param {number} [options.timeout]
 * @returns {Promise<any>} the response body
 */
export async function AxiosInterceptorFunction({
  method = 'get',
  url,
  data,
  params,
  signal,
  onUploadProgress,
  timeout,
  headers,
}) {
  const response = await apiClient.request({
    method,
    url,
    data,
    params,
    signal,
    timeout,
    headers,
    onUploadProgress: onUploadProgress
      ? event => {
          if (event.total) {
            onUploadProgress(event.loaded / event.total);
          }
        }
      : undefined,
  });
  return unwrap(response);
}

export default AxiosInterceptorFunction;
