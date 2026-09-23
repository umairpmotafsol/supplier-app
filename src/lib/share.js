/**
 * Sending a completed invoice to the customer.
 *
 * This deliberately has no WhatsApp UI of its own: it opens the phone's
 * own share sheet and lets the admin pick WhatsApp (or anything else)
 * from it. `Share` is a core React Native API, so unlike the camera this
 * is the real thing, not a stand-in.
 *
 * How the photo travels
 * ---------------------
 * The invoice is stored on Cloudinary, so it has a URL the customer's
 * phone can open with no token — and that URL is what goes out. WhatsApp
 * unfurls it into the invoice photo in the thread, and tapping it opens
 * the full image.
 *
 * It is a link rather than an attachment because of what core `Share`
 * can carry. `url` is honoured on iOS only; on Android the sheet takes
 * `message` and nothing else, so a URL in the body is the one form that
 * arrives on both. Attaching the bytes themselves means an
 * `ACTION_SEND` with a content:// URI, which needs a native module
 * (react-native-share) and a rebuild — worth doing if the link is not
 * good enough, but it is a native dependency, not a change here.
 *
 * A caveat worth keeping: the share sheet does not report *which* app
 * was chosen on Android — `sharedAction` only means the sheet handed the
 * content off. On iOS `activityType` usually names it. So "sent" here
 * means "the admin completed a share", not "WhatsApp confirmed
 * delivery". Real delivery confirmation needs the WhatsApp Business API
 * (Twilio) on a backend.
 */
import { Share } from 'react-native';

import { ORDER_TYPE_LABEL, gbp, invoiceImageUrl } from '../data/mock';

/** The message body the customer receives. */
export function invoiceMessage(order) {
  /*
   * Unbranded on purpose. The supplier app carries no company mark,
   * so the one message it composes carries none either — in a real
   * build this copy would come from the server anyway.
   */
  const photo = invoiceImageUrl(order);
  return [
    'Your vehicle tax is sorted.',
    '',
    'Order: ' + order.orderNumber,
    'Vehicle: ' + order.reg + ' — ' + order.vehicleModel,
    'Cover: ' + ORDER_TYPE_LABEL[order.orderType],
    'Total paid: ' + gbp(order.total),
    '',
    /*
     * The line changes with the link, rather than promising an
     * attachment that is not there. An invoice with no hosted copy is
     * still worth sending as a confirmation — it just cannot carry the
     * photo, and the message should not claim otherwise.
     */
    photo ? 'Your invoice: ' + photo : 'Your invoice will follow separately.',
    'Keep it for your records.',
  ].join('\n');
}

/**
 * Opens the native share sheet. Resolves true when the admin actually
 * shared, false when they dismissed it — so a dismissed sheet never
 * marks the order as delivered.
 */
export async function shareInvoice(order) {
  const photo = invoiceImageUrl(order);
  try {
    const result = await Share.share({
      title: 'Invoice ' + order.orderNumber,
      message: invoiceMessage(order),
      /* iOS only; Android ignores it, which is why the body carries it too. */
      ...(photo ? { url: photo } : null),
    });
    return result.action === Share.sharedAction;
  } catch {
    // The sheet failed to open, or the OS cancelled it. Nothing to do.
    return false;
  }
}
