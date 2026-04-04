// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav__toggle');
  var navList = document.querySelector('.nav__list');

  if (toggle && navList) {
    toggle.addEventListener('click', function () {
      navList.classList.toggle('nav__list--open');
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
    });

    // Close mobile nav on link click
    navList.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        navList.classList.remove('nav__list--open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Contact Form (server-side EmailJS via Cloudflare Pages Function)
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot check — bots fill this hidden field, real users don't
      var honeypot = document.getElementById('website');
      if (honeypot && honeypot.value) {
        contactForm.innerHTML = '<div style="text-align:center;padding:40px 0;"><h3 style="color:#2e7d32;margin-bottom:12px;">Quote Request Sent!</h3><p>Thank you! We\'ll get back to you within 1 business day.</p><p style="margin-top:16px;"><a href="tel:3613879108">Call (361) 387-9108</a> for immediate assistance.</p></div>';
        return;
      }

      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      var turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
      var turnstileToken = turnstileResponse ? turnstileResponse.value : '';
      if (!turnstileToken) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        alert('Please complete the security check before submitting.');
        return;
      }

      var templateParams = {
        from_name: document.getElementById('name').value,
        from_email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        trailer_style: document.getElementById('trailer-style').value,
        axle: document.getElementById('axle').value,
        width: document.getElementById('width').value,
        length: document.getElementById('length').value,
        message: document.getElementById('message').value,
        'cf-turnstile-response': turnstileToken
      };

      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateParams)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Send failed');
          contactForm.innerHTML = '<div style="text-align:center;padding:40px 0;"><h3 style="color:#2e7d32;margin-bottom:12px;">Quote Request Sent!</h3><p>Thank you! We\'ll get back to you within 1 business day.</p><p style="margin-top:16px;"><a href="tel:3613879108">Call (361) 387-9108</a> for immediate assistance.</p></div>';
        })
        .catch(function () {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          alert('Something went wrong. Please call us at (361) 387-9108 or email ernest@mcwhafischertrailersales.com.');
        });
    });
  }

  // Gallery filter functionality
  var filterBtns = document.querySelectorAll('.gallery__filter-btn');
  var galleryItems = document.querySelectorAll('.gallery__item');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('gallery__filter-btn--active'); });
      btn.classList.add('gallery__filter-btn--active');

      var filter = btn.getAttribute('data-filter');

      galleryItems.forEach(function (item) {
        if (filter === 'all' || item.getAttribute('data-category') === filter) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
});
