/**
 * Sending a completed invoice to the customer.
 *
 * This deliberately has no WhatsApp UI of its own: it opens the phone's
 * own share sheet and lets the admin pick WhatsApp (or anything else)
 * from it. `Share` is a core React Native API, so unlike the camera this
 * is the real thing, not a stand-in.
 *
 * A caveat worth knowing: the share sheet does not report *which* app
 * was chosen on Android — `sharedAction` only means the sheet handed the
 * content off. On iOS `activityType` usually names it. So "sent" here
 * means "the admin completed a share", not "WhatsApp confirmed
 * delivery". Real delivery confirmation needs the WhatsApp Business API
 * (Twilio) on a backend.
 */
import {Share} from 'react-native';

import {ORDER_TYPE_LABEL, gbp} from '../data/mock';
import type {Order} from '../data/mock';

/** The message body the customer receives. */
export function invoiceMessage(order: Order) {
  /*
   * Unbranded on purpose. The supplier app carries no company mark,
   * so the one message it composes carries none either — in a real
   * build this copy would come from the server anyway.
   */
  return [
    'Your vehicle tax is sorted.',
    '',
    'Order: ' + order.orderNumber,
    'Vehicle: ' + order.reg + ' — ' + order.vehicleModel,
    'Cover: ' + ORDER_TYPE_LABEL[order.orderType],
    'Total paid: ' + gbp(order.total),
    '',
    'Your invoice is attached. Keep it for your records.',
  ].join('\n');
}

/**
 * Opens the native share sheet. Resolves true when the admin actually
 * shared, false when they dismissed it — so a dismissed sheet never
 * marks the order as delivered.
 */
export async function shareInvoice(order: Order): Promise<boolean> {
  try {
    const result = await Share.share({
      title: 'Invoice ' + order.orderNumber,
      message: invoiceMessage(order),
      /*
       * The captured photo rides along as the attachment on iOS. In this
       * prototype the uri is a mock:// placeholder, so only the message
       * body travels; with a real camera this is the invoice image.
       */
      ...(order.invoicePhoto && !order.invoicePhoto.uri.startsWith('mock://')
        ? {url: order.invoicePhoto.uri}
        : null),
    });
    return result.action === Share.sharedAction;
  } catch {
    // The sheet failed to open, or the OS cancelled it. Nothing to do.
    return false;
  }
}
