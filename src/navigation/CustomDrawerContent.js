/**
 * What the drawer shows: who is signed in, the drawer's routes, and
 * sign-out — drawn with the app bar's colours rather than the library's
 * default white panel.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';

import CustomText from '../components/atoms/CustomText';
import Icon, { iconSize } from '../components/atoms/Icon';
import { useSupplier } from '../store/useSupplier';
import { colors, font, radius, s, track } from '../theme/tokens';

export default function CustomDrawerContent(props) {
  const { session, isAdmin, signOut } = useSupplier();

  const subtitle = isAdmin ? 'Admin — monitoring' : 'Supplier';

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
      <View style={styles.who}>
        <CustomText style={styles.portal}>SUPPLIER PORTAL</CustomText>
        <CustomText variant="h3" style={styles.name}>
          {session?.name ?? 'Signed out'}
        </CustomText>
        <CustomText variant="sub" style={styles.sub}>
          {subtitle}
        </CustomText>
      </View>

      <DrawerItemList {...props} />

      <View style={styles.spacer} />

      {session ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={() => {
            props.navigation.closeDrawer();
            signOut();
          }}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
        >
          <Icon name="logout" size={iconSize.md} color={colors.ink2} />
          <CustomText variant="label">Sign out</CustomText>
        </Pressable>
      ) : null}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: s(8) },
  who: {
    paddingHorizontal: s(10),
    paddingBottom: s(14),
    marginBottom: s(8),
    borderBottomWidth: 1.5,
    borderBottomColor: colors.orange,
  },
  portal: {
    fontFamily: font.semibold,
    fontSize: s(9),
    letterSpacing: track(0.18, s(9)),
    color: colors.orange,
    marginBottom: s(8),
  },
  name: { marginBottom: s(2) },
  sub: { marginBottom: 0 },
  spacer: { flex: 1 },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    padding: s(12),
    marginBottom: s(8),
    borderRadius: radius.ctl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: { backgroundColor: colors.surface2 },
});
