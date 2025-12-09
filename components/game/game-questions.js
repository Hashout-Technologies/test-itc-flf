import { DEFAULT_QUESTIONS, DEFAULT_TOTAL_QUESTIONS } from './game-config.js';
import { formatNumber } from './game-utils.js';

export class GameQuestionManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.currentQuestionIndex = 1;
    this.totalQuestions = DEFAULT_TOTAL_QUESTIONS;
    this.questions = DEFAULT_QUESTIONS;
  }

  // Update question number display
  updateQuestionNumber() {
    const questionNumberElement = document.querySelector(
      '.timer-header .number',
    );
    if (questionNumberElement) {
      questionNumberElement.textContent = `${formatNumber(
        this.currentQuestionIndex,
      )} of ${formatNumber(this.totalQuestions)}`;
    }
    this.updateNavigationButtons();
  }

  // Update navigation buttons state
  updateNavigationButtons() {
    const previousButton = document.querySelector('.question-previous-button');
    const nextButton = document.querySelector('.question-next-button');

    const isFirstQuestion = this.currentQuestionIndex <= 1;
    const isLastQuestion = this.currentQuestionIndex >= this.totalQuestions;

    if (previousButton) {
      previousButton.disabled = isFirstQuestion;
      previousButton.style.opacity = isFirstQuestion ? '0.5' : '1';
    }

    if (nextButton) {
      nextButton.disabled = isLastQuestion;
      nextButton.style.opacity = isLastQuestion ? '0.5' : '1';
    }
  }

  // Update question content
  updateQuestionContent() {
    const currentQuestion = this.questions[this.currentQuestionIndex - 1];
    if (!currentQuestion) return;

    const titleElement = document.querySelector(
      '.clue-answers-container .title',
    );
    if (titleElement) {
      titleElement.textContent = currentQuestion.title;
    }

    const answerCards = document.querySelectorAll('.clue-answer-card');
    answerCards.forEach((card, index) => {
      const answerElement = card.querySelector('.anwer');
      if (answerElement && currentQuestion.answers[index]) {
        answerElement.textContent = currentQuestion.answers[index];
      }
    });

    document.querySelectorAll('input[name="clue-answer"]').forEach((radio) => {
      radio.checked = false;
    });
  }

  // Reset question index
  resetQuestionIndex() {
    this.currentQuestionIndex = 1;
    this.updateQuestionNumber();
    this.updateQuestionContent();
  }
}
