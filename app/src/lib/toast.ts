// Tiny global toast bus — call toast() from anywhere; <Toaster/> renders them.
export interface ToastOpts {
  /** Show an "Undo" action; the toast lingers longer while it's offered. */
  undo?: () => void;
  /** Which cue to play. Defaults to the action sound; 'trash' for deletes. */
  sound?: 'action' | 'trash' | 'none';
}

type Listener = (message: string, opts?: ToastOpts) => void;

const listeners = new Set<Listener>();

export function toast(message: string, opts?: ToastOpts) {
  listeners.forEach((l) => l(message, opts));
}

export function onToast(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
