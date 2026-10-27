/* 美的历程 · 主题导览折页
   Interactions: reveal-on-scroll, reading progress, exhibit rail,
   handscroll lightbox, cover drift. No dependencies. */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------------------------------------------------------- reveal --- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* --------------------------------------------------------- timeline --- */
  const timeline = $('.timeline');
  if (timeline && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    io.observe(timeline);
  } else if (timeline) {
    timeline.classList.add('is-in');
  }

  /* ------------------------------------------------ progress + rail --- */
  const bar = $('.progress i');
  const rail = $('.rail');
  const cover = $('.cover');
  const closing = $('.closing');
  const plates = $$('.plate');
  const railLinks = $$('.rail a');
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY || doc.scrollTop;

      if (bar && max > 0) {
        bar.style.transform = `scaleX(${Math.min(1, Math.max(0, y / max))})`;
      }

      // rail appears once the leaflet is open, and turns light over the coda
      if (rail) {
        const pastCover = !cover || y > cover.offsetHeight * 0.42;
        rail.classList.toggle('is-visible', pastCover);
        const darkTop = closing ? closing.offsetTop : Infinity;
        rail.classList.toggle('rail--on-dark', y + window.innerHeight * 0.5 > darkTop);
      }

      // cover title drifts and dissolves as the leaflet opens
      if (!reduce.matches && cover) {
        const stage = $('.cover__stage', cover);
        const p = Math.min(1, y / (window.innerHeight || 1));
        if (stage) {
          stage.style.transform = `translate3d(0, ${p * -46}px, 0)`;
          stage.style.opacity = String(1 - p * 0.85);
        }
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* active plate in the rail */
  if ('IntersectionObserver' in window && railLinks.length) {
    const visible = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let best = null;
      let bestRatio = 0;
      visible.forEach((ratio, id) => {
        if (ratio > bestRatio) { bestRatio = ratio; best = id; }
      });
      railLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.rail === best));
    }, { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-30% 0px -40% 0px' });
    plates.forEach((p) => io.observe(p));
  }

  /* --------------------------------------------------------- lightbox --- */
  const dialog = $('#lightbox');
  const mounts = $$('.mount__img');
  const gallery = mounts.map((el, i) => {
    const img = $('img', el);
    const fig = el.closest('.mount');
    const cap = fig ? $('figcaption', fig) : null;
    return {
      index: i,
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || '',
      caption: cap ? cap.textContent.trim() : ''
    };
  });

  let current = 0;

  const paint = (i) => {
    if (!dialog) return;
    current = (i + gallery.length) % gallery.length;
    const item = gallery[current];
    const img = $('img', dialog);
    const cap = $('figcaption', dialog);
    const idx = $('.lightbox__index', dialog);
    img.src = item.src;
    img.alt = item.alt;
    cap.textContent = item.caption;
    if (idx) idx.textContent = `${String(current + 1).padStart(2, '0')} / ${String(gallery.length).padStart(2, '0')}`;
  };

  const open = (i) => {
    if (!dialog || typeof dialog.showModal !== 'function') return;
    paint(i);
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
  };

  mounts.forEach((el, i) => {
    el.addEventListener('click', () => open(i));
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', '查看高清图版');
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  if (dialog) {
    $('[data-close]', dialog)?.addEventListener('click', () => dialog.close());
    $('[data-prev]', dialog)?.addEventListener('click', () => paint(current - 1));
    $('[data-next]', dialog)?.addEventListener('click', () => paint(current + 1));

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); paint(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); paint(current + 1); }
    });
    dialog.addEventListener('close', () => {
      document.documentElement.style.overflow = '';
    });
  }

  /* ------------------------------------------------------------ print --- */
  $$('[data-print]').forEach((btn) => {
    btn.addEventListener('click', () => window.print());
  });
})();
