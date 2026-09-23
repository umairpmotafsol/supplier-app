/**
 * Full detail for a single order — the supplier's fallback route to the
 * camera, since the landing page already offers Upload Invoice directly.
 *
 * Suppliers only: an admin's view is a list with no per-order screen, and
 * they send WhatsApp orders from the share sheet on their own board.
 *
 * There is no accept action (orders arrive assigned) and no download.
 *
 * It shows the order, not the person behind it. A supplier raises an
 * invoice against an order number and a plate, so the customer's name
 * and home address are not theirs to hold — the only name here is the
 * account holder on a Direct Debit mandate, which is the mandate.
 *
 * A Direct Debit order carries one extra job: checking the customer's
 * mandate details. Until those are approved the invoice button is not
 * here, because an invoice raised against a mandate that was never
 * agreed is the thing the check exists to prevent.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import CustomHeader from '../components/molecules/CustomHeader';
import { Body, Dock, Screen } from '../components/Screen';
import { Countdown } from '../components/Countdown';
import { BankPanel, BankThread } from '../components/BankPanel';
import {
  Badge,
  Banner,
  Cta,
  Eyebrow,
  H2,
  List,
  ListItem,
  SummaryRow,
} from '../components/ui';
import { colors, font, s } from '../theme/tokens';
import {
  ORDER_TYPE_LABEL,
  awaitingWhatsappSend,
  bankAwaitingReview,
  bankWithCustomer,
  canUploadInvoice,
  formatTimeAgo,
  gbp,
  hasBankReview,
  statusInfo,
} from '../data/mock';
import { useToast } from '../components/molecules/Toast';
import { useSupplier } from '../store/useSupplier';
import { ROUTES } from '../navigation/routes';

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { orders, now, approveBankDetails } = useSupplier();

  const order = orders.find(o => o.id === route.params.orderId);

  if (!order) {
    return (
      <Screen>
        <CustomHeader onBack={() => navigation.goBack()} title="Order" />
        <Body>
          <Text style={styles.missing}>Order not found.</Text>
        </Body>
      </Screen>
    );
  }

  const info = statusInfo(order.status);
  const canUpload = canUploadInvoice(order);
  const review = order.bankReview;

  const onApprove = async () => {
    try {
      await approveBankDetails(order.id);
      toast({ message: 'Bank details approved', icon: 'check' });
    } catch {
      // The axios layer has already toasted why.
    }
  };

  return (
    <Screen>
      <CustomHeader
        onBack={() => navigation.goBack()}
        title={order.orderNumber}
      />
      <Body>
        <View style={styles.headRow}>
          <H2 style={{ marginBottom: 0 }}>{order.vehicleModel}</H2>
          <Badge label={info.label} tone={info.tone} />
        </View>
        <Text style={styles.sub}>{order.reg}</Text>

        {order.status === 'overdue' ? (
          <Banner icon="alert" tone="red" style={{ marginBottom: s(14) }}>
            Past the 7-minute window — the admin has been notified. Upload the
            invoice now.
          </Banner>
        ) : null}

        <View style={styles.timerCard}>
          <Countdown order={order} now={now} />
        </View>

        <Eyebrow>Order information</Eyebrow>
        <List style={{ marginBottom: s(16) }}>
          <ListItem icon="doc" title="Order number" value={order.orderNumber} />

          <ListItem
            icon="doc"
            title="Order type"
            value={ORDER_TYPE_LABEL[order.orderType]}
          />

          <ListItem
            icon="cal"
            title="Order date"
            value={order.orderDate}
            last
          />
        </List>

        <Eyebrow>Items</Eyebrow>
        <View style={styles.itemsCard}>
          {order.items.map((item, i) => (
            <SummaryRow key={i} label={item.name} value={'× ' + item.qty} />
          ))}
          <SummaryRow label="Total" value={gbp(order.total)} />
        </View>

        <Eyebrow>Communication</Eyebrow>
        <List style={{ marginBottom: s(16) }}>
          <ListItem
            icon={
              order.communicationMethod === 'whatsapp' ? 'whatsapp' : 'mail'
            }
            title="Preferred channel"
            value={
              order.communicationMethod === 'whatsapp' ? 'WhatsApp' : 'Email'
            }
            last
          />
        </List>

        {order.v62Requested && order.v62 ? (
          <>
            <Eyebrow>V62 registration certificate</Eyebrow>
            <List style={{ marginBottom: s(16) }}>
              <ListItem
                icon="check"
                title="V62 Submitted"
                value="Submitted by the customer during checkout"
              />

              <ListItem
                icon="car"
                title="Registration number"
                value={order.v62.registrationNumber}
              />

              <ListItem
                icon="doc"
                title="Make & model"
                value={order.v62.makeModel}
              />

              <ListItem icon="edit" title="Colour" value={order.v62.colour} />
              <ListItem
                icon="doc"
                title="Taxation class"
                value={order.v62.taxationClass}
                last
              />
            </List>
          </>
        ) : null}

        {hasBankReview(order) && order.bank && review ? (
          <>
            <Eyebrow>Direct Debit mandate</Eyebrow>

            {review.status === 'approved' ? (
              <Banner icon="check" tone="green" style={styles.banner}>
                Bank details approved — the mandate can be set up.
              </Banner>
            ) : bankWithCustomer(order) ? (
              <Banner icon="clock" tone="orange" style={styles.banner}>
                Sent back to the customer. The upload timer is paused until they
                return it.
              </Banner>
            ) : (
              <Banner icon="bank" tone="orange" style={styles.banner}>
                Check these against the customer's mandate before the invoice
                can be raised.
              </Banner>
            )}

            <BankPanel bank={order.bank} flagged={review.flagged} />
            <BankThread notes={review.notes} />

            {bankAwaitingReview(order) ? (
              <View style={styles.reviewActs}>
                <Cta label="Approve details" icon="check" onPress={onApprove} />
                <Cta
                  variant="ghost"
                  label="Request changes"
                  icon="edit"
                  iconPosition="leading"
                  onPress={() =>
                    navigation.navigate(ROUTES.REQUEST_BANK_CHANGES, {
                      orderId: order.id,
                    })
                  }
                />
              </View>
            ) : null}
          </>
        ) : null}

        <Eyebrow>Invoice</Eyebrow>
        {order.invoicePhoto ? (
          <Banner icon="check" tone="green" style={{ marginBottom: s(16) }}>
            Invoice uploaded — captured at{' '}
            {formatTimeAgo(order.invoicePhoto.capturedAt)}
          </Banner>
        ) : canUpload ? (
          <Banner icon="camera" tone="orange" style={{ marginBottom: s(16) }}>
            Photograph the invoice to complete this order.
          </Banner>
        ) : (
          <Banner icon="alert" tone="red" style={{ marginBottom: s(16) }}>
            Blocked until the bank details are approved.
          </Banner>
        )}

        <Eyebrow>Delivery</Eyebrow>
        {order.deliveredAt ? (
          <Banner icon="check" tone="green" style={{ marginBottom: s(16) }}>
            Sent to the customer over WhatsApp.
          </Banner>
        ) : awaitingWhatsappSend(order) ? (
          <Banner icon="whatsapp" tone="orange" style={{ marginBottom: s(16) }}>
            Customer chose WhatsApp. An admin sends this one.
          </Banner>
        ) : (
          <Banner icon="mail" tone="green" style={{ marginBottom: s(16) }}>
            {order.communicationMethod === 'whatsapp'
              ? 'Waiting on the invoice before it can be sent.'
              : 'Customer chose email — sent automatically with the invoice.'}
          </Banner>
        )}
      </Body>

      {canUpload ? (
        <Dock standalone>
          <Cta
            label="Upload Invoice"
            icon="camera"
            onPress={() =>
              navigation.navigate(ROUTES.CAPTURE_INVOICE, { orderId: order.id })
            }
          />
        </Dock>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  missing: { fontFamily: font.regular, color: colors.ink2 },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: s(10),
  },
  sub: {
    fontFamily: font.regular,
    fontSize: s(11),
    color: colors.ink3,
    marginTop: s(4),
    marginBottom: s(14),
  },
  timerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: s(14),
    padding: s(13),
    marginBottom: s(18),
  },
  banner: { marginBottom: s(12) },
  reviewActs: { gap: s(9), marginBottom: s(16) },
  itemsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: s(14),
    paddingHorizontal: s(13),
    paddingVertical: s(4),
    marginBottom: s(16),
  },
});
