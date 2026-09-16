/**
 * Everything the app keeps in the device Keychain / Android Keystore.
 *
 * Two separate entries, on purpose:
 *
 *  - `TOKEN_SERVICE` holds the session token. The axios interceptor
 *    reads it on every request, so it must not sit behind a biometric
 *    prompt — a request cannot raise a Face ID sheet.
 *  - `BIOMETRIC_SERVICE` holds the secret used to unlock the app. It is
 *    written *with* an access-control flag, so reading it is what raises
 *    the prompt.
 *
 * Nothing secret goes to Redux or AsyncStorage: those are not encrypted
 * and redux-persist writes them to plain files.
 *
 * Every call is wrapped: a device with no passcode, a simulator without
 * a keychain entitlement, or a user who cancels a biometric prompt are
 * all normal outcomes, and they must not crash a screen.
 */
import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'com.supplier.session';
const BIOMETRIC_SERVICE = 'com.supplier.biometric';

/** The username field is unused for the token; the Keychain requires one. */
const TOKEN_ACCOUNT = 'session';

/* -------------------------------- session -------------------------------- */

/**
 * Stores the session token.
 *
 * @param {string} token
 * @returns {Promise<boolean>} whether it was written
 */
export async function saveToken(token) {
  if (!token) {
    return false;
  }
  const result = await Keychain.setGenericPassword(TOKEN_ACCOUNT, token, {
    service: TOKEN_SERVICE,
    /*
     * Readable while the device is unlocked, and never restored to a new
     * device from a backup — a session token should not outlive the
     * phone it was issued to.
     */
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return result !== false;
}

/**
 * The stored session token, or null. Never throws: callers are usually
 * request interceptors, where a missing token just means "send it
 * unauthenticated".
 *
 * @returns {Promise<string | null>}
 */
export async function getToken() {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: TOKEN_SERVICE,
    });
    return credentials ? credentials.password : null;
  } catch {
    return null;
  }
}

/** Removes the session token. Resolves false if there was nothing to remove. */
export async function clearToken() {
  try {
    return await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
  } catch {
    return false;
  }
}

/* ------------------------------- biometrics ------------------------------- */

/**
 * What this device can do: 'FaceID', 'TouchID', 'Fingerprint', or null
 * when there is no biometric hardware (or it is not enrolled).
 *
 * @returns {Promise<string | null>}
 */
export async function getSupportedBiometry() {
  try {
    return await Keychain.getSupportedBiometryType();
  } catch {
    return null;
  }
}

/**
 * Writes a secret behind the device's biometric gate. Reading it back
 * later is what raises the Face ID / fingerprint prompt.
 *
 * Throws on failure — unlike the token helpers, the caller here is a
 * settings switch that has to tell the user it did not work.
 */
export async function saveBiometricCredentials(account, secret) {
  const result = await Keychain.setGenericPassword(account, secret, {
    service: BIOMETRIC_SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  if (result === false) {
    throw new Error('Could not store the biometric credential');
  }
  return true;
}

/**
 * Raises the biometric prompt and returns the secret behind it.
 *
 * @param {string} [promptTitle] shown on the Android prompt
 * @returns {Promise<string | null>} null if the user cancelled or failed
 */
export async function getBiometricCredentials(
  promptTitle = 'Unlock Supplier Portal',
) {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: BIOMETRIC_SERVICE,
      authenticationPrompt: { title: promptTitle },
    });
    return credentials ? credentials.password : null;
  } catch {
    // Cancelled, too many attempts, or biometry changed since enrolment.
    return null;
  }
}

/** Whether a biometric credential has been enrolled, without prompting. */
export async function hasBiometricCredentials() {
  try {
    return await Keychain.hasGenericPassword({ service: BIOMETRIC_SERVICE });
  } catch {
    return false;
  }
}

/** Forgets the biometric credential. */
export async function clearBiometricCredentials() {
  try {
    return await Keychain.resetGenericPassword({ service: BIOMETRIC_SERVICE });
  } catch {
    return false;
  }
}

export default {
  saveToken,
  getToken,
  clearToken,
  getSupportedBiometry,
  saveBiometricCredentials,
  getBiometricCredentials,
  hasBiometricCredentials,
  clearBiometricCredentials,
};
