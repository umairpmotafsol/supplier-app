/**
 * The camera step: Upload Invoice -> viewfinder -> shutter -> Submit.
 *
 * Two taps after the button, which is as short as the flow gets while
 * still letting the supplier see they photographed the right document.
 *
 * The viewfinder is drawn, not live. Opening the real camera needs a
 * native module that isn't installed here — see src/lib/camera.ts, which
 * is the one place that changes when it is.
 */
import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';

import AppBar from '../components/AppBar';
import {Body, Dock, Screen} from '../components/Screen';
import {Cta, Hint} from '../components/ui';
import {useToast} from '../components/Toast';
import Icon from '../components/Icon';
import {colors, font, radius, s, track} from '../theme/tokens';
import {HAS_NATIVE_CAMERA, captureInvoicePhoto} from '../lib/camera';
import type {InvoicePhoto} from '../data/mock';
import {useSupplier} from '../state/SupplierState';
import type {RootNav, RootStackParamList} from '../navigation/types';

export default function CaptureInvoiceScreen() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, 'CaptureInvoice'>>();
  const toast = useToast();
  const {orders, uploadInvoice} = useSupplier();
  const [photo, setPhoto] = useState<InvoicePhoto | null>(null);
  const [busy, setBusy] = useState(false);

  const order = orders.find(o => o.id === route.params.orderId);

  if (!order) {
    return (
      <Screen>
        <AppBar onBack={() => navigation.goBack()} title="Invoice" />
        <Body>
          <Text style={styles.missing}>Order not found.</Text>
        </Body>
      </Screen>
    );
  }

  const onShutter = async () => {
    setBusy(true);
    const shot = await captureInvoicePhoto(order.orderNumber);
    setBusy(false);
    if (shot) {
      setPhoto(shot);
    }
  };

  const onSubmit = () => {
    if (!photo) {
      return;
    }
    uploadInvoice(order.id, photo);
    toast({message: 'Invoice uploaded — order complete', icon: 'check'});
    // Straight back to the list; the order is finished from here.
    navigation.navigate('Main');
  };

  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} title={order.orderNumber} />
      <Body>
        <Text style={styles.caption}>
          {photo
            ? 'Check the invoice is readable, then submit.'
            : 'Fit the whole invoice in the frame.'}
        </Text>

        <View style={[styles.viewfinder, photo && styles.viewfinderShot]}>
          <Corner style={styles.tl} />
          <Corner style={styles.tr} />
          <Corner style={styles.bl} />
          <Corner style={styles.br} />
          <Icon
            name={photo ? 'doc' : 'camera'}
            size={s(46)}
            color={photo ? colors.green : colors.ink4}
            strokeWidth={1.4}
          />
          <Text style={[styles.vfText, photo && {color: colors.green}]}>
            {photo ? 'INVOICE CAPTURED' : 'CAMERA PREVIEW'}
          </Text>
          {photo ? (
            <Text style={styles.vfFile} numberOfLines={1}>
              {photo.uri.replace('mock://', '')}
            </Text>
          ) : null}
        </View>

        {HAS_NATIVE_CAMERA ? null : (
          <Hint icon="info">
            The device camera isn't wired up in this prototype, so the
            shutter stands in for a real capture. The flow, the timer and
            the upload are all real.
          </Hint>
        )}
      </Body>

      <Dock standalone>
        {photo ? (
          <>
            <Cta label="Submit Invoice" icon="check" onPress={onSubmit} />
            <Pressable
              accessibilityRole="button"
              onPress={() => setPhoto(null)}
              style={styles.retake}>
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
          </>
        ) : (
          <Cta
            label={busy ? 'Capturing…' : 'Take Photo'}
            icon="camera"
            disabled={busy}
            onPress={onShutter}
          />
        )}
      </Dock>
    </Screen>
  );
}

function Corner({style}: {style: object}) {
  return <View style={[styles.corner, style]} />;
}

const CORNER = 22;

const styles = StyleSheet.create({
  missing: {fontFamily: font.regular, color: colors.ink2},
  caption: {
    fontFamily: font.medium,
    fontSize: s(11.5),
    color: colors.ink2,
    marginBottom: s(14),
    textAlign: 'center',
  },
  viewfinder: {
    flex: 1,
    minHeight: s(220),
    borderRadius: radius.card,
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(10),
    marginBottom: s(14),
  },
  viewfinderShot: {borderColor: colors.green},
  vfText: {
    fontFamily: font.semibold,
    fontSize: s(9.5),
    letterSpacing: track(0.16, s(9.5)),
    color: colors.ink4,
  },
  vfFile: {
    fontFamily: font.regular,
    fontSize: s(10),
    color: colors.ink3,
    maxWidth: '80%',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.orange,
  },
  tl: {top: 14, left: 14, borderTopWidth: 2.5, borderLeftWidth: 2.5},
  tr: {top: 14, right: 14, borderTopWidth: 2.5, borderRightWidth: 2.5},
  bl: {bottom: 14, left: 14, borderBottomWidth: 2.5, borderLeftWidth: 2.5},
  br: {bottom: 14, right: 14, borderBottomWidth: 2.5, borderRightWidth: 2.5},
  retake: {alignItems: 'center', paddingVertical: s(11)},
  retakeText: {
    fontFamily: font.semibold,
    fontSize: s(11.5),
    color: colors.ink3,
  },
});
