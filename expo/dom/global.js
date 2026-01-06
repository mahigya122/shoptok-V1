// Minimal shim for `expo/dom/global` to satisfy `expo-router` on web
// Exports a single helper `addGlobalDomEventListener(handler)` which
// subscribes to custom DOM events and returns an unsubscribe function.

function normalizeEvent(e) {
  // support CustomEvent with detail, or plain events
  return { type: e?.detail?.type ?? e?.type, data: e?.detail?.data ?? {} };
}

export function addGlobalDomEventListener(handler) {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return () => {};
  }

  const listener = (e) => {
    try {
      handler(normalizeEvent(e));
    } catch (err) {
      // swallow handler errors to avoid breaking mounting
      // eslint-disable-next-line no-console
      console.error('expo/dom/global event handler error', err);
    }
  };

  // Listen for custom events used by expo-router. We don't know the
  // exact event name in every environment, so listen to `message` and
  // `expo-router` as a fallback.
  window.addEventListener('message', listener);
  window.addEventListener('expo-router', listener);

  return () => {
    window.removeEventListener('message', listener);
    window.removeEventListener('expo-router', listener);
  };
}

export default {};
