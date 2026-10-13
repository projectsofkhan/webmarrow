/* ============================================================
   WEBMARROW — SCRIPT.JS
   ------------------------------------------------------------
   Slow, smooth interactions. No custom cursor. No heavy effects.
   ============================================================ */

(() => {
  'use strict';

  const CONFIG = {
    revealThreshold: 0.14,
    revealRootMargin: '0px 0px -60px 0px',
    headerScrollAfter: 12,
    headerHideAfter: 400,
    preloaderMinDuration: 2400,
    preloaderFadeDuration: 1000,
    contactEmail: 'webmarrow@gmail.com'
  };

  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  /* ==========================================================
     PRELOADER — held visible for a calm, deliberate reveal
  ========================================================== */
  const initPreloader = () => {
    const preloader = $('#preloader');
    if (!preloader) return;

    const startTime = Date.now();

    const hide = () => {
      const elapsed = Date.now() - startTime;
      const wait = Math.max(0, CONFIG.preloaderMinDuration - elapsed);

      setTimeout(() => {
        preloader.classList.add('is-hidden');

        setTimeout(() => {
          if (preloader.parentNode) preloader.remove();
        }, CONFIG.preloaderFadeDuration);
      }, wait);
    };

    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide);
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
          }, 1800);
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