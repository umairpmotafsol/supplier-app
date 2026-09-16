/**
 * Builds request URLs from the configured base URL.
 *
 * There is no endpoint table here. The backend does not exist yet (see
 * `apiConfig.js`), and a list of invented paths would be fiction that
 * reads as fact — the first person to wire up a real API would have to
 * check every one of them against the actual contract. Add the paths
 * here, as constants, when there is a contract to copy them from.
 */
import {
  API_NOT_CONFIGURED,
  BASE_URL,
  isApiConfigured,
  resolveBaseUrl,
} from './apiConfig';

/** Error thrown when a URL is requested before a backend is configured. */
export class ApiNotConfiguredError extends Error {
  constructor(path) {
    super(
      `No API base URL is configured, so "${path}" cannot be requested. ` +
        'Set BASE_URL in src/resources/utils/apiConfig.js.',
    );
    this.name = 'ApiNotConfiguredError';
    this.code = API_NOT_CONFIGURED;
  }
}

const trimEnd = value => value.replace(/\/+$/, '');
const trimStart = value => value.replace(/^\/+/, '');

/**
 * Serialises a query object. Arrays repeat the key (`?id=1&id=2`), and
 * null/undefined values are dropped rather than sent as "null".
 */
export function toQueryString(query) {
  if (!query) {
    return '';
  }
  const parts = [];
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }
    const push = one =>
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(one)}`);
    if (Array.isArray(value)) {
      value.forEach(push);
    } else {
      push(value);
    }
  });
  return parts.length ? `?${parts.join('&')}` : '';
}

/**
 * The absolute URL for an API path.
 *
 * @param {string} path e.g. 'orders/1025/invoice'
 * @param {object} [query]
 * @throws {ApiNotConfiguredError} when no base URL is configured
 */
export function apiUrl(path, query) {
  if (!isApiConfigured()) {
    throw new ApiNotConfiguredError(path);
  }
  return `${trimEnd(resolveBaseUrl(BASE_URL))}/${trimStart(
    path,
  )}${toQueryString(query)}`;
}

export default apiUrl;
