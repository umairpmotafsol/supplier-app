/**
 * The camera seam.
 *
 * The flow is: Upload Invoice -> camera opens -> photo -> submit. Opening
 * the real camera needs a native module (react-native-image-picker's
 * `launchCamera`, or react-native-vision-camera), which is not installed
 * here and cannot be built or verified from this environment. So this
 * module fakes the capture and the app draws its own viewfinder, which
 * keeps the flow demonstrable end to end.
 *
 * To make it real, install the dependency and replace the body of
 * `captureInvoicePhoto` with, e.g.:
 *
 *   import {launchCamera} from 'react-native-image-picker';
 *   const res = await launchCamera({mediaType: 'photo', saveToPhotos: false});
 *   const asset = res.assets?.[0];
 *   return asset?.uri ? {uri: asset.uri, capturedAt: new Date().toISOString()} : null;
 *
 * Nothing else in the app has to change: every caller already treats the
 * result as "a photo, or the user backed out".
 */
import type {InvoicePhoto} from '../data/mock';

/** Stand-in for the shutter. Returns null if the supplier backs out. */
export async function captureInvoicePhoto(
  orderNumber: string,
): Promise<InvoicePhoto | null> {
  return {
    uri: 'mock://invoice-' + orderNumber + '.jpg',
    capturedAt: new Date().toISOString(),
  };
}

/** True once a real camera module is wired in. Drives the "stand-in" note. */
export const HAS_NATIVE_CAMERA = false;
