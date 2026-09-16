/**
 * Small pure helpers shared across the app: currency and date
 * formatting, file/MIME guessing for the media components, and turning
 * an axios failure into one sentence a person can read.
 *
 * The formatting helpers were defined in `src/data/mock.js`; they are
 * not mock data, so they live here and are re-exported from there so
 * existing imports (and the tests) keep working.
 */
import { API_NOT_CONFIGURED } from './apiConfig';

/* ------------------------------- formatting ------------------------------- */

/** £1,234.50 — the app is en-GB throughout. */
export const gbp = amount => '£' + amount.toFixed(2);

/** The clock time of an ISO timestamp, as HH:MM. */
export function formatTimeAgo(iso) {
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return hh + ':' + mm;
}

/** Same calendar day as now — what the admin's main screen shows. */
export function isToday(iso, now = Date.now()) {
  const a = new Date(iso);
  const b = new Date(now);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 2.4 MB — for file sizes in the media preview. */
export function formatBytes(bytes) {
  if (!bytes || bytes < 0) {
    return '';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${
    value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)
  } ${units[exponent]}`;
}

/* ---------------------------------- files --------------------------------- */

/** The last path segment of a uri, query string stripped. */
export function fileNameFromUri(uri = '') {
  const withoutQuery = uri.split('?')[0];
  const name = withoutQuery.split('/').pop();
  return name || 'file';
}

export function extensionOf(uri = '') {
  const name = fileNameFromUri(uri);
  const dot = name.lastIndexOf('.');
  return dot > -1 ? name.slice(dot + 1).toLowerCase() : '';
}

const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  csv: 'text/csv',
  txt: 'text/plain',
};

/** Best guess at a MIME type, for multipart uploads. */
export function mimeTypeFor(uri, fallback = 'application/octet-stream') {
  return MIME_BY_EXTENSION[extensionOf(uri)] ?? fallback;
}

export const isImageMime = mime => !!mime && mime.startsWith('image/');
export const isVideoMime = mime => !!mime && mime.startsWith('video/');
export const isPdfMime = mime => mime === 'application/pdf';

/**
 * Normalises whatever a picker hands back (image-crop-picker, the
 * document picker) into the one shape the preview and the upload hook
 * both understand.
 */
export function toMediaAsset(raw = {}) {
  const uri = raw.uri ?? raw.path ?? raw.sourceURL ?? '';
  const type = raw.type ?? raw.mime ?? mimeTypeFor(uri);
  return {
    uri,
    name: raw.name ?? raw.filename ?? fileNameFromUri(uri),
    type,
    size: raw.size ?? null,
    width: raw.width ?? null,
    height: raw.height ?? null,
    duration: raw.duration ?? null,
  };
}

/* --------------------------------- errors --------------------------------- */

/**
 * One readable sentence for a failed request.
 *
 * Order matters: a cancelled request is not an error the user should be
 * told about, an unconfigured API is a developer mistake rather than a
 * network problem, and everything else falls back to the server's own
 * message before the generic one.
 *
 * @returns {{message: string, status: number|null, cancelled: boolean}}
 */
export function describeRequestError(error) {
  if (!error) {
    return { message: 'Something went wrong', status: null, cancelled: false };
  }
  if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
    return { message: 'Cancelled', status: null, cancelled: true };
  }
  if (error.code === API_NOT_CONFIGURED) {
    return { message: error.message, status: null, cancelled: false };
  }

  const status = error.response?.status ?? null;
  if (error.code === 'ECONNABORTED') {
    return { message: 'The request timed out', status, cancelled: false };
  }
  if (!error.response) {
    return { message: 'No connection', status: null, cancelled: false };
  }

  const serverMessage =
    error.response.data?.message ??
    error.response.data?.error ??
    (typeof error.response.data === 'string' ? error.response.data : null);

  const byStatus = {
    400: 'That request was rejected',
    401: 'Your session has expired — sign in again',
    403: 'You do not have access to that',
    404: 'Not found',
    409: 'That has already been done',
    422: 'Some details need correcting',
    429: 'Too many attempts — try again shortly',
  };

  return {
    message:
      serverMessage ??
      byStatus[status] ??
      (status >= 500 ? 'The server had a problem' : 'Something went wrong'),
    status,
    cancelled: false,
  };
}
