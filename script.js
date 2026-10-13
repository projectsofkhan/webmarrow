/* ============================================================
   WEBMARROW — SCRIPT.JS
   ------------------------------------------------------------
   Minimal, performant interactions. Smooth reveals, quick
   responders, no heavy effects.
   ============================================================ */

(() => {
  'use strict';

  const CONFIG = {
    revealThreshold: 0.14,
    revealRootMargin: '0px 0px -60px 0px',
    headerScrollAfter: 12,
    headerHideAfter: 400,
    contactEmail: 'webmarrow@gmail.com'
  };

  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  /* ==========================================================
     PRELOADER
  ========================================================== */
  const initPreloader = () => {
    const preloader = $('#preloader');
    if (!preloader) return;

    const hide = () => {
      preloader.classList.add('is-hidden');
      setTimeout(() => preloader.remove(), 600);
    };

    if (document.readyState === 'complete') {
      setTimeout(hide, 300);
    } else {
      window.addEventListener('load', () => setTimeout(hide, 300));
    }
  };

  /* ==========================================================
     HEADER
  ========================================================== */
  const initHeader = () => {
    const header = $('#siteHeader');
    if (!header) return;

    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;

      if (y > CONFIG.headerScrollAfter) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }

      if (y > CONFIG.headerHideAfter && y > lastY) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }

      lastY = y;
      ticking = false;
    };

    on(window, 'scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  };

  /* ==========================================================
     MOBILE NAV
  ========================================================== */
  const initNav = () => {
    const toggle = $('#navToggle');
    const nav = $('#primaryNav');
    if (!toggle || !nav) return;

    const close = () => {
      nav.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    };

    const open = () => {
      nav.classList.add('is-open');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
    };

    on(toggle, 'click', () => {
      nav.classList.contains('is-open') ? close() : open();
    });

    $$('.nav-link, .nav-cta').forEach((link) => on(link, 'click', close));

    on(document, 'keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    on(window, 'resize', () => {
      if (window.innerWidth > 760) close();
    });
  };

  /* ==========================================================
     SMOOTH ANCHOR SCROLL
  ========================================================== */
  const initSmoothScroll = () => {
    $$('a[href^="#"]').forEach((link) => {
      on(link, 'click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#' || id.length < 2) return;

        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();

        const top = target.getBoundingClientRect().top + window.scrollY - 80;

        window.scrollTo({
          top,
          behavior: prefersReduced ? 'auto' : 'smooth'
        });
      });
    });
  };

  /* ==========================================================
     REVEAL ON SCROLL
  ========================================================== */
  const initReveal = () => {
    const items = $$('.reveal');
    if (!items.length) return;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const delay = parseInt(el.dataset.delay || '0', 10);

        setTimeout(() => {
          el.classList.add('is-visible');
        }, delay);

        io.unobserve(el);
      });
    }, {
      threshold: CONFIG.revealThreshold,
      rootMargin: CONFIG.revealRootMargin
    });

    items.forEach((el) => io.observe(el));
  };

  /* ==========================================================
     FAQ ACCORDION
  ========================================================== */
  const initFAQ = () => {
    const items = $$('.faq-item');
    if (!items.length) return;

    items.forEach((item) => {
      const btn = $('.faq-question', item);
      const ans = $('.faq-answer', item);
      if (!btn || !ans) return;

      on(btn, 'click', () => {
        const isOpen = item.classList.contains('is-open');

        items.forEach((other) => {
          other.classList.remove('is-open');
          const oa = $('.faq-answer', other);
          const ob = $('.faq-question', other);
          if (oa) oa.style.maxHeight = null;
          if (ob) ob.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('is-open');
          ans.style.maxHeight = ans.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    on(window, 'resize', () => {
      items.forEach((item) => {
        if (!item.classList.contains('is-open')) return;
        const ans = $('.faq-answer', item);
        if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
      });
    });
  };

  /* ==========================================================
     CONTACT FORM
  ========================================================== */
  const initForm = () => {
    const form = $('#contactForm');
    if (!form) return;

    const status = $('#formStatus');

    const validators = {
      name: (v) => {
        if (!v.trim()) return 'Please tell us your name.';
        if (v.trim().length < 2) return 'That name looks a little short.';
        return '';
      },
      email: (v) => {
        if (!v.trim()) return 'We need an email to reply.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          return 'That email does not look right.';
        }
        return '';
      },
      project: (v) => {
        if (!v.trim()) return 'Tell us a little about the project.';
        if (v.trim().length < 10) return 'A few more words, please.';
        return '';
      }
    };

    const setError = (field, message) => {
      const err = document.querySelector(`[data-error-for="${field}"]`);
      const input = form.querySelector(`[name="${field}"]`);
      if (err) err.textContent = message || '';
      if (input) input.classList.toggle('is-error', Boolean(message));
    };

    const validate = () => {
      let ok = true;
      Object.entries(validators).forEach(([name, fn]) => {
        const input = form.querySelector(`[name="${name}"]`);
        if (!input) return;
        const msg = fn(input.value);
        if (msg) ok = false;
        setError(name, msg);
      });
      return ok;
    };

    $$('input, textarea, select', form).forEach((input) => {
      on(input, 'blur', () => {
        const name = input.name;
        if (validators[name]) {
          setError(name, validators[name](input.value));
        }
      });

      on(input, 'input', () => {
        if (input.classList.contains('is-error')) {
          const name = input.name;
          if (validators[name]) {
            setError(name, validators[name](input.value));
          }
        }
      });
    });

    on(form, 'submit', (e) => {
      e.preventDefault();

      if (!validate()) {
        if (status) {
          status.textContent = 'Please check the highlighted fields.';
          status.style.color = 'var(--error)';
        }
        const firstError = form.querySelector('.is-error');
        if (firstError) firstError.focus();
        return;
      }

      const data = new FormData(form);
      const subject = encodeURIComponent('New WebMarrow enquiry');
      const body = encodeURIComponent(
        `Name: ${data.get('name')}\n` +
        `Email: ${data.get('email')}\n\n` +
        `Project details:\n${data.get('project')}`
      );

      if (status) {
        status.textContent = 'Opening your email app…';
        status.style.color = 'var(--green)';
      }

      setTimeout(() => {
        window.location.href =
          `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}`;

        if (status) {
          status.textContent =
            'Message ready — send it from your email app.';
        }
      }, 300);
    });
  };

  /* ==========================================================
     COPY TO CLIPBOARD
  ========================================================== */
  const initCopy = () => {
    const buttons = $$('.copy-btn');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      on(btn, 'click', async () => {
        const value = btn.dataset.copy;
        if (!value) return;

        try {
          await navigator.clipboard.writeText(value);
          btn.classList.add('is-copied');
          const original = btn.textContent;
          btn.textContent = 'Copied';
          showToast('Email copied to clipboard');

          setTimeout(() => {
            btn.classList.remove('is-copied');
            btn.textContent = original;
          }, 1600);
        } catch (err) {
          showToast('Could not copy — please copy manually.');
        }
      });
    });
  };

  /* ==========================================================
     TOAST
  ========================================================== */
  let toastTimer = null;
  const showToast = (message) => {
    const toast = $('#toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-visible');

    if (toastTimer) clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2400);
  };

  /* ==========================================================
     BACK TO TOP
  ========================================================== */
  const initBackToTop = () => {
    const btn = $('#backToTop');
    if (!btn) return;

    const toggle = () => {
      const visible = window.scrollY > 500;
      btn.classList.toggle('is-visible', visible);
    };

    on(window, 'scroll', toggle, { passive: true });

    on(btn, 'click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReduced ? 'auto' : 'smooth'
      });
    });

    toggle();
  };

  /* ==========================================================
     YEAR IN FOOTER
  ========================================================== */
  const initYear = () => {
    const year = new Date().getFullYear();
    $$('[data-year]').forEach((el) => {
      el.textContent = year;
    });
  };

  /* ==========================================================
     BOOT
  ========================================================== */
  const boot = () => {
    initPreloader();
    initHeader();
    initNav();
    initSmoothScroll();
    initReveal();
    initFAQ();
    initForm();
    initCopy();
    initBackToTop();
    initYear();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();