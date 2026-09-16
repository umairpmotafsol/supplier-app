/**
 * The active language.
 *
 * Every string in the supplier portal is written in en-GB (the order
 * copy, the currency and the date formats all assume it), so this slice
 * records the choice and the writing direction rather than shipping a
 * half-finished translation table. Adding a locale means adding it to
 * `LANGUAGES` and translating the screens; nothing else has to change.
 *
 * Persisted: a chosen language should survive a restart.
 */
import { createSlice } from '@reduxjs/toolkit';
import { I18nManager, NativeModules, Platform } from 'react-native';

export const LANGUAGES = {
  'en-GB': { label: 'English (UK)', rtl: false },
};

export const DEFAULT_LANGUAGE = 'en-GB';

/** The device's language, when the app ships one that matches. */
export function deviceLanguage() {
  const locale =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager?.settings?.AppleLocale ??
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
      : NativeModules.I18nManager?.localeIdentifier;
  const tag = (locale ?? '').replace('_', '-');
  return LANGUAGES[tag] ? tag : DEFAULT_LANGUAGE;
}

const initialState = {
  /** BCP 47 tag, a key of LANGUAGES. Persisted. */
  code: DEFAULT_LANGUAGE,
  isRTL: I18nManager.isRTL,
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    languageChanged(state, action) {
      const code = LANGUAGES[action.payload]
        ? action.payload
        : DEFAULT_LANGUAGE;
      state.code = code;
      state.isRTL = LANGUAGES[code].rtl;
    },
  },
});

export const { languageChanged } = languageSlice.actions;

export const selectLanguage = state => state.language.code;

export default languageSlice.reducer;
