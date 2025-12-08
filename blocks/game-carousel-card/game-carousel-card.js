import { CreateElem } from '../../scripts/utils.js';

export default function decorate(block) {
  const divs = [...block.children];

  const titleDiv = divs[0];
  titleDiv.classList.add('title');

  const carouselWrapper = CreateElem('div', 'carousel-card-list');

  divs.slice(1).forEach((div, idx) => {
    div.classList.add('carousel-card-item', 'carousel-slide');
    div.setAttribute('data-slide-index', idx);

    const innerDivs = [...div.children];

    innerDivs[0].classList.add('carousel-card-item-title');

    const pictureContainer = innerDivs[1];
    pictureContainer.classList.add('carousel-card-item-image');
    const picture = pictureContainer.querySelector('picture');
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        pictureContainer.innerHTML = '';
        pictureContainer.append(img);
      }
    }

    const altDiv = innerDivs[2];
    const altText = altDiv?.querySelector('p')?.textContent?.trim();
    if (altText) {
      const img = pictureContainer.querySelector('img');
      if (img) img.alt = altText;
    }
    altDiv.remove();

    const buttonDiv = innerDivs[3];
    buttonDiv.classList.add('carousel-card-cta');

    const link = buttonDiv.querySelector('a');
    if (link) {
      link.classList.remove('button');
      link.classList.add('cta-link');
    }
    const paragraph = buttonDiv.querySelector('p');
    if (paragraph && link) {
      paragraph.replaceWith(link);
    }

    if (link) link.removeAttribute('title');

    const playTextDiv = innerDivs[4];
    const playText = playTextDiv?.querySelector('p')?.textContent?.trim();
    if (playText && link) {
      link.textContent = playText;
    }

    playTextDiv.remove();
    carouselWrapper.append(div);
  });

  block.append(carouselWrapper);

  const indicatorContainer = CreateElem('div', 'indicator-container');
  const slides = carouselWrapper.querySelectorAll('.carousel-slide');
  let currentIndex = 0;
  const carousel = carouselWrapper;

  function updateCarousel() {
    const itemWidth = slides[0].offsetWidth + 16;
    carousel.scrollTo({
      left: currentIndex * itemWidth,
      behavior: 'smooth',
    });

    indicatorContainer.querySelectorAll('.indicator-item').forEach((ind, i) => {
      ind.classList.toggle('active-indicator', i === currentIndex);
    });
  }

  slides.forEach((_, idx) => {
    const indicator = CreateElem(
      'button',
      `indicator-item ${idx === 0 ? 'active-indicator' : ''}`,
      `indicator-${idx}`,
    );
    indicator.addEventListener('click', () => {
      currentIndex = idx;
      updateCarousel();
    });
    indicatorContainer.appendChild(indicator);
  });

  block.appendChild(indicatorContainer);

  let isMoving = false;
  let startX = 0;
  let startY = 0;
  let scrollLeft = 0;
  let isHorizontalScroll = false;

  function handleStart(e) {
    isMoving = true;
    startX = (e.pageX || e.touches[0].pageX) - carousel.offsetLeft;
    startY = e.pageY || e.touches[0].pageY;
    scrollLeft = carousel.scrollLeft;
    isHorizontalScroll = false;
    e.preventDefault();
  }

  function handleMove(e) {
    if (!isMoving) return;
    const x = (e.pageX || e.touches[0].pageX) - carousel.offsetLeft;
    const y = e.pageY || e.touches[0].pageY;

    const deltaX = x - startX;
    const deltaY = y - startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (e.cancelable) e.preventDefault();
      isHorizontalScroll = true;
      const walk = deltaX * 1;
      carousel.scrollLeft = scrollLeft - walk;
    }
  }

  function handleEnd() {
    if (!isMoving) return;
    isMoving = false;
    if (isHorizontalScroll) {
      const itemWidth = slides[0].offsetWidth + 16;
      const nearestIndex = Math.round(carousel.scrollLeft / itemWidth);
      currentIndex = Math.max(0, Math.min(nearestIndex, slides.length - 1));
      updateCarousel();
    }
  }

  carousel.addEventListener('mousedown', handleStart);
  carousel.addEventListener('mousemove', handleMove);
  carousel.addEventListener('mouseleave', handleEnd);
  carousel.addEventListener('mouseup', handleEnd);
  carousel.addEventListener('touchstart', handleStart, { passive: false });
  carousel.addEventListener('touchmove', handleMove, { passive: false });
  carousel.addEventListener('touchend', handleEnd);
}
