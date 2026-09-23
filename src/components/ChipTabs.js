/**
 * A row of pill tabs with counts.
 *
 * Both admin screens sort one list several ways and were growing their
 * own copy of this; it is the same control on each, so it lives here.
 * The count is part of the chip rather than something the screen adds,
 * because "WhatsApp 3" answers the question the tab is there to ask
 * without being tapped.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, font, radius, s } from '../theme/tokens';

/**
 * @param {object} props
 * @param {{key: string, label: string}[]} props.tabs
 * @param {string} props.value the selected key
 * @param {(key: string) => void} props.onChange
 * @param {Record<string, number>} [props.counts] keyed by tab key; omitted keys show no count
 */
export function ChipTabs({ tabs, value, onChange, counts, style }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {tabs.map(tab => {
        const on = tab.key === value;
        const count = counts?.[tab.key];
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={
              count === undefined ? tab.label : tab.label + ', ' + count
            }
            onPress={() => onChange(tab.key)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>
              {tab.label}
            </Text>
            {count === undefined ? null : (
              <Text style={[styles.chipCount, on && styles.chipTextOn]}>
                {count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: s(7), paddingBottom: s(14), paddingRight: s(4) },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(11),
    paddingVertical: s(7),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.orange, backgroundColor: colors.orangeSoft },
  chipText: {
    fontFamily: font.semibold,
    fontSize: s(10.5),
    color: colors.ink2,
  },
  chipTextOn: { color: colors.orange },
  chipCount: { fontFamily: font.bold, fontSize: s(10), color: colors.ink4 },
});

export default ChipTabs;
