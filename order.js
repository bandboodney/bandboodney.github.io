(function () {
  // === CONFIG ===
  // Replace ENDPOINT with your deployed Apps Script Web App URL (ends in /exec).
  // SECRET is a pseudo-secret: it filters random bots, but is visible to anyone
  // viewing page source. Real protection is server-side validation + rate limit.
  // Must match SHARED_SECRET in apps-script/order.gs.
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbx-qC7wj-_abQM_x8tESAYxfRSxQYawSu6FRg2wnBDX8uqjqtU3UFNJQPu5EJuerqg/exec';
  const SECRET = 'shared_secret_code_but_still_public';

  const i18n = (window.OrderI18n || {});
  const lang = (window.OrderLang || 'ru');

  const modal = document.getElementById('orderModal');
  if (!modal) return;
  const form = modal.querySelector('.order-form');
  const errorBox = modal.querySelector('.modal-error');
  const successBox = modal.querySelector('.modal-success');
  const submitBtn = modal.querySelector('.modal-submit');
  const submitLabel = submitBtn ? submitBtn.textContent : 'Request';
  const closeBtn = modal.querySelector('.modal-close');
  const emailInput = form.querySelector('input[name="email"]');
  const ticketsInput = form.querySelector('input[name="tickets"]');
  const honeypot = form.querySelector('input[name="website"]');
  const consentInput = form.querySelector('input[name="consent"]');

  let lastSubmitAt = 0;

  function openModal() {
    resetMessages();
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => emailInput && emailInput.focus(), 50);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.hidden = true;
      resetMessages();
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }, 150);
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
    successBox.hidden = true;
  }

  function showSuccess(msg) {
    successBox.textContent = msg;
    successBox.hidden = false;
    errorBox.hidden = true;
  }

  function resetMessages() {
    errorBox.hidden = true;
    successBox.hidden = true;
    errorBox.textContent = '';
    successBox.textContent = '';
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  document.querySelectorAll('[data-open-order]').forEach((btn) => {
    btn.addEventListener('click', openModal);
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    resetMessages();

    // Client-side throttle (also enforced server-side).
    const now = Date.now();
    if (now - lastSubmitAt < 3000) return;
    lastSubmitAt = now;

    const email = (emailInput.value || '').trim();
    const tickets = parseInt(ticketsInput.value, 10);

    if (!isValidEmail(email)) {
      showError(i18n.errInvalidEmail || 'Invalid email');
      emailInput.focus();
      return;
    }
    if (!Number.isInteger(tickets) || tickets < 1 || tickets > 10) {
      showError(i18n.errInvalidTickets || 'Invalid tickets count (1-10)');
      ticketsInput.focus();
      return;
    }
    if (consentInput && !consentInput.checked) {
      showError(i18n.errConsent || 'Please confirm your consent to the privacy policy.');
      consentInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = i18n.sending || 'Sending...';

    const payload = {
      secret: SECRET,
      email: email,
      tickets: tickets,
      lang: lang,
      ua: navigator.userAgent || '',
      website: honeypot ? honeypot.value : '',
    };

    try {
      // text/plain avoids CORS preflight (Apps Script Web Apps don't handle OPTIONS).
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
      const data = await res.json().catch(() => ({ ok: false, error: 'bad_response' }));

      if (data && data.ok) {
        showSuccess(i18n.success || 'Thank you! Your request has been received.');
        form.reset();
        // Keep button disabled to discourage repeat clicks; user can close the modal.
        submitBtn.textContent = i18n.sent || 'Sent';
      } else {
        const code = (data && data.error) || 'server_error';
        const map = {
          invalid_email: i18n.errInvalidEmail,
          invalid_tickets: i18n.errInvalidTickets,
          too_many_requests: i18n.errTooMany,
        };
        showError(map[code] || i18n.errServer || 'Something went wrong. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
    } catch (err) {
      showError(i18n.errServer || 'Network error. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
  });
})();
