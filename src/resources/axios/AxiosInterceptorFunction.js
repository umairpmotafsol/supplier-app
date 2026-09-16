/**
 * The app's HTTP client: one axios instance, with the request and
 * response interceptors attached.
 *
 * Request side: attaches the session token from the Keychain (never from
 * Redux or AsyncStorage) and lets multipart bodies set their own
 * Content-Type, because axios has to add the multipart boundary itself.
 *
 * Response side: unwraps `data` on success, and on failure turns the
 * error into one readable sentence, shows it as a toast, and re-throws
 * so the caller can still handle it. A cancelled request is silent — the
 * user cancelled it, so telling them it "failed" would be a lie.
 *
 * Nothing in the prototype's screens calls this: there is no backend
 * (see `apiConfig.js`), and a mock screen must not depend on one.
 */
import axios from 'axios';

import { showToast } from '../../components/molecules/Toast';
import { getToken } from '../../security/keychainService';
import {
  API_NOT_CONFIGURED,
  DEFAULT_HEADERS,
  REQUEST_TIMEOUT_MS,
  isApiConfigured,
  resolveBaseUrl,
} from '../utils/apiConfig';
import { describeRequestError } from '../utils/helper';

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: REQUEST_TIMEOUT_MS,
  headers: DEFAULT_HEADERS,
});

/* ------------------------------ request side ------------------------------ */

api.interceptors.request.use(async config => {
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
    throw error;
  }

  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

api.interceptors.response.use(
  response => response,
  error => {
    const described = describeRequestError(error);
    if (!described.cancelled) {
      showToast({ message: described.message, icon: 'alert' });
    }
    /* Attach the description so callers do not re-derive it. */
    error.described = described;
    return Promise.reject(error);
  },
);

/**
 * One request, with the response body unwrapped.
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
  const response = await api.request({
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
  return response.data;
}

export default AxiosInterceptorFunction;
