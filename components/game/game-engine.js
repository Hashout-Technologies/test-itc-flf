/* eslint-disable import/no-import-module-exports */
// /**
//  * Game Engine
//  * Main orchestrator that coordinates all game modules
//  */

import { GameSocketHandler } from './game-socket.js';
import { GameSectionManager } from './game-sections.js';
import { GameRoomManager } from './game-room.js';
import { GameTimerManager } from './game-timer.js';
import { GameHandlers } from './game-handlers.js';
import { GameQuestionManager } from './game-questions.js';
import { GameCategoryManager } from './game-categories.js';
import { generateRandomUsername } from './game-utils.js';
import { GAME_TYPES } from './game-config.js';

window.addEventListener('beforeunload', () => {
  const roomCode = localStorage.getItem('activeRoomCode');
  const { socket } = window;

  if (socket && roomCode) {
    socket.emit('leave_room_before_close', { roomCode });
  }

  localStorage.removeItem('activeRoomCode');
});

export class GameEngine {
  constructor() {
    // Game state
    this.currentSection = 'games-selector';
    this.gameType = null;
    this.roomCode = null;
    this.username = null;
    this.isHost = false;
    this.selectedCategory = null;
    this.playerAnswers = []; // Store answers for current session
    this.clueGuesses = []; // Store clue answer guesses
    this.playerPoints = {}; // Store points for each player { playerId: points }
    this.selectedClue = null; // Store selected clue for who-is-in-the-dark
    this.darkPlayerId = null; // Store the player ID who is in the dark

    // Initialize managers
    this.socketHandler = new GameSocketHandler(this);
    this.sectionManager = new GameSectionManager(this);
    this.roomManager = new GameRoomManager(this);
    this.timerManager = new GameTimerManager(this);
    this.handlers = new GameHandlers(this);
    this.questionManager = new GameQuestionManager(this);
    this.categoryManager = new GameCategoryManager(this);

    this.init();
  }

  // Initialize the game engine
  async init() {
    // Prevent refreshed player from rejoining same room
    const socket = this.socketHandler.getSocket && this.socketHandler.getSocket();
    const lastRoom = sessionStorage.getItem('roomCode');
    const inRoom = sessionStorage.getItem('inRoom');

    if (socket && inRoom === 'true' && lastRoom) {
      console.log('User refreshed — leaving old room:', lastRoom);

      socket.emit('leave_room', { roomCode: lastRoom });

      sessionStorage.removeItem('inRoom');
      sessionStorage.removeItem('roomCode');

      this.sectionManager.showSection('games-selector');
      return;
    }
    // Step 1: Check localStorage for user info FIRST (no backend auth)
    /*
    Original server session check (commented out):
    const session = await GameAuth.checkSession();

    if (!session || !session.authenticated) {
      console.warn("No valid session found. Redirecting to login...");
      // Prevent infinite loop: only redirect if not already on login.html
      if (!window.location.pathname.endsWith("login.html")) {
        window.location.href = "login.html";
      }
      return;
    }
    // Load logged-in user info from localStorage
    const savedUser = JSON.parse(localStorage.getItem("userData"));
    */

    const savedUser = JSON.parse(localStorage.getItem('userData'));

    // if (!savedUser || !savedUser.name) {
    //   console.warn('No user found in localStorage. Redirecting to login...');
    //   // Prevent infinite loop: only redirect if not already on login.html
    //   if (!window.location.pathname.endsWith('login.html')) {
    //     window.location.href = 'login.html';
    //   }
    //   return;
    // }

    if (savedUser && savedUser.name) {
      this.fullName = savedUser.name.trim();
      // eslint-disable-next-line prefer-destructuring
      this.firstName = this.fullName.split(' ')[0];
      this.username = this.firstName; // default before lobby
    } else {
      // fallback to random username if user not logged in
      this.fullName = generateRandomUsername();
      this.firstName = this.fullName;
      this.username = this.fullName;
    }
    const nameElement = document.querySelector('.games-selector__name');
    if (nameElement) {
      nameElement.textContent = `${this.firstName},`;
    }

    // Step 3: Setup sockets and UI
    this.setupSocket();
    this.setupEventListeners();
    this.sectionManager.showSection('games-selector');

    // If the page was refreshed inside a room → force redirect home
    if (lastRoom === 'true') {
      console.warn('Page refreshed inside room → redirecting to home...');
      sessionStorage.removeItem('inRoom');
      window.location.href = 'games.html';
    }
  }

  updateLoggedInUserDisplay(user) {
    const nameElement = document.querySelector('.games-selector__name');
    if (nameElement) {
      nameElement.textContent = user.name || user.phone || 'Guest';
    }

    this.username = user.name || user.phone || generateRandomUsername();
  }

  // Setup socket connection
  setupSocket() {
    this.socket = this.socketHandler.setup();
  }

  // Setup event listeners
  setupEventListeners() {
    document.addEventListener('click', (e) => this.handleClick(e));
    document.addEventListener('input', (e) => this.handleInput(e));
  }

  // Handle click events
  handleClick(e) {
    const button = e.target.closest('button');
    if (button) {
      this.handlers.handleButtonClick(button);
    }

    if (e.target.closest('.copy-icon')) {
      this.roomManager.copyRoomCode();
    }

    if (e.target.closest('.share-button')) {
      this.roomManager.shareRoomCode();
    }

    // Handle category card selection
    const categoryCard = e.target.closest('.category-card');
    if (categoryCard) {
      this.handlers.handleCategorySelection(categoryCard);
    }
  }

  handleInput(e) {
    if (e.target.classList.contains('room-code-input')) {
      this.roomManager.handleRoomCodeInput(e);
    }
    if (e.target.classList.contains('answer-input')) {
      this.handlers.handleAnswerInput(e);
    }
  }

  getUsername() {
    // Prefer authenticated user's name (from login)
    if (this.username) return this.username;

    const savedUser = JSON.parse(localStorage.getItem('userData'));
    if (savedUser && savedUser.name) {
      this.username = savedUser.name;
      return this.username;
    }

    // fallback if no user info (guest mode)
    this.username = generateRandomUsername();
    return this.username;
  }

  showSection(sectionId) {
    return this.sectionManager.showSection(sectionId);
  }

  updateCurveImages() {
    return this.sectionManager.updateCurveImages();
  }

  updateRoomCodeDisplay(roomCode) {
    return this.sectionManager.updateRoomCodeDisplay(roomCode);
  }

  updateGameInstructions() {
    return this.sectionManager.updateGameInstructions();
  }

  updatePlayersList(players) {
    return this.roomManager.updatePlayersList(players);
  }

  handleRoomCreated(data) {
    return this.roomManager.handleRoomCreated(data);
  }

  handleRoomUpdate(players) {
    // Store players from backend
    this.players = players;

    // If we are still in the lobby or earlier (before choose-category),
    // only show first names even if host switched to full names
    const currentSection = this.getCurrentSection?.() || '';
    const isLobbyStage = currentSection === 'game-room-details'
      || currentSection === 'games-selector'
      || currentSection === 'game-room-joining';

    if (isLobbyStage) {
      console.log('Lobby stage detected — forcing first-name display');
      this.players = this.players.map((p) => {
        if (p.username && p.username.includes(' ')) {
          // trim to first word only
          return { ...p, username: p.username.split(' ')[0] };
        }
        return p;
      });
    }

    // Update reveal results immediately
    if (this.roomManager) {
      this.roomManager.updateRevealResults(
        this.playerPoints || {},
        this.players,
      );
    }

    // Update normal players list
    return this.roomManager.handleRoomUpdate(this.players);
  }

  handleCategorySelected(data) {
    return this.handlers.handleCategorySelected(data);
  }

  handleErrorMessage(message) {
    return this.handlers.handleErrorMessage(message);
  }

  handleNavigateSection(data) {
    // Handle navigation event from host (navigates all players)
    const socket = this.socketHandler.getSocket();
    const currentPlayerId = socket?.id;
    const me = this.players?.find((p) => p.id === currentPlayerId);

    if (me && me.notQualified) {
      console.log('User is not qualified - ignoring navigation event');
      return;
    }
    if (data && data.sectionId) {
      this.timerManager.stopTimer();
      this.sectionManager.showSection(data.sectionId);
    }
  }

  handlePointsUpdate(data) {
    if (!data || !data.points) return;
    this.playerPoints = data.points;

    if (!this.players || this.players.length === 0) return;

    if (this.roomManager) {
      this.roomManager.updateWinnerSection(this.playerPoints, this.players);
      this.roomManager.updateLeaderboard(this.playerPoints, this.players);
      // this.roomManager.updateRevealResults(this.playerPoints, this.players);
    }
  }

  handleAnswersReset() {
    this.playerAnswers = [];
    this.clueGuesses = [];
    this.roomManager.currentCluePlayerIndex = 0;

    if (this.players && Array.isArray(this.players)) {
      this.players.forEach((player) => {
        player.answers = [];
        player.votes = 0;
        player.notQualified = false;
        delete player.hasVoted;
        delete player.votedFor;
      });
    }

    console.log('Answers reset for new game round');
  }

  handleClueAndDarkPlayerSelected(data) {
    // Handle when clue and dark player are selected (broadcast from backend)
    if (data?.clue && data?.darkPlayerId) {
      this.selectedClue = data.clue;
      this.darkPlayerId = data.darkPlayerId;
      // Update "You're in the Dark" section dynamically
      const darkPlayer = this.players?.find((p) => p.id === data.darkPlayerId);
      if (darkPlayer) {
        console.log(' Dark Player:', darkPlayer.username);

        // Update Reveal Answer section
        const revealText = document.querySelector(
          '#reveal-answer .player-in-the-dark .text',
        );
        if (revealText) {
          revealText.innerHTML = `${darkPlayer.username} was<br />in <span class="yellow">Dark</span>`;
        }
      }
      // Update clue display
      if (this.handlers && this.handlers.updateClueDisplay) {
        this.handlers.updateClueDisplay(data.clue);
      }

      // Update questions for the selected clue
      if (this.selectedCategory && this.categoryManager && data.clue) {
        this.categoryManager.updateQuestionSections(
          this.selectedCategory,
          data.clue,
        );
      }

      // Navigate to appropriate section based on if current player is dark
      const socket = this.socketHandler.getSocket();
      const isDarkPlayer = socket && socket.id === this.darkPlayerId;

      if (isDarkPlayer) {
        this.sectionManager.showSection('youre-in-the-dark');
      } else {
        this.sectionManager.showSection('clue-is-ready');
      }
    }
  }

  startTimerForSection() {
    return this.timerManager.startTimerForSection();
  }

  stopTimer() {
    return this.timerManager.stopTimer();
  }

  updateButtonText(sectionId) {
    if (sectionId === 'player-answers') {
      const spotDarkButton = document.querySelector('.spot-dark-button');
      const buttonContainer = spotDarkButton?.closest('.button');

      if (spotDarkButton) {
        spotDarkButton.textContent = this.gameType === 'category-game'
          ? 'GO TO NEXT'
          : 'SPOT THE DARK ONE';

        // Only show button to host
        if (this.isHost) {
          if (buttonContainer) {
            buttonContainer.style.display = 'flex';
          }
        } else if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }
      }

      // Update player answers when entering this section
      if (this.players) {
        this.roomManager.updatePlayerAnswers(this.players);
      }
    }

    if (sectionId === 'clue-answers') {
      // Reset clue player index when entering this section
      this.roomManager.currentCluePlayerIndex = 0;

      // Update clue answers when entering this section
      if (this.players) {
        this.roomManager.updateClueAnswers(this.players);
      }
    }

    // Ensure questions are updated when entering dark-question sections
    if (sectionId === 'dark-question-1' || sectionId === 'dark-question-2') {
      if (
        this.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK
        && this.selectedCategory
        && this.selectedClue
      ) {
        // Update questions with the selected clue to ensure they're correct
        if (this.categoryManager) {
          this.categoryManager.updateQuestionSections(
            this.selectedCategory,
            this.selectedClue,
          );
        }
      }
    }

    if (sectionId === 'winner') {
      // Update winner section when entering
      if (this.players && this.playerPoints) {
        this.roomManager.updateWinnerSection(this.playerPoints, this.players);
      }
    }

    if (sectionId === 'leaderboard') {
      // Update leaderboard when entering
      if (this.players && this.playerPoints) {
        this.roomManager.updateLeaderboard(this.playerPoints, this.players);
      }
    }

    if (sectionId === 'game-room-joining') {
      setTimeout(() => {
        const joiningSection = document.getElementById('game-room-joining');
        if (joiningSection) {
          const roomCodeInput = joiningSection.querySelector('.room-code-input');
          const joinButton = joiningSection.querySelector('.join-button');
          if (roomCodeInput && joinButton) {
            roomCodeInput.value = '';
            joinButton.disabled = true;
            joinButton.setAttribute('disabled', 'disabled');
            joinButton.style.opacity = '0.5';
            joinButton.style.cursor = 'not-allowed';

            const inputEvent = new Event('input', { bubbles: true });
            roomCodeInput.dispatchEvent(inputEvent);
          }
        }
      }, 100);
    }

    if (sectionId === 'game-room-details') {
      this.roomManager.updateCategoryButtonVisibility();
    }

    // Switch to full name display after lobby and update all player usernames
    if (
      sectionId === 'choose-game-category'
      || sectionId === 'category-question-1'
      || sectionId === 'dark-question-1'
    ) {
      console.log('Switching to full name display:', this.fullName);

      // Update local username reference
      this.username = this.fullName;

      const socket = this.socketHandler.getSocket();

      if (this.players && socket) {
        // Update this player's name across the current room state
        this.players = this.players.map((p) => (p.id === socket.id ? { ...p, username: this.fullName } : p));

        // Re-render all player-based UI lists
        this.roomManager.updatePlayersList(this.players);
        this.roomManager.updatePlayerAnswers(this.players);
        this.roomManager.updateLeaderboard(
          this.playerPoints || {},
          this.players,
        );
        this.roomManager.updateRevealResults(
          this.playerPoints || {},
          this.players,
        );
      }
    }

    if (sectionId === 'choose-game-category') {
      this.initializeCategorySelection();
    }

    // Update squad status when entering question sections
    const questionSections = ['category-question-1', 'category-question-2'];
    if (questionSections.includes(sectionId) && this.players) {
      this.roomManager.updateSquadStatus(this.players);
    }
  }

  async initializeCategorySelection() {
    this.selectedCategory = null;

    // Fetch and render categories (if fetch fails, keep hardcoded HTML categories)
    const categories = await this.categoryManager.fetchCategories();
    if (categories.length > 0) {
      this.categoryManager.renderCategories();
    }

    const allCategoryCards = document.querySelectorAll('.category-card');
    allCategoryCards.forEach((card) => {
      card.classList.remove('selected');

      const img = card.querySelector('.icon img');
      if (img) {
        const originalSrc = img.dataset.originalSrc || img.src;
        img.src = originalSrc;
        if (!img.dataset.originalSrc) {
          img.dataset.originalSrc = originalSrc;
        }
      }
    });

    const letsStartButton = document.querySelector('.lets-start-button');
    if (letsStartButton && !this.isHost) {
      letsStartButton.remove();
      const nonHostCategoryWaitingMessage = document.querySelector(
        '.non-host-waiting-msg',
      );
      nonHostCategoryWaitingMessage.style.display = 'block';
    } else if (letsStartButton && this.isHost) {
      letsStartButton.disabled = true;
      letsStartButton.setAttribute('disabled', 'disabled');
      letsStartButton.style.opacity = '0.5';
      letsStartButton.style.cursor = 'not-allowed';
    }
  }

  getCurrentSection() {
    return this.sectionManager?.getCurrentSection?.() || this.currentSection;
  }

  showNotQualifiedPopup() {
    const popup = document.getElementById('not-qualified-popup');
    if (!popup) return;

    const messageElement = popup.querySelector('.popup-message');
    if (messageElement) {
      const username = this.getUsername();
      const trimmedName = (username || '').trim();
      if (trimmedName.length > 0) {
        messageElement.innerHTML = `<span class="highlighted-name">${trimmedName}</span>, Since you missed submitting your answer, you’re out for this round.`;
      } else {
        messageElement.textContent = `${trimmedName}, Since you missed submitting your answer, you’re out for this round.`;
      }
    }

    popup.classList.remove('hidden');

    const button = popup.querySelector('.popup-button');
    if (button) {
      button.onclick = () => {
        popup.classList.add('hidden');
        this.sectionManager.showSection('game-room-details');
      };
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
