/**
 * Game Timer Manager
 * Handles countdown timers for questions and sections
 */
/* eslint-disable */
import { QUESTION_TIMER_DURATION, TIMER_DURATION, GAME_SECTIONS } from './game-config.js';

export class GameTimerManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.timer = null;
    this.timerInterval = null;
    this.remainingTime = 0;
  }

  /**
   * Start timer for current section
   */
  startTimerForSection() {
    const section = this.gameEngine.sectionManager?.getCurrentSection();
    if (!section) return;

    // Sections that need timers
    const timedSections = [
      GAME_SECTIONS.CATEGORY_QUESTION_1,
      GAME_SECTIONS.CATEGORY_QUESTION_2,
      GAME_SECTIONS.DARK_QUESTION_1,
      GAME_SECTIONS.DARK_QUESTION_2,
      GAME_SECTIONS.CLUE_ANSWERS
    ];

    if (timedSections.includes(section)) {
      const duration = this.getTimerDuration(section);
      this.startTimer(duration);
    }
  }

  /**
   * Get timer duration for section
   */
  getTimerDuration(section) {
    switch (section) {
      case GAME_SECTIONS.CLUE_ANSWERS:
        return TIMER_DURATION;
      case GAME_SECTIONS.CATEGORY_QUESTION_1:
      case GAME_SECTIONS.CATEGORY_QUESTION_2:
      case GAME_SECTIONS.DARK_QUESTION_1:
      case GAME_SECTIONS.DARK_QUESTION_2:
        return QUESTION_TIMER_DURATION;
      default:
        return 30;
    }
  }

  /**
   * Start a countdown timer
   */
  startTimer(duration) {
    this.stopTimer(); // Clear any existing timer

    this.remainingTime = duration;
    const timerFill = this.gameEngine.block.querySelector('.timer-fill');
    const counterDisplay = this.gameEngine.block.querySelector('.counter-down span');

    if (!timerFill || !counterDisplay) return;

    // Initial display
    this.updateTimerDisplay(duration, duration, timerFill, counterDisplay);

    // Start countdown
    this.timerInterval = setInterval(() => {
      this.remainingTime--;

      this.updateTimerDisplay(this.remainingTime, duration, timerFill, counterDisplay);

      // Timer finished
      if (this.remainingTime <= 0) {
        this.stopTimer();
        this.handleTimeout();
      }

      // Warning state (last 10 seconds)
      if (this.remainingTime <= 10) {
        timerFill?.classList.add('warning');
      }
    }, 1000);
  }

  /**
   * Update timer display
   */
  updateTimerDisplay(remaining, total, timerFill, counterDisplay) {
    if (counterDisplay) {
      counterDisplay.textContent = `${remaining} sec`;
    }

    if (timerFill) {
      const percentage = (remaining / total) * 100;
      timerFill.style.width = `${percentage}%`;
    }
  }

  /**
   * Handle timer timeout
   */
  handleTimeout() {
    console.log('⏰ Timer expired');

    // Auto-submit if in question section
    const section = this.gameEngine.sectionManager?.getCurrentSection();
    const questionSections = [
      GAME_SECTIONS.CATEGORY_QUESTION_1,
      GAME_SECTIONS.CATEGORY_QUESTION_2,
      GAME_SECTIONS.DARK_QUESTION_1,
      GAME_SECTIONS.DARK_QUESTION_2
    ];

    if (questionSections.includes(section)) {
      // Show "time's up" notification
      this.showTimeoutNotification();
      
      // Auto-advance after delay
      setTimeout(() => {
        this.gameEngine.handleQuestionTimeout();
      }, 2000);
    }
  }

  /**
   * Show timeout notification
   */
  showTimeoutNotification() {
    // You can customize this to show a toast/modal
    const notification = this.gameEngine.block.querySelector('.timeout-notification');
    if (notification) {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
      }, 2000);
    }
  }

  /**
   * Stop the timer
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Reset warning state
    const timerFill = this.gameEngine.block.querySelector('.timer-fill');
    if (timerFill) {
      timerFill.classList.remove('warning');
    }
  }

  /**
   * Pause the timer
   */
  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  /**
   * Resume the timer
   */
  resumeTimer() {
    if (this.remainingTime > 0 && !this.timerInterval) {
      const duration = this.remainingTime;
      this.startTimer(duration);
    }
  }

  /**
   * Get remaining time
   */
  getRemainingTime() {
    return this.remainingTime;
  }
}
