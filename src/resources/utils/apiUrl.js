/**
 * Endpoint paths (relative to BASE_URL in apiConfig.js), matching
 * tax-my-motor-backend's controllers, plus the URL-building helpers used
 * both by the shared axios instance and by anything that needs an
 * absolute URL of its own (the invoice photo, for instance).
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

/**
 * Fills `:param` segments (URL-encoded) in one of the paths below.
 * Throws when a path parameter is missing, so a broken call fails where
 * it is made rather than as a 404 from the server.
 *
 * @param {string} path e.g. '/supplier/orders/:id'
 * @param {Record<string, string | number>} [params]
 */
export function buildUrl(path, params = {}) {
  return String(path).replace(/:([A-Za-z_]\w*)/g, (_, key) => {
    const value = params[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`buildUrl: missing path parameter "${key}" for ${path}`);
    }
    return encodeURIComponent(String(value));
  });
}

/**
 * Every path this app calls, matching tax-my-motor-backend's
 * controllers. Built with `buildUrl`, e.g.
 *
 *   api.post(buildUrl(API_URL.SUPPLIER_ORDER_BANK_APPROVE, {id: order.id}));
 */
export const API_URL = Object.freeze({
  // auth
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',

  // orders — supplier's own book (supplier-orders.controller.ts)
  SUPPLIER_ORDERS: '/supplier/orders',
  SUPPLIER_ORDER_DETAIL: '/supplier/orders/:id',
  SUPPLIER_ORDER_STATS: '/supplier/orders/stats',
  SUPPLIER_ORDER_BANK_APPROVE: '/supplier/orders/:id/bank/approve',
  SUPPLIER_ORDER_BANK_REQUEST_CHANGES:
    '/supplier/orders/:id/bank/request-changes',

  // orders — the admin's monitoring board (admin-orders.controller.ts)
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_STATS: '/admin/orders/stats',
  ADMIN_ORDER_SEND: '/admin/orders/:id/send',

  // invoices
  INVOICE_UPLOAD: '/invoices/:orderId',
  INVOICE_FILE: '/invoices/:orderId/file',
});

export default apiUrl;
