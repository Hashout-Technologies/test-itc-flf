/* eslint-disable class-methods-use-this */
// /**
//  * Game Section Manager
//  * Handles navigation and visibility of game sections
//  */
import { GAME_SECTIONS } from './game-config.js';

export class GameSectionManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.sections = GAME_SECTIONS;
  }

  // Show a specific section
  showSection(sectionId) {
    this.gameEngine.stopTimer();
    this.hideAllSections();
    this.activateSection(sectionId);
    this.gameEngine.updateCurveImages();
    this.gameEngine.updateButtonText(sectionId);
    this.gameEngine.startTimerForSection();
  }

  // Hide all sections
  hideAllSections() {
    Object.values(this.sections).forEach((id) => {
      const section = document.getElementById(id);
      if (section) {
        section.classList.remove('active');
        section.style.display = 'none';
      }
    });
  }

  // Activate a section
  activateSection(sectionId) {
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
      targetSection.style.display = 'block';
      this.gameEngine.currentSection = sectionId;

      // Update reveal-answer section with clue data
      if (sectionId === 'reveal-answer' && this.gameEngine.selectedClue) {
        if (this.gameEngine.handlers && this.gameEngine.handlers.updateClueDisplay) {
          this.gameEngine.handlers.updateClueDisplay(this.gameEngine.selectedClue);
        }
      }
    }
  }

  // Get current section
  getCurrentSection() {
    return this.gameEngine.currentSection;
  }

  // Update curve images based on current section
  updateCurveImages() {
    const whiteImage = document.querySelector(
      '.background-pattern .curve-img.white',
    );
    const maroonImage = document.querySelector(
      '.background-pattern .curve-img.maroon',
    );

    const showWhite = ['games-selector', 'game-instructions'].includes(
      this.gameEngine.currentSection,
    );

    whiteImage?.classList.toggle('show', showWhite);
    maroonImage?.classList.toggle('show', !showWhite);
  }

  // Update room code display
  updateRoomCodeDisplay(roomCode) {
    const roomCodeElements = document.querySelectorAll('.room-code');
    roomCodeElements.forEach((element) => {
      element.textContent = roomCode;
    });

    // Also update room code in game-room-details section (.code class)
    const codeElement = document.querySelector('#game-room-details .code');
    if (codeElement) {
      codeElement.textContent = roomCode;
    }
  }

  // Update game instructions name
  updateGameInstructions() {
    const gameNameElement = document.getElementById('game-instructions-name');
    if (!gameNameElement) return;

    const gameName = this.gameEngine.gameType === 'category-game'
      ? 'Category Game'
      : 'Who is in the Dark';
    gameNameElement.textContent = gameName;
  }
}
