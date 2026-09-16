/**
 * Uploading a picked photo, video or document.
 *
 * What this handles, because every caller would otherwise handle it
 * badly: progress, cancellation (an upload the user walked away from
 * must stop, and must not then report a failure), and the fact that
 * there is no backend yet — with no base URL configured the hook fails
 * fast with a named error instead of hanging.
 *
 * Usage:
 *
 *   const {upload, cancel, progress, uploading, error} = useUploadMedia();
 *   const result = await upload(asset, {url: 'orders/1025/invoice'});
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { AxiosInterceptorFunction } from '../axios/AxiosInterceptorFunction';
import { UPLOAD_TIMEOUT_MS, isApiConfigured } from './apiConfig';
import { ApiNotConfiguredError } from './apiUrl';
import { describeRequestError, toMediaAsset } from './helper';

/**
 * The multipart body for one asset. React Native's FormData takes
 * `{uri, name, type}` directly — the file is streamed from disk by the
 * platform, so nothing is read into JS.
 */
export function buildMediaFormData(asset, { field = 'file', extra } = {}) {
  const media = toMediaAsset(asset);
  if (!media.uri) {
    throw new Error('Nothing to upload: the picked media has no uri.');
  }
  const body = new FormData();
  body.append(field, {
    uri: media.uri,
    name: media.name,
    type: media.type,
  });
  Object.entries(extra ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      body.append(key, String(value));
    }
  });
  return body;
}

export function useUploadMedia() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      /* A screen that goes away takes its upload with it. */
      controllerRef.current?.abort();
    };
  }, []);

  /** Aborts the upload in flight, if any. Safe to call at any time. */
  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    if (mountedRef.current) {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  /**
   * @param {object} asset anything a picker returned
   * @param {object} options
   * @param {string} options.url path relative to the API base URL
   * @param {string} [options.field] multipart field name
   * @param {object} [options.extra] extra form fields
   * @returns {Promise<{ok: true, data: any} | {ok: false, cancelled: boolean, message: string}>}
   */
  const upload = useCallback(async (asset, { url, field, extra } = {}) => {
    if (!isApiConfigured()) {
      const notConfigured = new ApiNotConfiguredError(url ?? 'upload');
      if (mountedRef.current) {
        setError(notConfigured.message);
      }
      return { ok: false, cancelled: false, message: notConfigured.message };
    }

    /* One upload at a time per hook: a second call replaces the first. */
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    if (mountedRef.current) {
      setUploading(true);
      setProgress(0);
      setError(null);
    }

    try {
      const data = await AxiosInterceptorFunction({
        method: 'post',
        url,
        data: buildMediaFormData(asset, { field, extra }),
        signal: controller.signal,
        timeout: UPLOAD_TIMEOUT_MS,
        onUploadProgress: value => {
          if (mountedRef.current) {
            setProgress(value);
          }
        },
      });
      if (mountedRef.current) {
        setProgress(1);
      }
      return { ok: true, data };
    } catch (caught) {
      const described = caught.described ?? describeRequestError(caught);
      if (mountedRef.current && !described.cancelled) {
        setError(described.message);
      }
      return {
        ok: false,
        cancelled: described.cancelled,
        message: described.message,
      };
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
      if (mountedRef.current) {
        setUploading(false);
      }
    }
  }, []);

  return { upload, cancel, uploading, progress, error };
}

export default useUploadMedia;
