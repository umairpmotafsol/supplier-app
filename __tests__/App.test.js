/**
 * @format
 */
/* eslint-env jest */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { persistStore } from 'redux-persist';

/*
 * App.js imports the default store, which starts redux-persist on import,
 * and redux-persist 6 arms a rehydrate timeout it never clears. Fake
 * timers keep that from holding Jest open; promises still resolve, so
 * rehydration itself runs for real against the AsyncStorage mock.
 */
jest.useFakeTimers();

const App = require('../App').default;
const { setupStore } = require('../src/store/setupStore');

const strings = tree => {
  const out = [];
  const walk = node => {
    if (typeof node === 'string') {
      out.push(node);
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === 'object') {
      walk(node.children);
    }
  };
  walk(tree.toJSON());
  return out;
};

/** Lets PersistGate's async rehydrate settle. */
const settle = () =>
  ReactTestRenderer.act(async () => {
    await Promise.resolve();
    jest.advanceTimersByTime(0);
    await Promise.resolve();
  });

afterAll(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('renders correctly', async () => {
  let renderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    renderer.unmount();
  });
});

test('gets past the PersistGate to the sign-in screen', async () => {
  const store = setupStore();
  const persistor = persistStore(store);

  let renderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <App store={store} persistor={persistor} />,
    );
  });
  for (let i = 0; i < 5 && strings(renderer).length === 0; i += 1) {
    await settle();
  }

  const text = strings(renderer);
  expect(text).toContain('SUPPLIER PORTAL');
  expect(text).toContain('Sign in');

  await ReactTestRenderer.act(() => renderer.unmount());
});
