// /**
//  * Game Timer Manager
//  * Handles countdown timers for questions and sections
//  */

import { TIMER_DURATION } from './game-config.js';

export class GameTimerManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.timerInterval = null;
    this.timerDuration = TIMER_DURATION;
    this.timerRemaining = TIMER_DURATION;
  }

  startTimerForSection() {
    this.startTimer(TIMER_DURATION);
  }

  startTimer(duration = TIMER_DURATION) {
    this.timerDuration = duration;
    this.timerRemaining = duration;
    this.stopTimer();
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timerRemaining -= 1;
      this.updateTimerDisplay();

      if (this.timerRemaining <= 0) {
        this.stopTimer();
        this.handleTimerComplete();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerElements = document.querySelectorAll('.counter-down');
    const progressBars = document.querySelectorAll('.timer-fill');

    timerElements.forEach((element) => {
      const isClueAnswers = element.closest('#clue-answers');
      element.innerHTML = this.formatTimerText(isClueAnswers);
    });

    progressBars.forEach((bar) => {
      const percentage = (this.timerRemaining / this.timerDuration) * 100;
      bar.style.width = `${percentage}%`;
      bar.style.backgroundColor = this.getTimerColor(percentage);
    });
  }

  formatTimerText(isClueAnswers) {
    const minutes = Math.floor(this.timerRemaining / 60);
    const seconds = this.timerRemaining % 60;
    const secFormatted = seconds.toString().padStart(2, '0');
    const icon = isClueAnswers ? './icons/time-or.svg' : './icons/time.svg';

    if (isClueAnswers) {
      return `<img src="${icon}" alt="Timer Icon" /> ${minutes}:${secFormatted}`;
    }

    if (this.timerRemaining >= 60) {
      return `<img src="${icon}" alt="Timer Icon" /> ${minutes}:${secFormatted}`;
    }

    return `<img src="${icon}" alt="Timer Icon" /> ${this.timerRemaining} sec`;
  }

  getTimerColor(percentage) {
    if (percentage <= 20) return '#f44336';
    if (percentage <= 40) return '#ff9800';
    return '#f2eb3c';
  }

  handleTimerComplete() {
    const socket = this.gameEngine.socketHandler.getSocket();
    const currentPlayerId = socket?.id;
    const player = this.gameEngine.players?.find((p) => p.id === currentPlayerId);

    const section = this.gameEngine.currentSection;

    // Sections that REQUIRE an answer
    const answerRequiredSections = [
      'category-question-1',
      'category-question-2',
      'dark-question-1',
      'dark-question-2',
    ];

    // If current section is a question that requires answer:
    if (answerRequiredSections.includes(section)) {
      // Check if user submitted an answer for THIS question
      const hasSubmitted = player?.answers?.some(
        (a) => a.section === section,
      ) || false;

      if (!hasSubmitted) {
        console.log('Player did not submit in time. Showing Not Qualified popup.');
        const me = this.gameEngine.players?.find((p) => p.id === currentPlayerId);
        if (me) me.notQualified = true;
        socket.emit('mark_not_qualified', {
          roomCode: this.gameEngine.roomCode,
          playerId: currentPlayerId,
        });
        this.gameEngine.showNotQualifiedPopup();

        return;
      }
    }

    // Normal transitions for other sections
    const transitions = {
      'category-question-1': 'category-question-2',
      'category-question-2': 'player-answers',
      'dark-question-1': 'dark-question-2',
      'dark-question-2': 'player-answers',
      'clue-answers': 'winner',
    };

    const nextSection = transitions[this.gameEngine.currentSection];
    if (nextSection) {
      this.gameEngine.sectionManager.showSection(nextSection);
    }
  }
}
