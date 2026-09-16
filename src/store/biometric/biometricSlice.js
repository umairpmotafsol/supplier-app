/**
 * Whether this device unlocks the app with Face ID / Touch ID /
 * fingerprint, and what hardware it actually has.
 *
 * Only the user's preference is persisted. The secret itself never
 * touches Redux: it lives in the Keychain behind the biometric prompt
 * (see `src/security/keychainService.js`), which is the whole point of
 * using the Keychain rather than AsyncStorage.
 */
import { createSlice } from '@reduxjs/toolkit';

import {
  getSupportedBiometry,
  hasBiometricCredentials,
  saveBiometricCredentials,
  clearBiometricCredentials,
} from '../../security/keychainService';

const initialState = {
  /** The user's choice. Persisted. */
  enabled: false,
  /** 'FaceID' | 'TouchID' | 'Fingerprint' | null — read from the device. */
  supportedType: null,
  /** True once a credential has been written behind the biometric gate. */
  enrolled: false,
  error: null,
};

const biometricSlice = createSlice({
  name: 'biometric',
  initialState,
  reducers: {
    supportChecked(state, action) {
      state.supportedType = action.payload.supportedType;
      state.enrolled = action.payload.enrolled;
    },
    enabledChanged(state, action) {
      state.enabled = action.payload;
      state.error = null;
    },
    enrollmentChanged(state, action) {
      state.enrolled = action.payload;
    },
    biometricFailed(state, action) {
      state.error = action.payload;
      state.enabled = false;
    },
  },
});

export const {
  supportChecked,
  enabledChanged,
  enrollmentChanged,
  biometricFailed,
} = biometricSlice.actions;

/** Asks the device what it supports, and whether we have already enrolled. */
export const refreshBiometricSupport = () => async dispatch => {
  const [supportedType, enrolled] = await Promise.all([
    getSupportedBiometry(),
    hasBiometricCredentials(),
  ]);
  dispatch(supportChecked({ supportedType, enrolled }));
  return supportedType;
};

/**
 * Turns biometric unlock on by writing the secret behind the device's
 * biometric gate, or off by deleting it. Returns whether it worked, so
 * a settings switch can snap back rather than lie.
 */
export const setBiometricEnabled =
  (enabled, secret) => async (dispatch, getState) => {
    try {
      if (enabled) {
        const account = getState().auth.session?.email ?? 'supplier';
        await saveBiometricCredentials(
          account,
          secret ?? `mock-session-${account}`,
        );
        dispatch(enrollmentChanged(true));
      } else {
        await clearBiometricCredentials();
        dispatch(enrollmentChanged(false));
      }
      dispatch(enabledChanged(enabled));
      return true;
    } catch (error) {
      dispatch(biometricFailed(error?.message ?? 'Biometric setup failed'));
      return false;
    }
  };

export default biometricSlice.reducer;
