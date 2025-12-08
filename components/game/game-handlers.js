/**
 * Game Event Handlers
 * Handles all user interactions and events
 */
/* eslint-disable */
import { GAME_TYPES, GAME_SECTIONS } from './game-config.js';
import { sanitizeInput } from './game-utils.js';

export class GameHandlers {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
  }

  /**
   * Handle button clicks
   */
  handleButtonClick(button) {
    const classList = button.classList;

    const buttonActions = {
      'game-card__play-button': () => this.handlePlayButton(button),
      'button-create': () => this.gameEngine.roomManager.handleCreateRoom(),
      'button-join': () => this.gameEngine.showSection(GAME_SECTIONS.GAME_ROOM_JOINING),
      'start-button': () => this.gameEngine.showSection(GAME_SECTIONS.GAME_ROOM_DETAILS),
      'join-button': () => this.gameEngine.roomManager.handleJoinRoom(),
      'start-game-button': () => this.gameEngine.showSection(GAME_SECTIONS.CHOOSE_CATEGORY),
      'lets-start-button': () => this.handleLetsStartButton(),
      'ready-button': () => this.handleReadyButton(),
      'dark-ready-button': () => this.handleDarkReadyButton(),
      'next-button': () => this.handleNextButton(),
      'save-next-button': () => this.handleSaveNextButton(),
      'spot-dark-button': () => this.handleSpotDarkButton(),
      'submit-button': () => this.handleSubmitButton(),
      'view-leadboard-button': () => this.gameEngine.showSection(GAME_SECTIONS.LEADERBOARD),
      'play-more-button': () => this.handlePlayMoreButton(),
      'new-game-button': () => this.handleNewGameButton(),
      'question-previous-button': () => this.gameEngine.roomManager.goToPreviousCluePlayer(),
      'question-next-button': () => this.gameEngine.roomManager.goToNextCluePlayer(),
    };

    for (const [className, action] of Object.entries(buttonActions)) {
      if (classList.contains(className)) {
        action();
        break;
      }
    }
  }

  /**
   * Handle play button click on game card
   */
  handlePlayButton(button) {
    const gameCard = button.closest('.game-card');
    const gameTitle = gameCard.querySelector('.game-card__game-title');
    const gameText = gameTitle?.textContent.trim() || '';

    if (gameText.toLowerCase().includes('category')) {
      this.gameEngine.gameType = GAME_TYPES.CATEGORY_GAME;
    } else if (gameText.toLowerCase().includes('dark')) {
      this.gameEngine.gameType = GAME_TYPES.WHO_IS_IN_THE_DARK;
    }

    this.gameEngine.sectionManager.updateGameInstructions();
    this.gameEngine.showSection(GAME_SECTIONS.GAME_INSTRUCTIONS);
  }

  /**
   * Handle category selection
   */
  handleCategorySelection(categoryCard) {
    const allCards = this.gameEngine.block.querySelectorAll('.category-card');
    
    // Deselect all
    allCards.forEach(card => {
      card.classList.remove('selected');
      const img = card.querySelector('.icon img');
      if (img && img.dataset.originalSrc) {
        img.src = img.dataset.originalSrc;
      }
    });

    // Select clicked card
    categoryCard.classList.add('selected');
    
    // Update image if available
    const img = categoryCard.querySelector('.icon img');
    if (img) {
      if (!img.dataset.originalSrc) {
        img.dataset.originalSrc = img.src;
      }
      const selectedSrc = img.dataset.originalSrc.replace(
        /\.(svg|png|jpg|jpeg)$/i,
        '_selected.$1'
      );
      img.src = selectedSrc;
    }

    // Store selection
    const categoryId = categoryCard.dataset.categoryId || categoryCard.dataset.category;
    this.gameEngine.selectedCategory = categoryId;

    // Enable start button
    const letsStartButton = this.gameEngine.block.querySelector('.lets-start-button');
    if (letsStartButton) {
      letsStartButton.disabled = false;
      letsStartButton.style.opacity = '1';
      letsStartButton.style.cursor = 'pointer';
    }
  }

  /**
   * Handle "Let's Start" button
   */
  handleLetsStartButton() {
    if (!this.gameEngine.selectedCategory) {
      console.warn('No category selected');
      return;
    }

    // Emit category selection if connected
    if (this.gameEngine.isHost && this.gameEngine.socketHandler?.isSocketConnected()) {
      this.gameEngine.socketHandler.selectCategory(
        this.gameEngine.roomCode,
        this.gameEngine.selectedCategory
      );
    }

    // Update questions for selected category
    if (this.gameEngine.categoryManager) {
      this.gameEngine.categoryManager.updateQuestionSections(
        this.gameEngine.selectedCategory
      );
    }

    // Navigate based on game type
    if (this.gameEngine.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK) {
      // Host selects clue and dark player
      if (this.gameEngine.isHost) {
        this.selectClueAndDarkPlayer();
      }
      // Non-host players wait for host selection
    } else {
      this.gameEngine.showSection(GAME_SECTIONS.CATEGORY_QUESTION_1);
    }
  }

  /**
   * Select clue and dark player (Who is in the Dark game)
   */
  selectClueAndDarkPlayer() {
    const players = this.gameEngine.players || [];
    if (players.length === 0) return;

    // Select random player to be "in the dark"
    const darkPlayerIndex = Math.floor(Math.random() * players.length);
    const darkPlayer = players[darkPlayerIndex];

    // Select random clue from category
    const clue = this.gameEngine.categoryManager?.selectRandomClue(
      this.gameEngine.selectedCategory
    ) || { clueText: 'CUPCAKE', clueImage: null };

    this.gameEngine.selectedClue = clue;
    this.gameEngine.darkPlayerId = darkPlayer.id;

    // Emit to all players if host and connected
    if (this.gameEngine.socketHandler?.isSocketConnected()) {
      this.gameEngine.socketHandler.selectClueAndDarkPlayer(
        this.gameEngine.roomCode,
        { clue, darkPlayerId: darkPlayer.id }
      );
    } else {
      // Offline: navigate directly
      this.navigateBasedOnDarkStatus(darkPlayer.id);
    }
  }

  /**
   * Navigate based on dark player status
   */
  navigateBasedOnDarkStatus(darkPlayerId) {
    const socket = this.gameEngine.socketHandler?.getSocket();
    const currentPlayerId = socket?.id || 'local';

    if (currentPlayerId === darkPlayerId) {
      this.gameEngine.showSection(GAME_SECTIONS.YOURE_IN_DARK);
    } else {
      this.gameEngine.showSection(GAME_SECTIONS.CLUE_READY);
    }
  }

  /**
   * Handle ready button (clue is ready)
   */
  handleReadyButton() {
    if (this.gameEngine.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK) {
      this.gameEngine.showSection(GAME_SECTIONS.DARK_QUESTION_1);
    } else {
      this.gameEngine.showSection(GAME_SECTIONS.CATEGORY_QUESTION_1);
    }
  }

  /**
   * Handle dark ready button (you're in the dark)
   */
  handleDarkReadyButton() {
    this.gameEngine.showSection(GAME_SECTIONS.DARK_QUESTION_1);
  }

  /**
   * Handle next button (question navigation)
   */
  handleNextButton() {
    this.submitCurrentAnswer();
    const currentSection = this.gameEngine.sectionManager?.getCurrentSection();

    if (currentSection === GAME_SECTIONS.CATEGORY_QUESTION_1) {
      this.gameEngine.showSection(GAME_SECTIONS.CATEGORY_QUESTION_2);
    } else if (currentSection === GAME_SECTIONS.DARK_QUESTION_1) {
      this.gameEngine.showSection(GAME_SECTIONS.DARK_QUESTION_2);
    }
  }

  /**
   * Handle save and next button
   */
  handleSaveNextButton() {
    this.submitCurrentAnswer();
    this.gameEngine.timerManager?.stopTimer();
    this.gameEngine.showSection(GAME_SECTIONS.PLAYER_ANSWERS);
  }

  /**
   * Submit current answer
   */
  submitCurrentAnswer() {
    const answerInput = this.gameEngine.block.querySelector('.game-question.active .answer-input');
    if (!answerInput) return;

    const answer = sanitizeInput(answerInput.value);
    if (!answer) {
      console.warn('No answer provided');
      return;
    }

    // Store answer locally
    this.gameEngine.playerAnswers.push(answer);

    // Submit to backend if connected
    if (this.gameEngine.socketHandler?.isSocketConnected()) {
      this.gameEngine.socketHandler.submitAnswer(
        this.gameEngine.roomCode,
        answer
      );
    }

    // Clear input
    answerInput.value = '';
  }

  /**
   * Handle spot the dark button
   */
  handleSpotDarkButton() {
    if (this.gameEngine.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK) {
      this.gameEngine.showSection(GAME_SECTIONS.WHO_IS_IN_DARK);
    } else {
      this.gameEngine.showSection(GAME_SECTIONS.CLUE_ANSWERS);
    }
  }

  /**
   * Handle submit button (various contexts)
   */
  handleSubmitButton() {
    const currentSection = this.gameEngine.sectionManager?.getCurrentSection();

    if (currentSection === GAME_SECTIONS.WHO_IS_IN_DARK) {
      this.handleVoteSubmit();
    } else if (currentSection === GAME_SECTIONS.CLUE_ANSWERS) {
      this.handleClueGuessSubmit();
    }
  }

  /**
   * Handle vote submission (who is in the dark)
   */
  handleVoteSubmit() {
    const selectedRadio = this.gameEngine.block.querySelector(
      '#who-is-in-the-dark input[type="radio"]:checked'
    );
    
    if (!selectedRadio) {
      console.warn('No player selected');
      return;
    }

    const votedPlayerId = selectedRadio.id.replace('player', '');

    // Submit vote if connected
    if (this.gameEngine.socketHandler?.isSocketConnected()) {
      this.gameEngine.socketHandler.voteDarkPlayer(
        this.gameEngine.roomCode,
        votedPlayerId
      );
    }

    // Navigate to reveal answer
    this.gameEngine.showSection(GAME_SECTIONS.REVEAL_ANSWER);
  }

  /**
   * Handle clue guess submission
   */
  handleClueGuessSubmit() {
    const selectedRadio = this.gameEngine.block.querySelector(
      '#clue-answers input[type="radio"]:checked'
    );
    
    if (!selectedRadio) {
      console.warn('No answer selected');
      return;
    }

    const guess = selectedRadio.closest('.clue-answer-card')
      ?.querySelector('.anwer')?.textContent || '';

    // Submit guess if connected
    if (this.gameEngine.socketHandler?.isSocketConnected()) {
      this.gameEngine.socketHandler.submitClueGuess(
        this.gameEngine.roomCode,
        guess
      );
    }

    // Move to next player's question or finish
    if (this.gameEngine.roomManager.currentCluePlayerIndex < 
        this.gameEngine.roomManager.clueAnswersPlayers.length - 1) {
      this.gameEngine.roomManager.goToNextCluePlayer();
    } else {
      this.gameEngine.showSection(GAME_SECTIONS.WINNER);
    }
  }

  /**
   * Handle play more button
   */
  handlePlayMoreButton() {
    // Reset game state
    this.gameEngine.playerAnswers = [];
    this.gameEngine.selectedCategory = null;
    
    // Navigate back to category selection
    this.gameEngine.showSection(GAME_SECTIONS.CHOOSE_CATEGORY);
  }

  /**
   * Handle new game button
   */
  handleNewGameButton() {
    // Reset all game state
    this.gameEngine.playerAnswers = [];
    this.gameEngine.selectedCategory = null;
    this.gameEngine.roomCode = null;
    this.gameEngine.isHost = false;
    this.gameEngine.gameType = null;

    // Navigate back to game selector
    this.gameEngine.showSection(GAME_SECTIONS.GAMES_SELECTOR);
  }

  /**
   * Handle answer input changes
   */
  handleAnswerInput(input) {
    const value = input.value;
    const maxLength = 30;

    // Update character count
    const charCount = input.closest('.question-input')?.querySelector('.char-count');
    if (charCount) {
      charCount.textContent = `${value.length}/${maxLength} characters`;
    }

    // Enable/disable next button
    const nextButton = input.closest('.question-content')
      ?.querySelector('.next-button, .save-next-button');
    
    if (nextButton) {
      nextButton.disabled = value.trim().length === 0;
      nextButton.style.opacity = value.trim().length > 0 ? '1' : '0.5';
    }
  }

  /**
   * Handle room code input
   */
  handleRoomCodeInput(input) {
    const value = input.value.toUpperCase();
    input.value = value;

    const joinButton = this.gameEngine.block.querySelector('.join-button');
    if (joinButton) {
      joinButton.disabled = value.length !== 6;
      joinButton.style.opacity = value.length === 6 ? '1' : '0.5';
      joinButton.style.cursor = value.length === 6 ? 'pointer' : 'not-allowed';
    }
  }

  /**
   * Handle question timeout
   */
  handleQuestionTimeout() {
    const currentSection = this.gameEngine.sectionManager?.getCurrentSection();

    // Auto-submit empty answer or navigate
    if (currentSection === GAME_SECTIONS.CATEGORY_QUESTION_1 ||
        currentSection === GAME_SECTIONS.DARK_QUESTION_1) {
      this.handleNextButton();
    } else if (currentSection === GAME_SECTIONS.CATEGORY_QUESTION_2 ||
               currentSection === GAME_SECTIONS.DARK_QUESTION_2) {
      this.handleSaveNextButton();
    }
  }
}
