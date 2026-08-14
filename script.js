/**
 * =============================================================================
 * LUNA CAFÃ‰ â€” script.js
 * =============================================================================
 * Vanilla JS only â€” no framework dependencies.
 *
 * Features:
 *  1. Sticky header background on scroll
 *  2. Mobile menu toggle (hamburger open/close)
 *  3. Mobile menu: close on link click
 *  4. Smooth-scroll for all anchor <a> links
 *  5. ScrollSpy â€” highlights the active nav link as sections enter view
 *  6. Form: prevent default submit + show toast confirmation
 *  7. Entrance animations triggered on scroll (Intersection Observer)
 * =============================================================================
 */

(function () {
  'use strict';

  /* â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* Wait for DOM to be ready */
  document.addEventListener('DOMContentLoaded', init);

  function init () {
    initStickyHeader();
    initMobileMenu();
    initSmoothScroll();
    initScrollSpy();
    initReservationForm();
    initScrollReveal();
    initAboutReveal();
    initStatCounters();
  }


  /* =========================================================================
   * 1. STICKY HEADER â€” add `.is-scrolled` class when page scrolls > 40px
   * ======================================================================= */
  function initStickyHeader () {
    const header = qs('#site-header');
    if (!header) return;

    const SCROLL_THRESHOLD = 40;

    function onScroll () {
      if (window.scrollY > SCROLL_THRESHOLD) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run on load in case page starts scrolled
  }


  /* =========================================================================
   * 2. MOBILE MENU TOGGLE
   * ======================================================================= */
  function initMobileMenu () {
    const toggle = qs('#nav-toggle');
    const menu   = qs('#mobile-menu');
    if (!toggle || !menu) return;

    function openMenu () {
      toggle.classList.add('is-open');
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');

      // Allow mobile links to receive focus
      qsa('.luna-mobile-link, .luna-mobile-cta', menu).forEach(
        el => el.setAttribute('tabindex', '0')
      );

      // Prevent body scroll while menu is open
      document.body.style.overflow = 'hidden';
    }

    function closeMenu () {
      toggle.classList.remove('is-open');
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');

      qsa('.luna-mobile-link, .luna-mobile-cta', menu).forEach(
        el => el.setAttribute('tabindex', '-1')
      );

      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
      const isOpen = toggle.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });

    /* 3. CLOSE MENU ON LINK CLICK */
    qsa('.luna-mobile-link, .luna-mobile-cta', menu).forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    /* Close on Escape key */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && toggle.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });

    /* Close if user clicks outside the menu */
    document.addEventListener('click', e => {
      if (
        toggle.classList.contains('is-open') &&
        !menu.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closeMenu();
      }
    });
  }


  /* =========================================================================
   * 4. SMOOTH SCROLL â€” intercept anchor clicks for smooth scrolling
   *    (CSS scroll-behavior handles most cases, but this gives more control
   *     and handles offset for the fixed header.)
   * ======================================================================= */
  function initSmoothScroll () {
    const HEADER_OFFSET = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--header-h') || '88',
      10
    );

    document.addEventListener('click', e => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const targetId = anchor.getAttribute('href').slice(1);
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top
                + window.scrollY
                - HEADER_OFFSET;

      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  }


  /* =========================================================================
   * 5. SCROLLSPY â€” highlight nav link whose section is in view
   * ======================================================================= */
  function initScrollSpy () {
    const sections  = qsa('main section[id]');
    const navLinks  = qsa('.luna-nav-link');
    if (!sections.length || !navLinks.length) return;

    const HEADER_H = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--header-h') || '88',
      10
    );

    /* Map section id â†’ nav link */
    const linkMap = {};
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        linkMap[href.slice(1)] = link;
      }
    });

    function setActive (id) {
      navLinks.forEach(l => {
        l.classList.remove('luna-nav-active', 'is-active');
        l.removeAttribute('aria-current');
      });
      if (linkMap[id]) {
        linkMap[id].classList.add('luna-nav-active', 'is-active');
        linkMap[id].setAttribute('aria-current', 'page');
      }
    }

    /* Use Intersection Observer for performance */
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: `-${HEADER_H}px 0px -55% 0px`,
        threshold: 0,
      }
    );

    sections.forEach(sec => observer.observe(sec));
  }


  /* =========================================================================
   * 6. RESERVATION FORM â€” prevent submit + show toast
   * ======================================================================= */
  function initReservationForm () {
    const form = qs('.luna-contact-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();

      // Basic field validation
      const name    = qs('#res-name',   form);
      const email   = qs('#res-email',  form);
      const date    = qs('#res-date',   form);
      const guests  = qs('#res-guests', form);

      if (!name.value.trim() || !email.value.trim() || !date.value || !guests.value) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      // Simulate form submission
      const submitBtn = qs('.luna-form-submit', form);
      submitBtn.textContent = 'Sendingâ€¦';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = 'Request Reservation';
        submitBtn.disabled = false;
        showToast(`Thank you, ${name.value.trim()}! We'll confirm your reservation shortly.`, 'success');
        form.reset();
      }, 1400);
    });
  }

  /** Show a temporary toast notification */
  function showToast (message, type = 'success') {
    // Remove any existing toast
    const existing = qs('.luna-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `luna-toast luna-toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;

    Object.assign(toast.style, {
      position:        'fixed',
      bottom:          '32px',
      left:            '50%',
      transform:       'translateX(-50%) translateY(100px)',
      background:      type === 'success' ? '#1a1a0f' : '#1a0a0a',
      border:          `1px solid ${type === 'success' ? '#C9A96E' : '#c96e6e'}`,
      color:           type === 'success' ? '#C9A96E' : '#c96e6e',
      padding:         '14px 28px',
      borderRadius:    '50px',
      fontFamily:      "'Montserrat', sans-serif",
      fontSize:        '0.78rem',
      fontWeight:      '600',
      letterSpacing:   '0.08em',
      zIndex:          '9999',
      maxWidth:        '420px',
      textAlign:       'center',
      backdropFilter:  'blur(12px)',
      boxShadow:       '0 8px 32px rgba(0,0,0,0.5)',
      transition:      'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s',
      opacity:         '0',
      pointerEvents:   'none',
    });

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
      });
    });

    // Auto-remove after 4s
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }


  /* =========================================================================
   * 7. SCROLL REVEAL â€” fade-up elements as they enter the viewport
   *    Adds `.luna-revealed` class to trigger CSS transitions.
   * ======================================================================= */
  function initScrollReveal () {
    const REVEAL_SELECTOR = [
      '.luna-section-heading',
      '.luna-section-body',
      '.luna-feature-item',
      '.luna-contact-form',
      '.luna-footer-brand',
      '.luna-footer-nav',
      '.luna-footer-social',
    ].join(', ');

    const targets = qsa(REVEAL_SELECTOR);
    if (!targets.length) return;

    /* Prepare elements */
    targets.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = `opacity 0.7s ${i * 0.06}s ease, transform 0.7s ${i * 0.06}s ease`;
    });

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            entry.target.classList.add('luna-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach(el => observer.observe(el));
  }



  /* =========================================================================
   * 8. ABOUT SECTION SCROLL REVEAL
   *    Stagger `is-visible` class onto each about element as section enters view.
   * ======================================================================= */
  function initAboutReveal () {
    const revealEls = qsa(
      '.luna-about-eyebrow, .luna-about-heading, .luna-about-rule, ' +
      '.luna-about-body, .luna-about-cta, .luna-about-stats'
    );
    if (!revealEls.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach(el => observer.observe(el));
  }


  /* =========================================================================
   * 9. STAT COUNTERS â€” animate numbers from 0 to data-target on scroll
   * ======================================================================= */
  function initStatCounters () {
    const statsSection = qs('.luna-about-stats');
    if (!statsSection) return;

    const counters = qsa('.luna-about-stat-value', statsSection);
    let animated = false;

    function animateCounters () {
      if (animated) return;
      animated = true;

      counters.forEach(counter => {
        const target = parseInt(counter.dataset.target, 10);
        const suffix = counter.dataset.suffix || '';
        const duration = 1400; // ms
        const start = performance.now();

        function step (now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = Math.round(eased * target);
          counter.textContent = value + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
      });
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Small delay so the reveal animation fires first
            setTimeout(animateCounters, 300);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(statsSection);
  }


  /* =========================================================================
   * 8. SIGNATURE MENU (lsm-*) â€” scroll-reveal + interactions
   * ======================================================================= */
  function initSignatureMenu () {

    /* â”€â”€ Scroll-reveal for .luna-reveal elements in the menu section â”€â”€ */
    const revealEls = qsa('.lsm-section .luna-reveal');
    if (revealEls.length) {
      const revealObs = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      revealEls.forEach(el => revealObs.observe(el));
    }

    /* â”€â”€ Stamp spin direction follows cursor position â”€â”€ */
    qsa('.lsm-card').forEach(card => {
      const stamp = card.querySelector('.lsm-stamp');
      if (!stamp) return;

      card.addEventListener('mousemove', e => {
        const r  = card.getBoundingClientRect();
        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;
        const dx = (e.clientX - cx) / (r.width  / 2);
        const dy = (e.clientY - cy) / (r.height / 2);
        const deg = Math.atan2(dy, dx) * (180 / Math.PI);
        // small extra tilt on top of the CSS hover transform
        stamp.style.setProperty('--stamp-cursor-deg', `${deg * 0.1}deg`);
      });

      card.addEventListener('mouseleave', () => {
        stamp.style.removeProperty('--stamp-cursor-deg');
      });
    });

    /* â”€â”€ Ripple on CTA buttons â”€â”€ */
    qsa('.lsm-section .lsm-card-cta').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const old = this.querySelector('.lsm-ripple');
        if (old) old.remove();

        const rpl  = document.createElement('span');
        rpl.className = 'lsm-ripple';
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2.2;

        Object.assign(rpl.style, {
          position:      'absolute',
          width:         `${size}px`,
          height:        `${size}px`,
          left:          `${e.clientX - rect.left - size / 2}px`,
          top:           `${e.clientY - rect.top  - size / 2}px`,
          borderRadius:  '50%',
          background:    'rgba(255,255,255,0.18)',
          transform:     'scale(0)',
          pointerEvents: 'none',
          animation:     'lsm-ripple-kf 0.55s ease-out forwards',
        });

        this.appendChild(rpl);
        setTimeout(() => rpl.remove(), 600);
      });
    });

    /* Inject ripple keyframe once */
    if (!document.getElementById('lsm-ripple-style')) {
      const s = document.createElement('style');
      s.id = 'lsm-ripple-style';
      s.textContent = '@keyframes lsm-ripple-kf { to { transform:scale(1); opacity:0; } }';
      document.head.appendChild(s);
    }

    /* â”€â”€ Background glow slow parallax on scroll â”€â”€ */
    const section = qs('#menu');
    if (!section) return;

    const glowA = section.querySelector('.lsm-bg-glow--a');
    const glowB = section.querySelector('.lsm-bg-glow--b');

    let rp = false;
    window.addEventListener('scroll', () => {
      if (rp) return;
      rp = true;
      requestAnimationFrame(() => {
        const pct = 1 - section.getBoundingClientRect().top / window.innerHeight;
        if (pct > -0.5 && pct < 2) {
          const shift = (pct - 0.5) * 16;
          if (glowA) glowA.style.transform = `translate(${-shift}px, ${shift * 0.5}px)`;
          if (glowB) glowB.style.transform = `translate(${shift}px, ${-shift * 0.4}px)`;
        }
        rp = false;
      });
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', initSignatureMenu);

})();
