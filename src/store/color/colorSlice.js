/**
 * The active colour scheme.
 *
 * The supplier portal is drawn dark: the design tokens are a single
 * black-and-orange palette and every screen is built on them. This slice
 * therefore does not invent a light theme — it records which of the
 * registered palettes is active and hands the tokens out, so a second
 * palette can be added in `src/theme/tokens.js` without touching screens.
 *
 * Persisted: a chosen theme should survive a restart.
 */
import { createSlice } from '@reduxjs/toolkit';

import { colors } from '../../theme/tokens';

/** Palettes the app ships. `dark` is the design; see the note above. */
export const PALETTES = { dark: colors };

const initialState = {
  /** Key into PALETTES. Persisted. */
  scheme: 'dark',
  /** True to follow the OS setting once a second palette exists. */
  followSystem: false,
};

const colorSlice = createSlice({
  name: 'color',
  initialState,
  reducers: {
    schemeChanged(state, action) {
      state.scheme = PALETTES[action.payload] ? action.payload : 'dark';
    },
    followSystemChanged(state, action) {
      state.followSystem = action.payload;
    },
  },
});

export const { schemeChanged, followSystemChanged } = colorSlice.actions;

/** The palette for the active scheme. */
export const selectPalette = state =>
  PALETTES[state.color.scheme] ?? PALETTES.dark;

export default colorSlice.reducer;
