/**
 * Game Engine
 * Main orchestrator that coordinates all game modules
 */
/* eslint-disable */
import { GameSocketHandler } from './game-socket.js';
import { GameSectionManager } from './game-sections.js';
import { GameTimerManager } from './game-timer.js';
import { GamesCarousel } from './game-carousel.js';
import { GameRoomManager } from './game-room.js';
import { GameHandlers } from './game-handlers.js';
import { GameCategoryManager } from './game-categories.js';
import { generateRandomUsername, getStoredUserData, getFirstName } from './game-utils.js';
import { GAME_SECTIONS, GAMES } from './game-config.js';

export class GameEngine {
  constructor(block) {
    this.block = block;
    
    // Game state
    this.games = GAMES;
    this.currentSection = GAME_SECTIONS.GAMES_SELECTOR;
    this.gameType = null;
    this.roomCode = null;
    this.username = null;
    this.fullName = null;
    this.firstName = null;
    this.isHost = false;
    this.selectedCategory = null;
    this.selectedClue = null;
    this.darkPlayerId = null;
    this.players = [];
    this.playerAnswers = [];
    this.clueGuesses = [];
    this.playerPoints = {};

    this.init();
  }

  /**
   * Initialize game engine
   */
  async init() {
    // Setup username
    this.setupUsername();

    // Initialize all managers
    this.socketHandler = new GameSocketHandler(this);
    this.sectionManager = new GameSectionManager(this);
    this.timerManager = new GameTimerManager(this);
    this.roomManager = new GameRoomManager(this);
    this.handlers = new GameHandlers(this);
    this.categoryManager = new GameCategoryManager(this);

    // Setup socket connection (optional - works offline too)
    this.socket = this.socketHandler.setup();

    // Setup event listeners
    this.setupEventListeners();

    // Initialize carousel
    this.initializeCarousel();

    // Show initial section
    this.showSection(GAME_SECTIONS.GAMES_SELECTOR);

    // Update username display
    this.updateUsername();
  }

  /**
   * Setup username from stored data or generate
   */
  setupUsername() {
    const savedUser = getStoredUserData();
    
    if (savedUser && savedUser.name) {
      this.fullName = savedUser.name.trim();
      this.firstName = getFirstName(this.fullName);
      this.username = this.firstName;
    } else {
      this.fullName = generateRandomUsername();
      this.firstName = this.fullName;
      this.username = this.fullName;
    }
  }

  /**
   * Update username display
   */
  updateUsername() {
    const nameElement = this.block.querySelector('.games-selector__name');
    if (nameElement) {
      nameElement.textContent = `${this.firstName},`;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.block.addEventListener('click', (e) => this.handleClick(e));
    this.block.addEventListener('input', (e) => this.handleInput(e));
  }

  /**
   * Handle click events
   */
  handleClick(e) {
    const button = e.target.closest('button');
    if (button) {
      this.handlers.handleButtonClick(button);
    }

    // Handle category card selection
    const categoryCard = e.target.closest('.category-card');
    if (categoryCard) {
      this.handlers.handleCategorySelection(categoryCard);
    }

    // Handle copy icon
    if (e.target.closest('.copy-icon')) {
      this.roomManager.copyRoomCode();
    }

    // Handle share button
    if (e.target.closest('.share-button')) {
      this.roomManager.shareRoomCode();
    }
  }

  /**
   * Handle input events
   */
  handleInput(e) {
    if (e.target.classList.contains('room-code-input')) {
      this.handlers.handleRoomCodeInput(e.target);
    }
    
    if (e.target.classList.contains('answer-input')) {
      this.handlers.handleAnswerInput(e.target);
    }
  }

  /**
   * Initialize game carousel
   */
  initializeCarousel() {
    const track = this.block.querySelector('.games-carousel__track');
    const indicators = this.block.querySelectorAll('.games-carousel__indicators .indicator');
    
    if (track && indicators.length > 0) {
      this.carousel = new GamesCarousel(track, indicators);
    }
  }

  /**
   * Show a section
   */
  showSection(sectionId) {
    this.sectionManager.showSection(sectionId);
  }

  /**
   * Get username
   */
  getUsername() {
    return this.username || this.fullName || generateRandomUsername();
  }

  /**
   * Update button text based on section
   */
  updateButtonText(sectionId) {
    // Update button visibility and text based on context
    if (sectionId === GAME_SECTIONS.PLAYER_ANSWERS) {
      const spotDarkButton = this.block.querySelector('.spot-dark-button');
      if (spotDarkButton && this.isHost) {
        spotDarkButton.style.display = 'flex';
      }
    }

    if (sectionId === GAME_SECTIONS.CHOOSE_CATEGORY) {
      this.initializeCategorySelection();
    }

    if (sectionId === GAME_SECTIONS.GAME_ROOM_DETAILS) {
      this.roomManager.updateCategoryButtonVisibility();
    }

    // Update player-related displays
    if ([
      GAME_SECTIONS.CATEGORY_QUESTION_1,
      GAME_SECTIONS.CATEGORY_QUESTION_2,
      GAME_SECTIONS.DARK_QUESTION_1,
      GAME_SECTIONS.DARK_QUESTION_2
    ].includes(sectionId)) {
      if (this.players) {
        this.roomManager.updateSquadStatus(this.players);
      }
    }
  }

  /**
   * Initialize category selection
   */
  async initializeCategorySelection() {
    this.selectedCategory = null;

    // Fetch and render categories
    const categories = await this.categoryManager.fetchCategories();
    if (categories.length > 0) {
      this.categoryManager.renderCategories();
    }

    // Reset category cards
    const allCards = this.block.querySelectorAll('.category-card');
    allCards.forEach(card => card.classList.remove('selected'));

    // Disable start button
    const letsStartButton = this.block.querySelector('.lets-start-button');
    if (letsStartButton) {
      letsStartButton.disabled = true;
      letsStartButton.style.opacity = '0.5';
      letsStartButton.style.cursor = 'not-allowed';
    }
  }

  /**
   * Socket event handlers
   */
  handleRoomCreated(data) {
    this.roomManager.handleRoomCreated(data);
  }

  handleRoomUpdate(players) {
    this.roomManager.handleRoomUpdate(players);
  }

  handleErrorMessage(message) {
    console.error('Game Error:', message);
    // Show error to user (you can enhance this with a toast notification)
    alert(message);
  }

  handleCategorySelected(data) {
    this.selectedCategory = data.category;
    
    if (this.categoryManager) {
      this.categoryManager.updateQuestionSections(data.category);
    }
  }

  handleClueAndDarkPlayerSelected(data) {
    this.selectedClue = data.clue;
    this.darkPlayerId = data.darkPlayerId;

    // Update questions with clue
    if (this.categoryManager && data.clue) {
      this.categoryManager.updateQuestionSections(
        this.selectedCategory,
        data.clue
      );
    }

    // Navigate based on player status
    const socket = this.socketHandler?.getSocket();
    const isDarkPlayer = socket && socket.id === this.darkPlayerId;

    if (isDarkPlayer) {
      this.showSection(GAME_SECTIONS.YOURE_IN_DARK);
    } else {
      this.showSection(GAME_SECTIONS.CLUE_READY);
    }
  }

  handleNavigateSection(data) {
    if (data && data.sectionId) {
      this.timerManager.stopTimer();
      this.showSection(data.sectionId);
    }
  }

  handlePointsUpdate(data) {
    if (!data || !data.points) return;
    
    this.playerPoints = data.points;

    if (this.roomManager && this.players) {
      this.roomManager.updateWinnerSection(this.playerPoints, this.players);
      this.roomManager.updateLeaderboard(this.playerPoints, this.players);
      this.roomManager.updateRevealResults(this.playerPoints, this.players);
    }
  }

  handleVotesUpdate(data) {
    if (!data || !data.players) return;
    
    this.players = data.players;

    if (this.roomManager) {
      this.roomManager.updateRevealResults(this.playerPoints || {}, this.players);
    }
  }

  handleAnswersReset() {
    this.playerAnswers = [];
    this.clueGuesses = [];
    this.roomManager.currentCluePlayerIndex = 0;

    if (this.players) {
      this.players.forEach(player => {
        if (player.answers) {
          player.answers = [];
        }
      });
    }
  }

  handleSquadStatusUpdate(players) {
    this.players = players;
    if (this.roomManager) {
      this.roomManager.updateSquadStatus(players);
    }
  }

  /**
   * Handle question timeout
   */
  handleQuestionTimeout() {
    this.handlers.handleQuestionTimeout();
  }

  /**
   * Get current section
   */
  getCurrentSection() {
    return this.sectionManager?.getCurrentSection() || this.currentSection;
  }
}
