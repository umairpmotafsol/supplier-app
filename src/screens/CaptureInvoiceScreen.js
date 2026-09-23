/**
 * The camera step: Upload Invoice -> shutter -> review -> Submit.
 *
 * Two taps after the button, which is as short as the flow gets while
 * still letting the supplier see they photographed the right document —
 * so the shot is shown back to them full-frame before it goes anywhere.
 *
 * The shutter opens the device camera through src/lib/camera.js. A
 * capture that produces no photo is not always a failure: backing out
 * and a refused permission are both ordinary, and only a permission
 * that has been turned off for good is worth interrupting them over.
 */
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import CustomHeader from '../components/molecules/CustomHeader';
import { Body, Dock, Screen } from '../components/Screen';
import { Cta } from '../components/ui';
import { useToast } from '../components/molecules/Toast';
import PopUp from '../components/molecules/PopUp';
import Icon from '../components/atoms/Icon';
import { colors, font, radius, s, track } from '../theme/tokens';
import { captureInvoicePhoto } from '../lib/camera';
import { blockedMessage, openAppSettings } from '../resources/utils/permissions';
import { useSupplier } from '../store/useSupplier';
import { ROUTES } from '../navigation/routes';

export default function CaptureInvoiceScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { orders, uploadInvoice } = useSupplier();
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** The permission the OS will no longer prompt for, if any. */
  const [blocked, setBlocked] = useState(null);

  const order = orders.find(o => o.id === route.params.orderId);

  if (!order) {
    return (
      <Screen>
        <CustomHeader onBack={() => navigation.goBack()} title="Invoice" />
        <Body>
          <Text style={styles.missing}>Order not found.</Text>
        </Body>
      </Screen>
    );
  }

  const onShutter = async () => {
    setBusy(true);
    const result = await captureInvoicePhoto();
    setBusy(false);

    switch (result.status) {
      case 'picked':
        setPhoto(result.photo);
        break;
      case 'blocked':
        /* The OS will not ask again, so offer Settings instead. */
        setBlocked(result.permission);
        break;
      case 'error':
        toast({ message: result.message, icon: 'alert' });
        break;
      default:
        /* cancelled / denied: they chose not to. The next tap asks again. */
        break;
    }
  };

  const onSubmit = async () => {
    if (!photo || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await uploadInvoice(order.id, photo);
      toast({ message: 'Invoice uploaded — order complete', icon: 'check' });
      // Straight back to the list; the order is finished from here.
      navigation.navigate(ROUTES.MAIN);
    } catch {
      // The axios layer has already toasted why; stay put and let them retry.
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <CustomHeader
        onBack={() => navigation.goBack()}
        title={order.orderNumber}
      />
      <Body>
        <Text style={styles.caption}>
          {photo
            ? 'Check the invoice is readable, then submit.'
            : 'Fit the whole invoice in the frame.'}
        </Text>

        <View style={[styles.viewfinder, photo && styles.viewfinderShot]}>
          {photo ? (
            /*
             * The shot itself, contained rather than cropped: a corner
             * cut off here is a total they cannot read later.
             */
            <Image
              source={{ uri: photo.uri }}
              style={styles.shot}
              resizeMode="contain"
              accessibilityLabel="The invoice you just photographed"
            />
          ) : (
            <>
              <Corner style={styles.tl} />
              <Corner style={styles.tr} />
              <Corner style={styles.bl} />
              <Corner style={styles.br} />
              <Icon
                name="camera"
                size={s(46)}
                color={colors.ink4}
                strokeWidth={1.4}
              />
              <Text style={styles.vfText}>TAP THE SHUTTER</Text>
            </>
          )}
        </View>
      </Body>

      <Dock standalone>
        {photo ? (
          <>
            <Cta
              label={submitting ? 'Uploading…' : 'Submit Invoice'}
              icon="check"
              disabled={submitting}
              onPress={onSubmit}
            />
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => setPhoto(null)}
              style={styles.retake}
            >
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

      <PopUp
        visible={!!blocked}
        tone="orange"
        icon="camera"
        title="Camera access needed"
        message={blocked ? blockedMessage(blocked) : ''}
        confirmLabel="Open Settings"
        onConfirm={() => {
          setBlocked(null);
          openAppSettings();
        }}
        cancelLabel="Not now"
        onCancel={() => setBlocked(null)}
      />
    </Screen>
  );
}

function Corner({ style }) {
  return <View style={[styles.corner, style]} />;
}

const CORNER = 22;

const styles = StyleSheet.create({
  missing: { fontFamily: font.regular, color: colors.ink2 },
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
  viewfinderShot: { borderColor: colors.green, overflow: 'hidden' },
  shot: { width: '100%', height: '100%' },
  vfText: {
    fontFamily: font.semibold,
    fontSize: s(9.5),
    letterSpacing: track(0.16, s(9.5)),
    color: colors.ink4,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.orange,
  },
  tl: { top: 14, left: 14, borderTopWidth: 2.5, borderLeftWidth: 2.5 },
  tr: { top: 14, right: 14, borderTopWidth: 2.5, borderRightWidth: 2.5 },
  bl: { bottom: 14, left: 14, borderBottomWidth: 2.5, borderLeftWidth: 2.5 },
  br: { bottom: 14, right: 14, borderBottomWidth: 2.5, borderRightWidth: 2.5 },
  retake: { alignItems: 'center', paddingVertical: s(11) },
  retakeText: {
    fontFamily: font.semibold,
    fontSize: s(11.5),
    color: colors.ink3,
  },
});
