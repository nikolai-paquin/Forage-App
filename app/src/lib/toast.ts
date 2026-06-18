// Tiny global toast bus — call toast() from anywhere; <Toaster/> renders them.
type Listener = (message: string) => void;

const listeners = new Set<Listener>();

export function toast(message: string) {
  listeners.forEach((l) => l(message));
}

export function onToast(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
