// KATAX — shared front-end behaviour

document.addEventListener('DOMContentLoaded', function () {

  // Mobile nav toggle
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Mark the current page's nav link as active
  var here = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === here || (here === '' && href === 'index.html')) {
      a.classList.add('is-active');
    }
  });

  // Hero ledger illustration: single on-load check-off animation
  var ledger = document.querySelector('.ledger-card');
  if (ledger) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ledger.classList.add('is-checked');
    } else {
      requestAnimationFrame(function () {
        setTimeout(function () { ledger.classList.add('is-checked'); }, 300);
      });
    }
  }

  // Scroll-reveal: sections and key blocks fade/rise into place once, the
  // first time they enter the viewport. Skipped entirely for anyone who
  // prefers reduced motion — everything just shows up as normal.
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealTargets = document.querySelectorAll(
    '.section__head, .reason, .line-item, .service-detail, .values > div, .team-card, .split > *, .cta-band__row > *'
  );

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('is-revealed'); });
  } else {
    revealTargets.forEach(function (el, i) {
      el.classList.add('will-reveal');
      el.style.transitionDelay = (Math.min(i % 5, 4) * 0.06) + 's';
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) { observer.observe(el); });
  }

  // Contact form submission
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: if filled, silently pretend success and stop
      var hp = form.querySelector('input[name="company_website"]');
      if (hp && hp.value) {
        showStatus('success', "Thanks — we've received your message. We'll be in touch shortly.");
        form.reset();
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        service: form.service.value,
        message: form.message.value.trim(),
        company_website: ''
      };

      if (!payload.name || !payload.email || !payload.message) {
        showStatus('error', 'Please fill in your name, email, and message before sending.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (result) {
          if (result.ok) {
            showStatus('success', "Thanks, " + payload.name.split(' ')[0] + " — your message is in. We'll reply within one business day.");
            form.reset();
          } else {
            showStatus('error', result.data.error || 'Something went wrong sending your message. Please call us instead.');
          }
        })
        .catch(function () {
          showStatus('error', "We couldn't send that — please check your connection or call 437-230-5860 directly.");
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send message';
        });
    });

    function showStatus(kind, text) {
      status.textContent = text;
      status.classList.remove('is-success', 'is-error');
      status.classList.add(kind === 'success' ? 'is-success' : 'is-error');
      status.setAttribute('role', kind === 'success' ? 'status' : 'alert');
      status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
});
