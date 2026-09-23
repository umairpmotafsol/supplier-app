/**
 * The uploaded invoice, full size.
 *
 * An admin sends invoices on to customers, and sending one unseen is
 * how a blurred or wrong photo reaches the person who paid for it. So
 * the photo is readable before the Send button is pressed, and this is
 * where it is read — a dimmed card with the image in it, the order it
 * belongs to named, and nothing else to do.
 *
 * `CustomImage` handles the loading and failure states, so a slow or
 * dead link is a spinner and then a neutral tile rather than a blank
 * modal.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ModalSkeleton from './molecules/ModalSkeleton';
import CustomImage from './atoms/CustomImage';
import Icon from './atoms/Icon';
import { Cta, Hint } from './ui';
import { colors, font, radius, s, track } from '../theme/tokens';
import { formatTimeAgo, invoiceImageUrl } from '../data/mock';

/**
 * @param {object} props
 * @param {import('../data/mock').Order} [props.order] null/undefined keeps it closed
 * @param {() => void} props.onClose
 * @param {() => void} [props.onSend] offered only when this order is still to be sent
 * @param {boolean} [props.sending]
 */
export function InvoiceViewer({ order, onClose, onSend, sending }) {
  const uri = order ? invoiceImageUrl(order) : null;

  return (
    <ModalSkeleton
      visible={!!order}
      onClose={onClose}
      statusBarTranslucent
      testID="invoice-viewer"
    >
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.orderNumber}>{order?.orderNumber}</Text>
          <Text style={styles.sub}>
            {order?.invoicePhoto?.capturedAt || order?.invoiceUploadedAt
              ? 'Uploaded ' +
                formatTimeAgo(
                  order.invoicePhoto?.capturedAt ?? order.invoiceUploadedAt,
                )
              : 'Invoice'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          hitSlop={s(10)}
          style={styles.close}
        >
          <Icon name="close" size={s(15)} color={colors.ink3} />
        </Pressable>
      </View>

      {uri ? (
        <CustomImage
          uri={uri}
          resizeMode="contain"
          style={styles.photo}
          rounded
          accessibilityLabel={'Invoice for order ' + order.orderNumber}
        />
      ) : (
        /*
         * An invoice with no hosted copy. It exists on the server, but
         * not at an address this image tag or a customer's phone can
         * open — so say that, rather than showing a broken tile.
         */
        <Hint icon="alert" center style={styles.missing}>
          This invoice has no shareable copy. The backend is storing
          uploads locally rather than on Cloudinary.
        </Hint>
      )}

      {onSend ? (
        <Cta
          label={sending ? 'Opening share sheet…' : 'Send via WhatsApp'}
          icon="whatsapp"
          disabled={sending}
          onPress={onSend}
          style={{ marginTop: s(14) }}
        />
      ) : null}
    </ModalSkeleton>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: s(10),
    marginBottom: s(12),
  },
  headText: { flex: 1 },
  orderNumber: {
    fontFamily: font.display,
    fontSize: s(15),
    letterSpacing: track(0.06, s(15)),
    color: colors.ink,
  },
  sub: {
    fontFamily: font.regular,
    fontSize: s(10.5),
    color: colors.ink3,
    marginTop: s(3),
  },
  close: {
    width: s(28),
    height: s(28),
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  /*
   * Tall rather than square: an invoice is a portrait sheet of paper,
   * and `contain` inside a square would letterbox it down to nothing.
   */
  photo: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.surface2 },
  missing: { marginVertical: s(18) },
});

export default InvoiceViewer;
