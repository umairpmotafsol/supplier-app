/**
 * Sign-in for the supplier app. Two kinds of account use the same form:
 * a supplier, who sees only their own orders and does the work, and an
 * admin, who sees every supplier's orders and only monitors. The role
 * comes back from the account, so there is no "I am an admin" toggle to
 * get wrong.
 */
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Body, Dock, Screen } from '../components/Screen';
import { Banner, Cta, Field, H1, Input, Sub } from '../components/ui';
import { colors, font, s, track } from '../theme/tokens';
import { useSupplier } from '../store/useSupplier';

export default function LoginScreen() {
  const { signIn } = useSupplier();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const ok = await signIn(email, password);
    setSubmitting(false);
    if (!ok) {
      setError(true);
    }
  };

  return (
    <Screen>
      <Body center>
        <Text style={styles.name}>SUPPLIER PORTAL</Text>

        <H1>Sign in</H1>
        <Sub>Suppliers see their own orders. Admins see them all.</Sub>

        {error ? (
          <Banner icon="alert" tone="red" style={{ marginBottom: s(14) }}>
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
            placeholder="you@company.co.uk"
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
      </Body>
      <Dock standalone>
        <Cta
          label={submitting ? 'Signing in…' : 'Sign in'}
          disabled={submitting}
          onPress={submit}
        />
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
});
