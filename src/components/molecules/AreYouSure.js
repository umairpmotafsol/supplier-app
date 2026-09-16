/**
 * "Are you sure?" — the confirmation in front of an action that cannot
 * be taken back.
 *
 * Deliberately narrow: it is a `PopUp` with the two answers already
 * decided, so every destructive confirmation in the app asks the same
 * way round (confirm first, cancel second) and reads in the same voice.
 *
 * `destructive` turns it red, which is the only signal the design has
 * for "this one removes something".
 *
 *   <AreYouSure
 *     visible={confirming}
 *     title="Remove this photo?"
 *     message="You will have to take it again."
 *     confirmLabel="Remove"
 *     destructive
 *     onConfirm={remove}
 *     onCancel={() => setConfirming(false)}
 *   />
 */
import React from 'react';

import PopUp from './PopUp';

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {string} [props.title]
 * @param {string} [props.message]
 * @param {string} [props.confirmLabel]
 * @param {string} [props.cancelLabel]
 * @param {boolean} [props.destructive]
 * @param {boolean} [props.busy]
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
export default function AreYouSure({
  visible,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Yes, continue',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <PopUp
      visible={visible}
      tone={destructive ? 'red' : 'orange'}
      icon={destructive ? 'alert' : 'info'}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      cancelLabel={cancelLabel}
      onCancel={onCancel}
      busy={busy}
      /* A question waiting on an answer is not dismissed by a stray tap. */
      dismissable={!busy}
    />
  );
}
