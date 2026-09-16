/**
 * Lightweight confirmation toast. Used for the prototype's simulated
 * side-effects (documents "downloaded", codes copied, links shared) and
 * for the errors the axios interceptor reports.
 *
 * Two ways in, one toast:
 *  - `useToast()` inside a component, which is what the screens use;
 *  - `showToast()` from anywhere, for code that is not in the tree (the
 *    axios interceptor, a thunk). It forwards to the mounted provider,
 *    and is a no-op before one is mounted rather than a crash.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius, s } from '../../theme/tokens';
import Icon, { iconSize } from '../atoms/Icon';

const ToastContext = createContext(() => {});

export const useToast = () => useContext(ToastContext);

/**
 * The mounted provider's `show`, or null. A module-level handle is the
 * only way to reach the toast from outside React; it is set on mount and
 * cleared on unmount so a stale provider is never called.
 */
let currentShow = null;

/**
 * Shows a toast from outside the component tree.
 *
 * @param {{message: string, icon?: string} | string} toast
 * @returns {boolean} false when no provider is mounted
 */
export function showToast(toast) {
  if (!currentShow) {
    return false;
  }
  currentShow(toast);
  return true;
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);
  const insets = useSafeAreaInsets();

  const show = useCallback(next => {
    setToast(typeof next === 'string' ? { message: next } : next);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();

    timer.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 2000);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [toast, opacity]);

  /* Publish this provider's `show` for callers outside the tree. */
  useEffect(() => {
    currentShow = show;
    return () => {
      if (currentShow === show) {
        currentShow = null;
      }
    };
  }, [show]);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.wrap, { opacity, bottom: insets.bottom + s(84) }]}
        >
          <View style={styles.toast}>
            <Icon
              name={toast.icon ?? 'check'}
              size={iconSize.sm}
              color={colors.orange}
              strokeWidth={2.4}
            />

            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: s(20),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: s(10),
    paddingHorizontal: s(16),
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  text: {
    fontFamily: font.semibold,
    fontSize: s(11),
    color: colors.ink,
  },
});
