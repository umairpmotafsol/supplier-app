/* eslint-env jest */
/**
 * The seams around the mock app: the API layer must fail loudly and
 * locally while no backend is configured, permissions must ask for the
 * right thing on each Android version, and a cancelled picker must not
 * be reported as a failure.
 */
import { Platform } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { RESULTS, check, request } from 'react-native-permissions';

import { AxiosInterceptorFunction } from '../src/resources/axios/AxiosInterceptorFunction';
import {
  API_NOT_CONFIGURED,
  isApiConfigured,
} from '../src/resources/utils/apiConfig';
import {
  ApiNotConfiguredError,
  apiUrl,
  toQueryString,
} from '../src/resources/utils/apiUrl';
import {
  describeRequestError,
  mimeTypeFor,
  toMediaAsset,
} from '../src/resources/utils/helper';
import {
  PERMISSION_STATUS,
  permissionFor,
  requestPermission,
} from '../src/resources/utils/permissions';
import { ICONS } from '../src/components/atoms/Icon';
import { pickMedia } from '../src/components/organisms/MediaPicker';
import { showToast } from '../src/components/molecules/Toast';
import { gbp, formatTimeAgo, isToday } from '../src/data/mock';

describe('the API layer with no backend configured', () => {
  it('ships unconfigured', () => {
    expect(isApiConfigured()).toBe(false);
  });

  it('refuses to build a URL, naming the file to edit', () => {
    expect(() => apiUrl('orders')).toThrow(ApiNotConfiguredError);
    expect(() => apiUrl('orders')).toThrow('apiConfig.js');
  });

  it('rejects a request before it reaches the network', async () => {
    await expect(
      AxiosInterceptorFunction({ url: 'orders' }),
    ).rejects.toMatchObject({
      code: API_NOT_CONFIGURED,
    });
  });

  it('serialises queries without sending empty values', () => {
    expect(toQueryString({ a: 1, b: null, c: ['x', 'y'], d: '' })).toBe(
      '?a=1&c=x&c=y',
    );
  });
});

describe('request errors', () => {
  it('treats a cancelled request as silent', () => {
    expect(describeRequestError({ code: 'ERR_CANCELED' }).cancelled).toBe(true);
  });

  it('prefers the server message, then the status, then a generic line', () => {
    expect(
      describeRequestError({
        response: { status: 422, data: { message: 'Bad sort code' } },
      }).message,
    ).toBe('Bad sort code');
    expect(
      describeRequestError({ response: { status: 401, data: {} } }).message,
    ).toMatch(/sign in/);
    expect(
      describeRequestError({ response: { status: 503, data: {} } }).message,
    ).toBe('The server had a problem');
    expect(describeRequestError({ message: 'Network Error' }).message).toBe(
      'No connection',
    );
  });

  it('does not crash when a toast is raised before the provider mounts', () => {
    expect(showToast({ message: 'x' })).toBe(false);
  });
});

describe('helpers moved out of the mock module', () => {
  it('are still exported from it', () => {
    expect(gbp(135)).toBe('£135.00');
    expect(typeof formatTimeAgo).toBe('function');
    expect(isToday(new Date().toISOString())).toBe(true);
  });

  it('normalise what the pickers return', () => {
    expect(
      toMediaAsset({
        path: 'file:///tmp/a/IMG_1.HEIC',
        mime: 'image/heic',
        size: 10,
      }),
    ).toMatchObject({
      uri: 'file:///tmp/a/IMG_1.HEIC',
      name: 'IMG_1.HEIC',
      type: 'image/heic',
    });
    expect(mimeTypeFor('file:///x/invoice.pdf?token=1')).toBe(
      'application/pdf',
    );
  });
});

describe('permissions by platform version', () => {
  const originalOS = Platform.OS;
  const originalVersion = Platform.Version;

  const as = (os, version) => {
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
    Object.defineProperty(Platform, 'Version', {
      value: version,
      configurable: true,
    });
  };

  afterEach(() => as(originalOS, originalVersion));

  it('asks Android for the camera only, on every version', () => {
    for (const api of [24, 29, 32, 33, 34, 35, 36]) {
      as('android', api);
      expect(permissionFor('camera')).toBe('android.permission.CAMERA');
      /* The system Photo Picker needs no permission on any version. */
      expect(permissionFor('photoLibrary')).toBeNull();
      expect(permissionFor('microphone')).toBeNull();
    }
  });

  it('never prompts on Android for the photo library', async () => {
    as('android', 34);
    request.mockClear();
    await expect(requestPermission('photoLibrary')).resolves.toBe(
      PERMISSION_STATUS.granted,
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('asks iOS for the photo library', () => {
    as('ios', '26.0');
    expect(permissionFor('photoLibrary')).toBe('ios.permission.PHOTO_LIBRARY');
    expect(permissionFor('camera')).toBe('ios.permission.CAMERA');
  });

  it('does not re-prompt for a blocked permission', async () => {
    as('ios', '26.0');
    check.mockResolvedValueOnce(RESULTS.BLOCKED);
    request.mockClear();
    await expect(requestPermission('camera')).resolves.toBe(
      PERMISSION_STATUS.blocked,
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('treats limited photo access as enough to pick', async () => {
    as('ios', '26.0');
    check.mockResolvedValueOnce(RESULTS.LIMITED);
    await expect(requestPermission('photoLibrary')).resolves.toBe(
      PERMISSION_STATUS.granted,
    );
  });
});

describe('picking media', () => {
  beforeEach(() => {
    check.mockResolvedValue(RESULTS.GRANTED);
  });

  it('reports a backed-out camera as cancelled, not as an error', async () => {
    ImagePicker.openCamera.mockRejectedValueOnce(
      Object.assign(new Error('User cancelled image selection'), {
        code: 'E_PICKER_CANCELLED',
      }),
    );
    await expect(pickMedia('camera')).resolves.toEqual({ status: 'cancelled' });
  });

  it('reports a permission the picker itself refused as blocked', async () => {
    ImagePicker.openPicker.mockRejectedValueOnce(
      Object.assign(new Error('no access'), {
        code: 'E_NO_LIBRARY_PERMISSION',
      }),
    );
    await expect(pickMedia('library')).resolves.toEqual({
      status: 'blocked',
      permission: 'photoLibrary',
    });
  });

  it('returns a normalised asset for a photo', async () => {
    ImagePicker.openCamera.mockResolvedValueOnce({
      path: 'file:///tmp/shot.jpg',
      mime: 'image/jpeg',
      size: 2048,
      width: 10,
      height: 10,
    });
    const result = await pickMedia('camera');
    expect(result.status).toBe('picked');
    expect(result.assets[0]).toMatchObject({
      uri: 'file:///tmp/shot.jpg',
      type: 'image/jpeg',
      name: 'shot.jpg',
    });
  });

  it('copies a picked document to a stable local path', async () => {
    const result = await pickMedia('document');
    expect(result.status).toBe('picked');
    expect(result.assets[0].uri).toMatch(/^file:\/\/\/mock\/uri\//);
    expect(result.assets[0].type).toBe('application/pdf');
  });
});

describe('the icon map', () => {
  const GLYPHMAPS = {
    feather: require('@react-native-vector-icons/feather/glyphmaps/Feather.json'),
    ionicons: require('@react-native-vector-icons/ionicons/glyphmaps/Ionicons.json'),
    material: require('@react-native-vector-icons/material-design-icons/glyphmaps/MaterialDesignIcons.json'),
  };

  it.each(Object.entries(ICONS))(
    '%s points at a real glyph',
    (_, [family, glyph]) => {
      expect(GLYPHMAPS[family]).toHaveProperty([glyph]);
    },
  );
});
