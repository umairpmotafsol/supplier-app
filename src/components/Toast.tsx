/**
 * Lightweight confirmation toast. Used for the prototype's simulated
 * side-effects (documents "downloaded", codes copied, links shared).
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
import {Animated, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors, font, radius, s} from '../theme/tokens';
import Icon, {IconName, iconSize} from './Icon';

type ToastPayload = {message: string; icon?: IconName};

const ToastContext = createContext<(t: ToastPayload | string) => void>(
  () => {},
);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((next: ToastPayload | string) => {
    setToast(typeof next === 'string' ? {message: next} : next);
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

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {opacity, bottom: insets.bottom + s(84)},
          ]}>
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
    shadowOffset: {width: 0, height: 8},
    elevation: 6,
  },
  text: {
    fontFamily: font.semibold,
    fontSize: s(11),
    color: colors.ink,
  },
});
