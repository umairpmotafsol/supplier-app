/**
 * A bottom sheet, driven by a `visible` prop.
 *
 * `@gorhom/bottom-sheet` is imperative — you hold a ref and call
 * `present()` / `dismiss()`. Every screen in this app describes what is
 * on screen with state, so this wraps the ref up and takes a boolean
 * instead, and reports a swipe-to-close back through `onClose` so the
 * two never drift apart.
 *
 * Requires `BottomSheetModalProvider` above it — mounted once in
 * `App.js` — and Gesture Handler's root view, which `App.js` also
 * mounts.
 *
 *   <CustomBottomSheet visible={picking} onClose={close} title="Add a photo">
 *     …rows…
 *   </CustomBottomSheet>
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, s } from '../../theme/tokens';
import CustomText from '../atoms/CustomText';

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onClose fired by the backdrop, the swipe and Android back
 * @param {string} [props.title]
 * @param {(string|number)[]} [props.snapPoints] defaults to content height
 * @param {boolean} [props.glass] iOS 26 liquid-glass background, where supported
 */
export default function CustomBottomSheet({
  visible,
  onClose,
  title,
  snapPoints,
  glass = false,
  children,
}) {
  const ref = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  /*
   * Fired for every close, including a swipe down, which is the one the
   * `visible` prop cannot see coming.
   */
  const handleDismiss = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.66}
        pressBehavior="close"
      />
    ),
    [],
  );

  /*
   * Liquid glass is opt-in and iOS 26+. Everywhere else — and by default
   * — the sheet uses the app's own surface, so the design does not
   * change underneath anyone.
   */
  const useGlass = glass && isLiquidGlassSupported;

  const backgroundComponent = useMemo(
    () =>
      useGlass
        ? ({ style }) => (
            <LiquidGlassView
              style={[style, styles.background, styles.glass]}
              interactive
            />
          )
        : undefined,
    [useGlass],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundComponent={backgroundComponent}
      backgroundStyle={useGlass ? undefined : styles.background}
      handleIndicatorStyle={styles.handle}
      enablePanDownToClose
    >
      <BottomSheetView
        style={[styles.content, { paddingBottom: insets.bottom + s(16) }]}
      >
        {title ? (
          <CustomText variant="h3" style={styles.title}>
            {title}
          </CustomText>
        ) : null}
        <View>{children}</View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  glass: { backgroundColor: 'transparent' },
  handle: { backgroundColor: colors.ink4, width: s(36) },
  content: {
    paddingHorizontal: s(16),
    paddingTop: s(6),
  },
  title: { marginBottom: s(12) },
});
