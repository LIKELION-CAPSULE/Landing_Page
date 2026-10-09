(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Scroll hint → glide to the story instead of jumping.
  const hint = document.querySelector('.scroll-hint');
  const target = document.getElementById('problem');
  hint?.addEventListener('click', (event) => {
    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  });

  // Hero exit fallback for browsers without CSS scroll-driven animations.
  // Mirrors the `hero-exit` keyframes in styles.css.
  if (!CSS.supports('animation-timeline: scroll()')) {
    const inner = document.querySelector('.hero__inner');
    let ticking = false;

    const update = () => {
      ticking = false;
      const p = Math.min(Math.max(window.scrollY / window.innerHeight, 0), 1);
      inner.style.opacity = String(1 - 0.9 * p);
      inner.style.transform = reduceMotion.matches
        ? 'none'
        : `translateY(${30 * p}%) scale(${1 - 0.06 * p})`;
      hint.style.opacity = String(1 - Math.min(p / 0.2, 1));
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  // Reveal story blocks once as they enter. Siblings that enter together
  // are staggered by 60ms so they don't all land at once.
  const revealables = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.setAttribute('data-visible', ''));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((entry, index) => {
        entry.target.style.setProperty('--reveal-delay', `${index * 60}ms`);
        entry.target.setAttribute('data-visible', '');
        observer.unobserve(entry.target);
      });
  }, { rootMargin: '0px 0px -12% 0px' });

  revealables.forEach((el) => observer.observe(el));
})();
