const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const closeLightboxButton = document.querySelector('#close-lightbox');
const videoModal = document.querySelector('#video-modal');
const videoModalContent = document.querySelector('#video-modal-content');
const closeVideoButton = document.querySelector('#close-video');
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
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

// Открытие фотографий в увеличенном виде
const galleryButtons = document.querySelectorAll('.gallery-item');
galleryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const image = button.querySelector('img');
    if (!image) return;
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    openModal(lightbox);
    closeLightboxButton.focus();
  });
});

closeLightboxButton.addEventListener('click', () => closeModal(lightbox));
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeModal(lightbox);
});

// Локальное видео: положи MP4 в assets/videos/dom-adamini.mp4.
// Если файл называется иначе или лежит в другом месте, измени data-video-src в index.html.
document.querySelector('#open-video').addEventListener('click', (event) => {
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

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (lightbox.classList.contains('is-open')) closeModal(lightbox);
    if (videoModal.classList.contains('is-open')) closeVideo();
  }
});
