/**
 * Full detail for a single order: items, delivery, V62 submission (if
 * any), invoice upload/send, and download/print.
 */
import React, {useState} from 'react';
import {Share, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';

import AppBar from '../components/AppBar';
import {Body, Screen} from '../components/Screen';
import {Countdown} from '../components/Countdown';
import {
  Badge,
  Banner,
  Cta,
  Eyebrow,
  Field,
  H2,
  Input,
  List,
  ListItem,
  Row2,
  SummaryRow,
} from '../components/ui';
import {useToast} from '../components/Toast';
import {colors, font, s} from '../theme/tokens';
import {gbp, statusInfo} from '../data/mock';
import type {Order} from '../data/mock';
import {useSupplier} from '../state/SupplierState';
import type {RootNav, RootStackParamList} from '../navigation/types';

function formatOrderText(order: Order) {
  const lines = [
    'TaxMyMotor — Order ' + order.orderNumber,
    '',
    'Customer: ' + order.customerName,
    'Phone: ' + order.customerPhone,
    'Vehicle: ' + order.reg + ' — ' + order.vehicleModel,
    'Plan: ' + order.plan,
    'Ordered: ' + order.orderDate,
    'Delivery: ' + order.deliveryAddress,
    '',
    'Items:',
    ...order.items.map(item => '  ' + item.qty + ' x ' + item.name),
    '',
    'Total: ' + gbp(order.total),
    'Supplier response: ' + order.supplierResponse,
    'Invoice status: ' + order.invoiceStatus,
  ];
  return lines.join('\n');
}

export default function OrderDetailScreen() {
  const navigation = useNavigation<RootNav>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const toast = useToast();
  const {orders, now, acceptOrder, uploadInvoice, sendToCustomer} =
    useSupplier();

  const order = orders.find(o => o.id === route.params.orderId);
  const [fileName, setFileName] = useState(
    order ? 'invoice-' + order.orderNumber + '.pdf' : 'invoice.pdf',
  );

  if (!order) {
    return (
      <Screen>
        <AppBar onBack={() => navigation.goBack()} title="Order" />
        <Body>
          <Text>Order not found.</Text>
        </Body>
      </Screen>
    );
  }

  const info = statusInfo(order.status);

  const onDownload = async () => {
    try {
      await Share.share({
        title: 'Order ' + order.orderNumber,
        message: formatOrderText(order),
      });
      toast({message: 'Order ready to download', icon: 'download'});
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  };

  const onPrint = async () => {
    /*
     * React Native has no `window.print()`. A real build would hand
     * this to a native print/PDF module; the share sheet is the
     * closest zero-dependency stand-in for this prototype.
     */
    try {
      await Share.share({
        title: 'Print order ' + order.orderNumber,
        message: formatOrderText(order),
      });
      toast({message: 'Sent to print', icon: 'print'});
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  };

  const onUpload = () => {
    if (!fileName.trim()) {
      toast({message: 'Choose a file name', icon: 'info'});
      return;
    }
    uploadInvoice(order.id, fileName.trim());
    toast({message: 'Invoice uploaded', icon: 'check'});
  };

  const onSend = () => {
    sendToCustomer(order.id);
    toast({message: 'Invoice sent to customer', icon: 'send'});
  };

  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} title={order.orderNumber} />
      <Body>
        <View style={styles.headRow}>
          <H2 style={{marginBottom: 0}}>{order.customerName}</H2>
          <Badge label={info.label} tone={info.tone} />
        </View>
        <Text style={styles.sub}>
          {order.reg} · {order.vehicleModel}
        </Text>

        {order.status === 'awaiting_supplier' ? (
          <View style={{marginBottom: s(16)}}>
            <Banner icon="clock" tone="orange" style={{marginBottom: s(11)}}>
              Response required
            </Banner>
            <View style={styles.timerRow}>
              <Countdown assignedAt={order.assignedAt} now={now} />
            </View>
            <Cta label="Accept Order" onPress={() => acceptOrder(order.id)} />
          </View>
        ) : null}

        {order.status === 'overdue' ? (
          <Banner icon="alert" tone="red" style={{marginBottom: s(16)}}>
            Supplier response overdue — no action taken within 7 minutes.
          </Banner>
        ) : null}

        <Eyebrow>Order information</Eyebrow>
        <List style={{marginBottom: s(16)}}>
          <ListItem icon="doc" title="Plan" value={order.plan} />
          <ListItem icon="cal" title="Order date" value={order.orderDate} />
          <ListItem
            icon="car"
            title="Vehicle"
            value={order.reg + ' · ' + order.vehicleModel}
          />
          <ListItem
            icon="home"
            title="Delivery address"
            value={order.deliveryAddress}
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
        <List style={{marginBottom: s(16)}}>
          <ListItem
            icon={order.communicationMethod === 'whatsapp' ? 'whatsapp' : 'mail'}
            title="Preferred channel"
            value={order.communicationMethod === 'whatsapp' ? 'WhatsApp' : 'Email'}
            last={!order.whatsappRequested}
          />
          {order.whatsappRequested ? (
            <ListItem
              icon="whatsapp"
              title="WhatsApp Requested"
              value="Customer asked to be contacted on WhatsApp"
              last
            />
          ) : null}
        </List>

        {order.v62Requested && order.v62 ? (
          <>
            <Eyebrow>V62 registration certificate</Eyebrow>
            <List style={{marginBottom: s(16)}}>
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
              />
              <ListItem
                icon="user"
                title="Keeper"
                value={order.v62.keeperName}
              />
              <ListItem
                icon="home"
                title="Keeper address"
                value={order.v62.keeperAddress}
                last
              />
            </List>
          </>
        ) : null}

        <Eyebrow>Invoice</Eyebrow>
        {order.invoiceStatus === 'sent' ? (
          <Banner icon="check" tone="green" style={{marginBottom: s(16)}}>
            Invoice Sent{order.invoiceFileName ? ' — ' + order.invoiceFileName : ''}
          </Banner>
        ) : order.invoiceStatus === 'uploaded' || order.invoiceStatus === 'ready' ? (
          <View style={{marginBottom: s(16)}}>
            <Banner icon="check" tone="green" style={{marginBottom: s(11)}}>
              Invoice Uploaded — {order.invoiceFileName}
            </Banner>
            <Cta label="Send to Customer" icon="send" onPress={onSend} />
          </View>
        ) : order.supplierResponse === 'accepted' ? (
          <View style={{marginBottom: s(16)}}>
            <Field label="Invoice file name">
              <Input
                value={fileName}
                onChangeText={setFileName}
                placeholder="invoice.pdf"
              />
            </Field>
            <Cta label="Upload Invoice" icon="upload" onPress={onUpload} />
          </View>
        ) : (
          <Banner icon="doc" tone="orange" style={{marginBottom: s(16)}}>
            Invoice Pending — accept the order to upload an invoice.
          </Banner>
        )}

        <Eyebrow>Order document</Eyebrow>
        <Row2>
          <Cta
            variant="ghost"
            label="Download Order"
            icon="download"
            onPress={onDownload}
          />
          <Cta variant="ghost" label="Print Order" icon="print" onPress={onPrint} />
        </Row2>
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: s(18),
  },
  timerRow: {marginBottom: s(11)},
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
