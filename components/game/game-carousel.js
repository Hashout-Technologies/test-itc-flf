/**
 * Games Carousel
 * Handles swipeable game selection carousel
 */
/* eslint-disable */
export class GamesCarousel {
  constructor(track, indicators) {
    this.track = track;
    this.indicators = indicators;
    this.cards = track.querySelectorAll('.game-card');
    this.currentSlide = 0;
    this.totalSlides = this.cards.length;
    this.isDragging = false;
    this.startX = 0;
    this.currentX = 0;

    this.init();
  }

  /**
   * Initialize carousel
   */
  init() {
    this.setupEventListeners();
    this.updateCarousel();
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Indicator clicks
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => this.goToSlide(index));
    });

    // Touch and mouse events
    this.setupTouchEvents();
    this.setupMouseEvents();
    this.setupKeyboardNavigation();
  }

  /**
   * Setup touch events for mobile
   */
  setupTouchEvents() {
    this.track.addEventListener('touchstart', (e) => {
      this.handleDragStart(e.touches[0].clientX);
    }, { passive: true });

    this.track.addEventListener('touchmove', (e) => {
      if (this.isDragging) {
        e.preventDefault();
        this.handleDragMove(e.touches[0].clientX);
      }
    }, { passive: false });

    this.track.addEventListener('touchend', (e) => {
      this.handleDragEnd(e.changedTouches[0].clientX);
    });
  }

  /**
   * Setup mouse events for desktop
   */
  setupMouseEvents() {
    this.track.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.handleDragStart(e.clientX);
    });

    this.track.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        e.preventDefault();
        this.handleDragMove(e.clientX);
      }
    });

    this.track.addEventListener('mouseup', (e) => {
      this.handleDragEnd(e.clientX);
    });

    this.track.addEventListener('mouseleave', () => {
      if (this.isDragging) {
        this.handleDragEnd(this.currentX);
      }
    });

    // Prevent text selection during drag
    this.track.addEventListener('selectstart', (e) => {
      if (this.isDragging) {
        e.preventDefault();
      }
    });
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (!this.track.closest('.games-carousel')) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.prevSlide();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.nextSlide();
          break;
      }
    });
  }

  /**
   * Handle drag start
   */
  handleDragStart(clientX) {
    this.isDragging = true;
    this.startX = clientX;
    this.currentX = clientX;
    this.track.style.cursor = 'grabbing';
  }

  /**
   * Handle drag move
   */
  handleDragMove(clientX) {
    if (!this.isDragging) return;
    this.currentX = clientX;
  }

  /**
   * Handle drag end
   */
  handleDragEnd(clientX) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.track.style.cursor = 'grab';

    const diffX = this.startX - clientX;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }

  /**
   * Go to specific slide
   */
  goToSlide(slideIndex) {
    if (slideIndex < 0 || slideIndex >= this.totalSlides) return;
    this.currentSlide = slideIndex;
    this.updateCarousel();
  }

  /**
   * Go to next slide
   */
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.updateCarousel();
  }

  /**
   * Go to previous slide
   */
  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.updateCarousel();
  }

  /**
   * Update carousel display
   */
  updateCarousel() {
    // Update track position
    const cardWidth = 280;
    const gap = 16;
    const translateX = -this.currentSlide * (cardWidth + gap);
    this.track.style.transform = `translateX(${translateX}px)`;

    // Update indicators
    this.indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === this.currentSlide);
      indicator.setAttribute('aria-current', index === this.currentSlide ? 'true' : 'false');
    });

    // Update cards
    this.cards.forEach((card, index) => {
      card.classList.toggle('active', index === this.currentSlide);
    });
  }

  /**
   * Add new slide dynamically
   */
  addSlide(cardHTML) {
    const newCard = document.createElement('div');
    newCard.className = 'game-card';
    newCard.innerHTML = cardHTML;
    this.track.appendChild(newCard);

    // Update references
    this.cards = this.track.querySelectorAll('.game-card');
    this.totalSlides = this.cards.length;

    // Recreate indicators if needed
    this.createIndicators();
  }

  /**
   * Remove slide
   */
  removeSlide(index) {
    if (index >= 0 && index < this.totalSlides && this.totalSlides > 1) {
      const cardToRemove = this.cards[index];
      if (cardToRemove) {
        cardToRemove.remove();

        // Update references
        this.cards = this.track.querySelectorAll('.game-card');
        this.totalSlides = this.cards.length;

        // Adjust current slide if necessary
        if (this.currentSlide >= this.totalSlides) {
          this.currentSlide = this.totalSlides - 1;
        }

        // Update display
        this.updateCarousel();
      }
    }
  }

  /**
   * Create indicators
   */
  createIndicators() {
    const indicatorsContainer = this.track
      .closest('.games-carousel')
      ?.querySelector('.games-carousel__indicators');

    if (!indicatorsContainer) return;

    indicatorsContainer.innerHTML = '';

    for (let i = 0; i < this.totalSlides; i++) {
      const indicator = document.createElement('button');
      indicator.className = 'indicator';
      indicator.setAttribute('data-slide', i);
      indicator.setAttribute('aria-label', `Go to slide ${i + 1}`);

      if (i === this.currentSlide) {
        indicator.classList.add('active');
      }

      indicator.addEventListener('click', () => this.goToSlide(i));
      indicatorsContainer.appendChild(indicator);
    }

    // Update indicators reference
    this.indicators = indicatorsContainer.querySelectorAll('.indicator');
  }

  /**
   * Destroy carousel
   */
  destroy() {
    // Remove event listeners
    this.indicators.forEach((indicator) => {
      indicator.replaceWith(indicator.cloneNode(true));
    });

    // Clear styles
    this.track.style.transform = '';
    this.track.style.cursor = '';
  }
}
