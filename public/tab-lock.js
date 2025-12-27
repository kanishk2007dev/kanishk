// Best-effort Single-Window Enforcement (client-side)
// If another tab opens, it redirects to '/'

(function () {
  const CHANNEL_NAME = 'tab-lock-kanishk';
  const channel = new BroadcastChannel(CHANNEL_NAME);

  let hasLock = false;

  function requestLock() {
    channel.postMessage({ type: 'request-lock' });
    setTimeout(() => {
      if (!hasLock) {
        hasLock = true;
        channel.postMessage({ type: 'lock-granted' });
      }
    }, 500);
  }

  channel.onmessage = (ev) => {
    if (!ev || !ev.data) return;
    const { type } = ev.data;
    if (type === 'request-lock') {
      if (hasLock) {
        channel.postMessage({ type: 'lock-denied' });
      }
    } else if (type === 'lock-granted' || type === 'lock-denied') {
      if (!hasLock) {
        window.location.replace('/');
      }
    }
  };

  window.addEventListener('beforeunload', () => {
    if (hasLock) {
      channel.postMessage({ type: 'release-lock' });
      hasLock = false;
    }
  });

  requestLock();
})();
