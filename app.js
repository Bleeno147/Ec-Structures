/* ===========================================================
   EC Structures — App JS
   Mobile nav (focus-trapped), sticky header, gallery filters,
   vanilla lightbox (keyboard + swipe), scroll reveal, and
   quote-form inline validation with a success state.
   =========================================================== */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Footer year ---------- */
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- Mobile nav (with focus trap) ---------- */
    var navToggle = document.getElementById('navToggle');
    var nav = document.getElementById('nav');
    var navOpen = false;

    function setNav(open) {
      navOpen = open;
      nav.classList.toggle('is-open', open);
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      if (open) {
        var first = nav.querySelector('a');
        if (first) first.focus();
      } else {
        navToggle.focus();
      }
    }

    function trapNavFocus(e) {
      if (!navOpen || e.key !== 'Tab') return;
      var focusables = [navToggle].concat(Array.prototype.slice.call(nav.querySelectorAll('a')));
      var firstEl = focusables[0];
      var lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    if (navToggle && nav) {
      navToggle.addEventListener('click', function () { setNav(!navOpen); });
      // Close on link tap
      nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () { if (navOpen) setNav(false); });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navOpen) setNav(false);
        trapNavFocus(e);
      });
    }

    /* ---------- Sticky header shrink/shadow ---------- */
    var header = document.getElementById('header');
    function onScroll() {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Gallery filtering ---------- */
    var filters = document.querySelectorAll('.filter');
    var items = document.querySelectorAll('.work__item');
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var cat = btn.getAttribute('data-filter');
        items.forEach(function (item) {
          var show = cat === 'all' || item.getAttribute('data-cat') === cat;
          item.classList.toggle('is-hidden', !show);
        });
      });
    });

    /* ---------- Lightbox (vanilla: keyboard + swipe) ---------- */
    var lightbox = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightboxImg');
    var lbCaption = document.getElementById('lightboxCaption');
    var lbClose = document.getElementById('lightboxClose');
    var lbPrev = document.getElementById('lightboxPrev');
    var lbNext = document.getElementById('lightboxNext');
    var lbIndex = 0;
    var lbTrigger = null;
    var touchStartX = null;

    // Only images currently visible (not filtered out) are cycled through.
    function visibleZoomButtons() {
      return Array.prototype.slice.call(
        document.querySelectorAll('.work__item:not(.is-hidden) .work__zoom')
      );
    }

    function showLightboxAt(index) {
      var buttons = visibleZoomButtons();
      if (!buttons.length) return;
      lbIndex = (index + buttons.length) % buttons.length;
      var img = buttons[lbIndex].querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCaption.textContent = img.alt; // alt-text-driven caption
    }

    function openLightbox(button) {
      var buttons = visibleZoomButtons();
      lbTrigger = button;
      showLightboxAt(buttons.indexOf(button));
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    }

    function closeLightbox() {
      lightbox.hidden = true;
      document.body.style.overflow = '';
      lbImg.src = '';
      if (lbTrigger) lbTrigger.focus();
    }

    if (lightbox) {
      document.querySelectorAll('.work__zoom').forEach(function (button) {
        button.addEventListener('click', function () { openLightbox(button); });
      });

      lbClose.addEventListener('click', closeLightbox);
      lbPrev.addEventListener('click', function () { showLightboxAt(lbIndex - 1); });
      lbNext.addEventListener('click', function () { showLightboxAt(lbIndex + 1); });

      // Click on the dark backdrop closes
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
      });

      // Keyboard support
      document.addEventListener('keydown', function (e) {
        if (lightbox.hidden) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') showLightboxAt(lbIndex - 1);
        else if (e.key === 'ArrowRight') showLightboxAt(lbIndex + 1);
        else if (e.key === 'Tab') {
          // Keep focus inside the lightbox
          var focusables = [lbClose, lbPrev, lbNext];
          var i = focusables.indexOf(document.activeElement);
          e.preventDefault();
          if (e.shiftKey) focusables[(i - 1 + focusables.length) % focusables.length].focus();
          else focusables[(i + 1) % focusables.length].focus();
        }
      });

      // Swipe support
      lightbox.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].clientX;
      }, { passive: true });
      lightbox.addEventListener('touchend', function (e) {
        if (touchStartX === null) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 48) showLightboxAt(dx > 0 ? lbIndex - 1 : lbIndex + 1);
        touchStartX = null;
      }, { passive: true });
    }

    /* ---------- Scroll reveal (with per-child stagger) ---------- */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var revealTargets = document.querySelectorAll(
      '.svc-row, .work__item, .why__card, .creds, .review, .trustbar__card, .about__media, .about__content, .contact__form-wrap, .contact__info, .section__head'
    );

    revealTargets.forEach(function (el) {
      el.classList.add('reveal');
      if (reduceMotion) return;
      // Stagger siblings: delay grows with the element's index among
      // revealed siblings, capped so late items don't lag.
      var index = 0;
      var sib = el.previousElementSibling;
      while (sib) {
        if (sib.classList.contains('reveal')) index++;
        sib = sib.previousElementSibling;
      }
      el.style.transitionDelay = Math.min(index * 90, 450) + 'ms';
    });

    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            el.classList.add('is-visible');
            obs.unobserve(el);
            // Clear the stagger delay once revealed so hover
            // transitions aren't delayed afterwards.
            setTimeout(function () { el.style.transitionDelay = ''; }, 1200);
          }
        });
      }, { threshold: 0.12 });
      revealTargets.forEach(function (el) { revealObserver.observe(el); });
    } else {
      revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* ---------- Stat counters (any [data-count] element) ---------- */
    var counters = document.querySelectorAll('[data-count]');

    function finalCounterText(el) {
      return el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
    }

    function runCounter(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1400;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + (progress === 1 ? suffix : '');
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (counters.length) {
      if (reduceMotion || !('IntersectionObserver' in window)) {
        counters.forEach(function (el) { el.textContent = finalCounterText(el); });
      } else {
        var counterObserver = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              runCounter(entry.target);
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.5 });
        counters.forEach(function (el) { counterObserver.observe(el); });
      }
    }

    /* ---------- Quote form: inline validation + success state ---------- */
    var form = document.getElementById('quoteForm');
    var successBox = document.getElementById('formSuccess');

    function setFieldError(input, errorEl, hasError) {
      input.classList.toggle('invalid', hasError);
      input.setAttribute('aria-invalid', String(hasError));
      if (errorEl) errorEl.hidden = !hasError;
    }

    function wireLiveValidation(input, errorEl, validate) {
      input.addEventListener('input', function () {
        if (input.classList.contains('invalid') && validate()) {
          setFieldError(input, errorEl, false);
        }
      });
    }

    if (form) {
      var nameInput = form.name;
      var phoneInput = form.phone;
      var messageInput = form.message;
      var nameError = document.getElementById('nameError');
      var phoneError = document.getElementById('phoneError');
      var messageError = document.getElementById('messageError');

      var validName = function () { return nameInput.value.trim().length > 0; };
      var validPhone = function () {
        var digits = phoneInput.value.replace(/[^\d+]/g, '');
        return digits.length >= 8;
      };
      var validMessage = function () { return messageInput.value.trim().length > 0; };

      wireLiveValidation(nameInput, nameError, validName);
      wireLiveValidation(phoneInput, phoneError, validPhone);
      wireLiveValidation(messageInput, messageError, validMessage);

      function showSuccess() {
        form.hidden = true;
        successBox.hidden = false;
        successBox.focus();
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var ok = true;
        if (!validName()) { setFieldError(nameInput, nameError, true); ok = false; }
        if (!validPhone()) { setFieldError(phoneInput, phoneError, true); ok = false; }
        if (!validMessage()) { setFieldError(messageInput, messageError, true); ok = false; }
        if (!ok) {
          var firstInvalid = form.querySelector('.invalid');
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';

        // TODO: form.action is a placeholder (Formspree/Web3Forms). Once a real
        // endpoint is configured, the fetch below will submit for real. Until
        // then we show the success state locally so the UX can be reviewed.
        var isPlaceholder = form.action.indexOf('YOUR_FORM_ID') !== -1;
        if (isPlaceholder) {
          setTimeout(showSuccess, 600); // simulate network delay
          return;
        }

        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        }).then(function (res) {
          if (res.ok) { showSuccess(); return; }
          throw new Error('Request failed');
        }).catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Enquiry';
          alert('Sorry — something went wrong sending your enquiry. Please call us on 0435 359 475.');
        });
      });
    }
  });
})();
