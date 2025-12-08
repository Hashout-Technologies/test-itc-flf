/**
 * Game Section Manager
 * Handles navigation and visibility of game sections
 */
/* eslint-disable */
import { GAME_SECTIONS } from './game-config.js';

export class GameSectionManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.sections = GAME_SECTIONS;
    this.currentSection = GAME_SECTIONS.GAMES_SELECTOR;
  }

  /**
   * Show a specific section
   */
  showSection(sectionId) {
    // Stop any running timers
    if (this.gameEngine.timerManager) {
      this.gameEngine.timerManager.stopTimer();
    }

    // Hide all sections
    this.hideAllSections();

    // Show target section
    this.activateSection(sectionId);

    // Update UI elements
    this.updateCurveImages();

    // Trigger section-specific updates
    if (this.gameEngine.updateButtonText) {
      this.gameEngine.updateButtonText(sectionId);
    }

    // Start timer if needed
    if (this.gameEngine.timerManager) {
      this.gameEngine.timerManager.startTimerForSection();
    }
  }

  /**
   * Hide all sections
   */
  hideAllSections() {
    Object.values(this.sections).forEach((id) => {
      const section = this.gameEngine.block.querySelector(`#${id}`);
      if (section) {
        section.classList.remove('active');
        section.style.display = 'none';
      }
    });
  }

  /**
   * Activate a specific section
   */
  activateSection(sectionId) {
    const targetSection = this.gameEngine.block.querySelector(`#${sectionId}`);
    if (targetSection) {
      targetSection.classList.add('active');
      targetSection.style.display = 'block';
      this.currentSection = sectionId;

      // Update main background color
      const main = this.gameEngine.block.closest('main');
      if (main) {
        const isWhiteBg = [
          GAME_SECTIONS.GAMES_SELECTOR,
          GAME_SECTIONS.GAME_INSTRUCTIONS
        ].includes(sectionId);
        main.style.backgroundColor = isWhiteBg ? 'white' : '#bb1f3b';
      }
    }
  }

  /**
   * Get current section ID
   */
  getCurrentSection() {
    return this.currentSection;
  }

  /**
   * Update curve images based on current section
   */
  updateCurveImages() {
    const whiteImage = this.gameEngine.block.querySelector(
      '.background-pattern .curve-img.white'
    );
    const maroonImage = this.gameEngine.block.querySelector(
      '.background-pattern .curve-img.maroon'
    );

    const showWhite = [
      GAME_SECTIONS.GAMES_SELECTOR,
      GAME_SECTIONS.GAME_INSTRUCTIONS
    ].includes(this.currentSection);

    if (whiteImage) whiteImage.classList.toggle('show', showWhite);
    if (maroonImage) maroonImage.classList.toggle('show', !showWhite);
  }

  /**
   * Update room code display
   */
  updateRoomCodeDisplay(roomCode) {
    const roomCodeElements = this.gameEngine.block.querySelectorAll('.room-code, .code');
    roomCodeElements.forEach((element) => {
      element.textContent = roomCode;
    });
  }

  /**
   * Update game instructions name
   */
  updateGameInstructions() {
    const gameNameElement = this.gameEngine.block.querySelector('#game-instructions-name');
    if (!gameNameElement) return;

    const gameName = this.gameEngine.gameType === 'category-game'
      ? 'Category Game'
      : 'Who is in the Dark';
    
    gameNameElement.textContent = gameName;
  }
}
