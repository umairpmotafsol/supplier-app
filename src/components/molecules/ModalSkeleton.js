/**
 * The shell every centred modal in the app is built from: a dimmed
 * backdrop, a card in the middle of it, and the rules about dismissing.
 *
 * It owns two decisions so that no dialog has to make them again:
 *
 *  - `dismissable` false locks the dialog: neither the backdrop nor
 *    Android's back button closes it — a question the app is waiting on
 *    an answer to should not vanish by accident;
 *  - `closeOnBackdrop` false keeps the back button working but ignores
 *    backdrop taps, for alerts that must be answered with a button but
 *    may still be backed out of (the order alerts behave this way).
 *
 * It draws the card and nothing inside it; `PopUp`, `AreYouSure` and the
 * order alerts supply their own content.
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, s } from '../../theme/tokens';

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} [props.onClose]
 * @param {boolean} [props.dismissable] false = nothing but a button closes it
 * @param {boolean} [props.closeOnBackdrop] false = backdrop taps are ignored
 * @param {boolean} [props.statusBarTranslucent] Android: dim under the status bar
 * @param {string} [props.accent] border colour of the card
 * @param {'fade' | 'slide' | 'none'} [props.animationType]
 */
export default function ModalSkeleton({
  visible,
  onClose,
  dismissable = true,
  closeOnBackdrop = true,
  statusBarTranslucent = false,
  accent = colors.line,
  animationType = 'fade',
  children,
  style,
  testID,
}) {
  const close = () => {
    if (dismissable) {
      onClose?.();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={close}
      statusBarTranslucent={statusBarTranslucent}
      testID={testID}
    >
      <View style={styles.backdrop}>
        {/*
         * The backdrop is the dismiss target, so it is a Pressable
         * filling the screen *behind* the card rather than a wrapper
         * around it — a wrapper would swallow taps meant for the card.
         */}
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          style={StyleSheet.absoluteFill}
          onPress={closeOnBackdrop ? close : undefined}
        />
        {visible ? (
          <View
            style={[
              styles.sheet,
              accent === colors.line ? styles.hairline : styles.accented,
              { borderColor: accent },
              style,
            ]}
          >
            {children}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.66)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: s(18),
  },
  /* A neutral card gets a hairline; an accented one reads heavier. */
  hairline: { borderWidth: 1 },
  accented: { borderWidth: 1.5 },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: s(16),
  },
});
