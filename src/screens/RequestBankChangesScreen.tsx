/**
 * REQUEST BANK CHANGES
 * What the supplier fills in when a Direct Debit order's mandate details
 * are wrong: which fields are wrong, and why.
 *
 * Both halves are required. Handing an order back saying only "there's a
 * problem" gives the customer nothing to act on and buys another round
 * trip, so the send button stays shut until at least one field is ticked
 * and a note has been written.
 */
import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';

import AppBar from '../components/AppBar';
import {Body, Dock, Screen} from '../components/Screen';
import {Banner, Cta, Eyebrow, H2, Hint, Input} from '../components/ui';
import Icon from '../components/Icon';
import {useToast} from '../components/Toast';
import {colors, font, radius, s} from '../theme/tokens';
import {common} from '../theme/common';
import {
  BANK_FIELDS,
  BANK_FIELD_LABEL,
  BankField,
  bankAwaitingReview,
} from '../data/mock';
import {useSupplier} from '../state/SupplierState';
import type {RootNav, RootStackParamList} from '../navigation/types';

export default function RequestBankChangesScreen() {
  const navigation = useNavigation<RootNav>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'RequestBankChanges'>>();
  const toast = useToast();
  const {orders, requestBankChanges} = useSupplier();

  const [picked, setPicked] = useState<BankField[]>([]);
  const [message, setMessage] = useState('');

  const order = orders.find(o => o.id === route.params.orderId);

  if (!order || !order.bank || !bankAwaitingReview(order)) {
    return (
      <Screen>
        <AppBar onBack={() => navigation.goBack()} title="Bank details" />
        <Body>
          <Text style={styles.missing}>
            This order is not waiting on a bank check.
          </Text>
        </Body>
      </Screen>
    );
  }

  const bank = order.bank;
  const toggle = (field: BankField) =>
    setPicked(current =>
      current.includes(field)
        ? current.filter(f => f !== field)
        : [...current, field],
    );

  const onSend = () => {
    if (picked.length === 0) {
      toast({message: 'Tick what needs correcting', icon: 'info'});
      return;
    }
    if (message.trim().length < 5) {
      toast({message: 'Say what is wrong with it', icon: 'info'});
      return;
    }
    requestBankChanges(order.id, picked, message.trim());
    toast({message: 'Sent back to the customer', icon: 'check'});
    navigation.goBack();
  };

  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} title={order.orderNumber} />
      <Body>
        <H2>Request changes</H2>
        <Banner icon="info" tone="orange" style={styles.banner}>
          The order goes back to the customer and the upload timer pauses
          until they return it.
        </Banner>

        <Eyebrow>What needs correcting?</Eyebrow>
        <View style={styles.list}>
          {BANK_FIELDS.map((field, index) => {
            const on = picked.includes(field);
            return (
              <Pressable
                key={field}
                accessibilityRole="checkbox"
                accessibilityState={{checked: on}}
                accessibilityLabel={BANK_FIELD_LABEL[field]}
                onPress={() => toggle(field)}
                style={[
                  styles.row,
                  index === BANK_FIELDS.length - 1 && common.flush,
                ]}>
                <View style={[styles.box, on && styles.boxOn]}>
                  {on ? (
                    <Icon
                      name="check"
                      size={s(11)}
                      color={colors.onOrange}
                      strokeWidth={3}
                    />
                  ) : null}
                </View>
                <View style={common.fill}>
                  <Text style={styles.label}>{BANK_FIELD_LABEL[field]}</Text>
                  <Text style={styles.value} numberOfLines={1}>
                    {bank[field] || '—'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Eyebrow>Note to the customer</Eyebrow>
        <Input
          value={message}
          onChangeText={setMessage}
          placeholder="The sort code is only five digits — please check it against your statement."
          multiline
          style={styles.note}
        />

        <Hint icon="info">
          They see this note and the ticked fields, and can correct
          anything else they spot while they are there.
        </Hint>
      </Body>

      <Dock standalone>
        <Cta label="Send back to customer" icon="send" onPress={onSend} />
      </Dock>
    </Screen>
  );
}

const styles = StyleSheet.create({
  missing: {fontFamily: font.regular, color: colors.ink2},
  banner: {marginBottom: s(18)},
  list: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: s(13),
    marginBottom: s(18),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(11),
    paddingVertical: s(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  box: {
    width: s(19),
    height: s(19),
    borderRadius: s(6),
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {backgroundColor: colors.orange, borderColor: colors.orange},
  label: {fontFamily: font.semibold, fontSize: s(11.5), color: colors.ink},
  value: {
    fontFamily: font.regular,
    fontSize: s(10.5),
    color: colors.ink3,
    marginTop: s(2),
  },
  note: {minHeight: s(84), textAlignVertical: 'top', paddingVertical: s(11)},
});
