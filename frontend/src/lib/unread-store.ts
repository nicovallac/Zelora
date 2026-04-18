// Lightweight pub/sub for inbox unread count — shared between inbox page and sidebar.
let count = 0;
const listeners = new Set<(n: number) => void>();

export function setUnreadCount(n: number) {
  count = n;
  listeners.forEach((fn) => fn(n));
}

export function subscribeUnread(fn: (n: number) => void): () => void {
  listeners.add(fn);
  fn(count);
  return () => listeners.delete(fn);
}
