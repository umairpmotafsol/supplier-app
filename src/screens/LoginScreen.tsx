/**
 * Sign-in for the supplier app. Two kinds of account use the same form:
 * a supplier, who sees only their own orders and does the work, and an
 * admin, who sees every supplier's orders and only monitors. The role
 * comes back from the account, so there is no "I am an admin" toggle to
 * get wrong.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Body, Dock, Screen} from '../components/Screen';
import {Banner, Cta, Eyebrow, Field, H1, Input, Sub} from '../components/ui';
import {colors, font, radius, s, track} from '../theme/tokens';
import {ACCOUNTS} from '../data/mock';
import {useSupplier} from '../state/SupplierState';

export default function LoginScreen() {
  const {signIn} = useSupplier();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (!signIn(email, password)) {
      setError(true);
    }
  };

  const applyAccount = (accountEmail: string, accountPassword: string) => {
    setEmail(accountEmail);
    setPassword(accountPassword);
    setError(false);
  };

  return (
    <Screen>
      <Body center>
        <Text style={styles.name}>SUPPLIER PORTAL</Text>

        <H1>Sign in</H1>
        <Sub>Suppliers see their own orders. Admins see them all.</Sub>

        {error ? (
          <Banner icon="alert" tone="red" style={{marginBottom: s(14)}}>
            Those credentials don't match an account.
          </Banner>
        ) : null}

        <Field label="Email">
          <Input
            value={email}
            onChangeText={value => {
              setEmail(value);
              setError(false);
            }}
            placeholder="supplier.a@partners.co.uk"
            autoCapitalize="none"
            keyboardType="email-address"
            leadingIcon="mail"
            invalid={error}
          />
        </Field>
        <Field label="Password">
          <Input
            value={password}
            onChangeText={value => {
              setPassword(value);
              setError(false);
            }}
            placeholder="••••••••"
            secureTextEntry
            leadingIcon="lock"
            invalid={error}
          />
        </Field>

        <Eyebrow>Development accounts</Eyebrow>
        <View style={styles.accounts}>
          {ACCOUNTS.map(account => (
            <Cta
              key={account.email}
              variant="ghost"
              icon={account.role === 'admin' ? 'shield' : 'user'}
              iconPosition="leading"
              label={
                account.role === 'admin'
                  ? 'Admin — ' + account.name
                  : account.name + ' (' + account.email.split('@')[0] + ')'
              }
              onPress={() => applyAccount(account.email, account.password)}
            />
          ))}
        </View>
      </Body>
      <Dock standalone>
        <Cta label="Sign in" onPress={submit} />
      </Dock>
    </Screen>
  );
}

const styles = StyleSheet.create({
  /*
   * The only mark on the screen. Set as a small tracked label rather
   * than a second headline, so it reads as the name of the tool and
   * doesn't compete with "Sign in".
   */
  name: {
    fontFamily: font.semibold,
    fontSize: s(11),
    letterSpacing: track(0.18, s(11)),
    color: colors.orange,
    marginBottom: s(20),
  },
  accounts: {
    gap: s(8),
    marginTop: s(2),
    padding: s(11),
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
});
