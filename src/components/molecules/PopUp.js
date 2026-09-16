/**
 * A dialog that says something and offers up to two ways out.
 *
 * Use it instead of `Alert.alert`: the system alert is the one piece of
 * UI the app cannot style, and next to this app's dark surfaces it looks
 * like it belongs to a different product. This also lets the tone drive
 * the icon and accent, which is how the rest of the app reports state.
 *
 *   <PopUp
 *     visible={blocked}
 *     tone="orange"
 *     title="Camera is off"
 *     message={blockedMessage('camera')}
 *     confirmLabel="Open Settings"
 *     onConfirm={openAppSettings}
 *     cancelLabel="Not now"
 *     onCancel={() => setBlocked(false)}
 *   />
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, font, radius, s, track } from '../../theme/tokens';
import CustomButton from '../atoms/CustomButton';
import CustomText from '../atoms/CustomText';
import Icon from '../atoms/Icon';
import ModalSkeleton from './ModalSkeleton';

const TONES = {
  orange: { accent: colors.orange, icon: 'info' },
  red: { accent: colors.red, icon: 'alert' },
  green: { accent: colors.green, icon: 'check' },
  neutral: { accent: colors.line, icon: 'info' },
};

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {string} props.title
 * @param {string} [props.message]
 * @param {'orange'|'red'|'green'|'neutral'} [props.tone]
 * @param {string} [props.icon] overrides the tone's glyph
 * @param {string} [props.confirmLabel] omit to show no primary action
 * @param {() => void} [props.onConfirm]
 * @param {string} [props.cancelLabel] omit to show no secondary action
 * @param {() => void} [props.onCancel] also the backdrop/back handler
 * @param {boolean} [props.busy] spinner on the primary action
 * @param {boolean} [props.dismissable]
 */
export default function PopUp({
  visible,
  title,
  message,
  tone = 'orange',
  icon,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  busy,
  dismissable = true,
  children,
}) {
  const { accent, icon: toneIcon } = TONES[tone] ?? TONES.neutral;

  return (
    <ModalSkeleton
      visible={visible}
      onClose={onCancel}
      dismissable={dismissable}
      accent={accent}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.surface2 }]}>
          <Icon
            name={icon ?? toneIcon}
            size={s(16)}
            color={accent}
            strokeWidth={2.2}
          />
        </View>
        <CustomText variant="h3" style={styles.title}>
          {title}
        </CustomText>
      </View>

      {message ? (
        <CustomText style={styles.message}>{message}</CustomText>
      ) : null}

      {children}

      <View style={styles.actions}>
        {confirmLabel ? (
          <CustomButton
            label={confirmLabel}
            onPress={onConfirm}
            loading={busy}
          />
        ) : null}
        {cancelLabel ? (
          <CustomButton
            variant="ghost"
            label={cancelLabel}
            onPress={onCancel}
            disabled={busy}
          />
        ) : null}
      </View>
    </ModalSkeleton>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(9),
    marginBottom: s(10),
  },
  badge: {
    width: s(28),
    height: s(28),
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginBottom: 0,
    fontFamily: font.display,
    letterSpacing: track(-0.02, s(13)),
  },
  message: {
    marginBottom: s(14),
  },
  actions: { gap: s(9) },
});
