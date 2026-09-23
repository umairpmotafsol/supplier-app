/**
 * The camera seam.
 *
 * The flow is: Upload Invoice -> camera opens -> photo -> submit.
 *
 * `pickMedia` — MediaPicker's headless half — already owns the
 * permission dance and every way a native picker can end. This narrows
 * it to the one thing the invoice flow wants (one photo, no cropping
 * step, so the flow stays two taps) and stamps it with the moment it was
 * taken, leaving the caller a single result to switch on.
 */
import { pickMedia } from '../components/organisms/MediaPicker';

/**
 * Opens the camera for one invoice photo.
 *
 * The photo it returns carries a real `file://` uri from the device —
 * which is what makes it uploadable. Anything else is a reason there is
 * no photo, for the caller to report or ignore as it sees fit.
 *
 * @returns {Promise<
 *   | {status: 'picked', photo: {uri: string, name: string, type: string, capturedAt: string}}
 *   | {status: 'cancelled'}
 *   | {status: 'denied' | 'blocked', permission: string}
 *   | {status: 'error', message: string}
 * >}
 */
export async function captureInvoicePhoto() {
  const result = await pickMedia('camera', { mediaType: 'photo' });
  if (result.status !== 'picked') {
    return result;
  }
  return {
    status: 'picked',
    photo: {
      ...result.assets[0],
      capturedAt: new Date().toISOString(),
    },
  };
}

export default captureInvoicePhoto;
