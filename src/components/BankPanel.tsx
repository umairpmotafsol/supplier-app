/**
 * The customer's Direct Debit mandate details, and the thread of what
 * has been said about them.
 *
 * Read-only. The supplier never edits a customer's bank details — they
 * say what is wrong and the customer corrects it, because a supplier
 * retyping someone else's account number is exactly the mistake this
 * whole loop exists to catch.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, font, radius, s, track} from '../theme/tokens';
import {common} from '../theme/common';
import {
  BANK_FIELDS,
  BANK_FIELD_LABEL,
  BankDetails,
  BankField,
  BankReviewNote,
} from '../data/mock';
import Icon from './Icon';

export function BankPanel({
  bank,
  flagged = [],
}: {
  bank: BankDetails;
  /** Fields the supplier has asked the customer to correct. */
  flagged?: BankField[];
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <Icon name="bank" size={s(16)} color={colors.orange} />
        <Text style={styles.headText}>Bank Details</Text>
      </View>
      {BANK_FIELDS.map((field, index) => {
        const bad = flagged.includes(field);
        return (
          <View
            key={field}
            style={[
              styles.row,
              index === BANK_FIELDS.length - 1 && styles.rowLast,
            ]}>
            <View style={common.fill}>
              <Text style={styles.label}>{BANK_FIELD_LABEL[field]}</Text>
              <Text style={[styles.value, bad && styles.valueBad]}>
                {bank[field] || '—'}
              </Text>
            </View>
            {bad ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Flagged</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const noteTime = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'});

/**
 * The whole exchange, oldest first. Showing only the latest note would
 * lose the point on the second round trip: "the sort code again" only
 * means something next to what was asked the first time.
 */
export function BankThread({notes}: {notes: BankReviewNote[]}) {
  if (notes.length === 0) {
    return null;
  }
  return (
    <View style={styles.thread}>
      {notes.map((note, i) => (
        <View key={i} style={styles.note}>
          <View style={styles.noteHead}>
            <Text style={styles.noteWho}>
              {note.by === 'supplier' ? 'You' : 'Customer'}
            </Text>
            <Text style={styles.noteWhen}>{noteTime(note.at)}</Text>
          </View>
          <Text style={styles.noteText}>{note.message}</Text>
          {note.fields.length > 0 ? (
            <View style={styles.chips}>
              {note.fields.map(field => (
                <View key={field} style={styles.chip}>
                  <Text style={styles.chipText}>
                    {BANK_FIELD_LABEL[field]}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: s(12),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(9),
    paddingVertical: s(11),
    paddingHorizontal: s(13),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.appBar,
  },
  headText: {
    fontFamily: font.display,
    fontSize: s(13),
    letterSpacing: track(-0.02, s(13)),
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingVertical: s(11),
    paddingHorizontal: s(13),
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  rowLast: {borderBottomWidth: 0},
  label: {fontFamily: font.medium, fontSize: s(9.5), color: colors.ink3},
  value: {
    fontFamily: font.semibold,
    fontSize: s(12.5),
    letterSpacing: track(0.02, s(12.5)),
    color: colors.ink,
    marginTop: s(3),
  },
  valueBad: {color: colors.orange},
  thread: {gap: s(8), marginBottom: s(14)},
  note: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: s(12),
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(5),
  },
  noteWho: {fontFamily: font.bold, fontSize: s(10.5), color: colors.ink},
  noteWhen: {fontFamily: font.regular, fontSize: s(9.5), color: colors.ink4},
  noteText: {
    fontFamily: font.regular,
    fontSize: s(11),
    lineHeight: s(11) * 1.45,
    color: colors.ink2,
  },
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: s(6), marginTop: s(8)},
  chip: {
    paddingVertical: s(4),
    paddingHorizontal: s(8),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.orangeLine,
    backgroundColor: colors.orangeSoft,
  },
  chipText: {fontFamily: font.bold, fontSize: s(9), color: colors.orange},
});
