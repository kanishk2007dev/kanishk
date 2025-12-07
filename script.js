// script.js — show/hide modal and attach actions
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('portalModal');
  const openBtn = document.getElementById('openPopupBtn');
  const closeBtn = document.getElementById('modalClose');
  const closeTabBtn = document.getElementById('closeTabBtn');
  const dismissBtn = document.getElementById('dismissBtn');
  const backdrop = document.getElementById('backdrop');

  function showModal() {
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    // trap focus roughly by focusing the first actionable element
    closeTabBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function hideModal() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    openBtn?.focus();
  }

  openBtn?.addEventListener('click', showModal);
  closeBtn?.addEventListener('click', hideModal);
  dismissBtn?.addEventListener('click', hideModal);

  // Clicking backdrop closes modal
  backdrop?.addEventListener('click', hideModal);

  // ESC key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') hideModal();
  });

  // Attempt to close the browser tab when user clicks "Close This Tab".
  // Note: window.close() only works reliably on windows opened by window.open.
  closeTabBtn?.addEventListener('click', () => {
    // First try to close; if blocked, show a helpful fallback:
    try {
      window.close();
      // If the tab did not close in 250ms, assume browser blocked it -> fallback
      setTimeout(() => {
        if (!window.closed) {
          // replace page content with message asking user to close manually
          document.body.innerHTML = `
            <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:${getComputedStyle(document.body).background}">
              <div style="max-width:760px;padding:28px;border-radius:12px;background:rgba(0,0,0,0.6);color:#fff;text-align:center;">
                <h2 style="margin-top:0">Please close this tab</h2>
                <p style="color:#cfe3ff">Your browser prevented the tab from being closed programmatically. Please close this tab manually to end the active session.</p>
                <button onclick="location.reload()" style="margin-top:18px;padding:10px 16px;border-radius:8px;border:0;background:#2f6ef3;color:#fff;cursor:pointer;">Reload page instead</button>
              </div>
            </div>`;
        }
      }, 250);
    } catch (err) {
      // fallback if exception thrown
      alert('Your browser prevented automatic tab close. Please close the tab manually.');
    }
  });

  // Show the modal automatically on load (remove if you want manual trigger only)
  // Delay slightly so background renders first
  setTimeout(showModal, 350);
});
