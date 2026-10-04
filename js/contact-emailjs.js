/**
 * contact-emailjs.js
 * Contact form handler using FormSubmit AJAX.
 */
(function contactFormModule() {
  'use strict';

  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('formSubmit');
  const status = document.getElementById('formStatus');
  const label = submitBtn ? submitBtn.querySelector('.btn-label') : null;

  const fields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    subject: document.getElementById('subject'),
    message: document.getElementById('message')
  };

  const errors = {
    name: document.getElementById('nameError'),
    email: document.getElementById('emailError'),
    subject: document.getElementById('subjectError'),
    message: document.getElementById('messageError')
  };

  function setError(key, message) {
    if (errors[key]) errors[key].textContent = message || '';
    const row = fields[key] ? fields[key].closest('.form-row') : null;
    if (row) row.classList.toggle('has-error', Boolean(message));
  }

  function clearErrors() {
    Object.keys(errors).forEach((key) => setError(key, ''));
  }

  function validate() {
    clearErrors();
    let valid = true;

    const name = fields.name?.value.trim() || '';
    const email = fields.email?.value.trim() || '';
    const subject = fields.subject?.value.trim() || '';
    const message = fields.message?.value.trim() || '';

    if (!name) {
      setError('name', 'Please enter your name.');
      valid = false;
    }

    if (!email) {
      setError('email', 'Please enter your email.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('email', 'Please enter a valid email.');
      valid = false;
    }

    if (!subject) {
      setError('subject', 'Please enter a subject.');
      valid = false;
    }

    if (!message) {
      setError('message', 'Please enter a message.');
      valid = false;
    }

    return valid;
  }

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message || '';
    status.classList.remove('is-success', 'is-error');
    if (type === 'success') status.classList.add('is-success');
    if (type === 'error') status.classList.add('is-error');
  }

  function setLoading(isLoading) {
    if (submitBtn) {
      submitBtn.disabled = isLoading;
      submitBtn.classList.toggle('is-loading', isLoading);
    }
    if (label) label.textContent = isLoading ? 'Sending…' : 'Send Message →';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validate()) {
      setStatus('Please fix the highlighted fields.', 'error');
      return;
    }

    const honeypot = document.getElementById('website');
    if (honeypot && honeypot.value.trim() !== '') return;

    setLoading(true);
    setStatus('Sending your message…');

    const payload = new URLSearchParams();
    payload.append('name', fields.name.value.trim());
    payload.append('email', fields.email.value.trim());
    payload.append('subject', fields.subject.value.trim());
    payload.append('message', fields.message.value.trim());
    payload.append('_replyto', fields.email.value.trim());
    payload.append('_subject', 'New Portfolio Contact — Anmol Gawale');
    payload.append('_template', 'table');
    payload.append('_captcha', 'true');
    payload.append('_url', window.location.href);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://formsubmit.co/ajax/anmolgawale683@gmail.com', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: payload.toString(),
        signal: controller.signal
      });

      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        // Keep the HTTP response as the source of truth if JSON is unavailable.
      }

      const successValue = String(data.success ?? '').toLowerCase();
      if (!response.ok || (data.success !== undefined && successValue !== 'true')) {
        throw new Error(data.message || 'Unable to send the message.');
      }

      setStatus(
        'Message sent successfully! I will get back to you soon.',
        'success'
      );
      form.reset();
      clearErrors();
    } catch (error) {
      console.error('Contact form error:', error);

      const message = error?.name === 'AbortError'
        ? 'The request timed out. Please try again.'
        : 'Message could not be sent right now. Please try again or email me directly at anmolgawale683@gmail.com.';

      setStatus(message, 'error');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  });
})();
