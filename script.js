(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Шапка, прогресс, параллакс ---------- */
  const header = $('#site-header');
  const progress = $('#progress');
  const heroImg = $('#hero-img');
  const timeline = $('#timeline-list');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle('is-scrolled', y > 40);
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);

    if (!reduceMotion && heroImg && y < window.innerHeight * 1.2) {
      heroImg.style.setProperty('--py', `${(y * 0.22).toFixed(1)}px`);
    }

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const ratio = (window.innerHeight * 0.62 - r.top) / r.height;
      timeline.style.setProperty('--tl', Math.min(1, Math.max(0, ratio)).toFixed(4));
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Появление блоков ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Подсветка текущего раздела в меню ---------- */
  const navLinks = $$('.main-nav a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Счётчики «Дом в цифрах» ---------- */
  function animateCount(el) {
    const to = Number(el.dataset.count);
    const from = Number(el.dataset.from || 0);
    if (reduceMotion) { el.textContent = to; return; }
    const duration = 1800;
    const start = performance.now();
    el.textContent = from;
    (function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { animateCount(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- Слайдер «тогда и сейчас» ---------- */
  const compare = $('#compare');
  const compareRange = $('#compare-range');
  function setPos(v) { compare.style.setProperty('--pos', `${v}%`); }
  compareRange.addEventListener('input', () => setPos(compareRange.value));

  if ('IntersectionObserver' in window && !reduceMotion) {
    const intro = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      intro.disconnect();
      const from = 94, to = 50, duration = 1600, t0 = performance.now();
      (function step(now) {
        if (compareRange.dataset.touched) return;
        const t = Math.min(1, (now - t0) / duration);
        const v = from + (to - from) * (1 - Math.pow(1 - t, 3));
        compareRange.value = v;
        setPos(v);
        if (t < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.5 });
    intro.observe(compare);
    ['pointerdown', 'keydown'].forEach((ev) => compareRange.addEventListener(ev, () => { compareRange.dataset.touched = '1'; }, { once: true }));
  }

  /* ---------- Раскрывающиеся панели «Приметы стиля» ---------- */
  const panels = $$('.panel');
  function activatePanel(panel) {
    panels.forEach((p) => {
      const on = p === panel;
      p.classList.toggle('is-active', on);
      p.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  }
  const canHover = window.matchMedia('(hover: hover) and (min-width: 761px)').matches;
  panels.forEach((panel) => {
    panel.addEventListener('click', () => activatePanel(panel));
    panel.addEventListener('focus', () => activatePanel(panel));
    if (canHover) panel.addEventListener('mouseenter', () => activatePanel(panel));
  });

  /* ---------- Модальные окна ---------- */
  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightbox-image');
  const closeLightboxButton = $('#close-lightbox');
  const lbPrev = $('#lb-prev');
  const lbNext = $('#lb-next');
  const lbCaption = $('#lb-caption');
  const lbCount = $('#lb-count');
  const videoModal = $('#video-modal');
  const videoModalContent = $('#video-modal-content');
  const closeVideoButton = $('#close-video');
  let lastFocusedElement = null;

  function openModal(modal) {
    lastFocusedElement = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
  function closeModal(modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  }

  /* ---------- Галерея: фильтры и просмотр ---------- */
  const galleryItems = $$('.gallery-item');
  const chips = $$('.chip');
  let currentIndex = 0;

  const visibleItems = () => galleryItems.filter((item) => !item.hidden);

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      let n = 0;
      galleryItems.forEach((item) => {
        const show = filter === 'all' || item.dataset.tag === filter;
        item.hidden = !show;
        if (show) item.style.animationDelay = `${Math.min(n++, 8) * 0.05}s`;
      });
    });
  });

  function showPhoto(index) {
    const list = visibleItems();
    if (!list.length) return;
    currentIndex = (index + list.length) % list.length;
    const img = $('img', list[currentIndex]);
    lightboxImage.src = img.currentSrc || img.src;
    lightboxImage.alt = img.alt;
    lbCaption.textContent = img.alt;
    lbCount.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    // подгружаем соседние кадры заранее
    [1, -1].forEach((d) => {
      const neighbour = $('img', list[(currentIndex + d + list.length) % list.length]);
      if (neighbour) new Image().src = neighbour.src;
    });
  }

  galleryItems.forEach((button) => {
    button.addEventListener('click', () => {
      showPhoto(visibleItems().indexOf(button));
      openModal(lightbox);
      closeLightboxButton.focus();
    });
  });

  closeLightboxButton.addEventListener('click', () => closeModal(lightbox));
  lbPrev.addEventListener('click', () => showPhoto(currentIndex - 1));
  lbNext.addEventListener('click', () => showPhoto(currentIndex + 1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeModal(lightbox);
  });

  // свайп на телефоне
  let touchX = null;
  lightbox.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) showPhoto(currentIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ---------- Видео ---------- */
  // Локальное видео: положи MP4 в assets/videos/dom-adamini.mp4.
  // Если файл называется иначе или лежит в другом месте, измени data-video-src в index.html.
  $('#open-video').addEventListener('click', (event) => {
    const videoSrc = event.currentTarget.dataset.videoSrc?.trim();

    if (videoSrc) {
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.poster = 'assets/video-poster.jpg';
      video.setAttribute('aria-label', 'Видео о доме Адамини');

      const source = document.createElement('source');
      source.src = videoSrc;
      source.type = 'video/mp4';
      video.appendChild(source);

      video.addEventListener('error', () => {
        videoModalContent.innerHTML = '<p><strong>Не удалось загрузить видео.</strong><br>Проверь, что файл находится по пути <code>assets/videos/dom-adamini.mp4</code> и сохранён в формате MP4 (H.264).</p>';
      }, { once: true });

      videoModalContent.replaceChildren(video);
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => { /* Если автозапуск запрещён, пользователь нажмёт Play сам. */ });
      }
    } else {
      videoModalContent.innerHTML = '<p><strong>Видео пока не подключено.</strong><br>Укажи путь к MP4 в атрибуте <code>data-video-src</code> кнопки в <code>index.html</code>.</p>';
    }

    openModal(videoModal);
    closeVideoButton.focus();
  });

  function closeVideo() {
    closeModal(videoModal);
    // Останавливаем воспроизведение при закрытии окна
    videoModalContent.replaceChildren();
  }
  closeVideoButton.addEventListener('click', closeVideo);
  videoModal.addEventListener('click', (event) => {
    if (event.target === videoModal) closeVideo();
  });

  /* ---------- Клавиатура ---------- */
  document.addEventListener('keydown', (event) => {
    const lbOpen = lightbox.classList.contains('is-open');
    if (event.key === 'Escape') {
      if (lbOpen) closeModal(lightbox);
      if (videoModal.classList.contains('is-open')) closeVideo();
    }
    if (lbOpen && event.key === 'ArrowRight') showPhoto(currentIndex + 1);
    if (lbOpen && event.key === 'ArrowLeft') showPhoto(currentIndex - 1);
  });
})();
