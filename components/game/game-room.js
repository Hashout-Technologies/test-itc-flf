/**
 * Game Room Manager
 * Handles room creation, joining, and player management
 */

import { copyToClipboard, shareOnWhatsApp } from './game-utils.js';

export class GameRoomManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.clueAnswersPlayers = [];
    this.currentCluePlayerIndex = 0;
  }

  /**
   * Handle room creation
   */
  handleCreateRoom() {
    const socket = this.gameEngine.socketHandler?.getSocket();
    if (!socket) {
      console.warn('Socket not available - using offline mode');
      // Offline mode: generate room code locally
      const { generateRoomCode } = require('./game-utils.js');
      const roomCode = generateRoomCode();
      this.handleRoomCreated({
        roomCode,
        players: [{ id: 'local', username: this.gameEngine.username }]
      });
      return;
    }

    const username = this.gameEngine.getUsername();
    if (!username) {
      console.error('Username not found');
      return;
    }

    // Emit create_room event
    this.gameEngine.socketHandler.createRoom(
      this.gameEngine.gameType,
      username
    );
  }

  /**
   * Handle room created response
   */
  handleRoomCreated(data) {
    const { roomCode, players } = data;
    this.gameEngine.roomCode = roomCode;
    this.gameEngine.isHost = true;

    this.gameEngine.sectionManager.updateRoomCodeDisplay(roomCode);
    this.updatePlayersList(players);
    this.gameEngine.showSection('game-room-creation');
  }

  /**
   * Handle room joining
   */
  handleJoinRoom() {
    const socket = this.gameEngine.socketHandler?.getSocket();
    const roomCodeInput = this.gameEngine.block.querySelector('.room-code-input');
    
    if (!roomCodeInput) {
      console.error('Room code input not found');
      return;
    }

    const roomCode = roomCodeInput.value.trim().toUpperCase();
    const errorMessage = this.gameEngine.block.querySelector(
      '#game-room-joining .error-message'
    );

    // Validate room code
    if (roomCode.length !== 6) {
      if (errorMessage) {
        errorMessage.textContent = 'Room code must be 6 characters';
        errorMessage.style.display = 'block';
      }
      roomCodeInput.style.borderColor = '#bb1f3b';
      return;
    }

    // Hide error message
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }
    roomCodeInput.style.borderColor = '#b8b8b8';

    const username = this.gameEngine.getUsername();
    if (!username) {
      console.error('Failed to generate username');
      return;
    }

    // Disable button while joining
    const joinButton = this.gameEngine.block.querySelector('.join-button');
    if (joinButton) {
      joinButton.disabled = true;
      joinButton.style.opacity = '0.5';
      joinButton.style.cursor = 'not-allowed';
    }

    if (!socket) {
      console.warn('Socket not available - using offline mode');
      // Offline mode: just navigate to room details
      this.gameEngine.roomCode = roomCode;
      this.gameEngine.showSection('game-room-details');
      return;
    }

    // Emit join_room event
    this.gameEngine.socketHandler.joinRoom(
      roomCode,
      this.gameEngine.gameType,
      username
    );
  }

  /**
   * Handle room update (players joined/left)
   */
  handleRoomUpdate(players) {
    this.gameEngine.players = players;

    // Update players list in all relevant sections
    this.updatePlayersList(players);
    this.updateSquadStatus(players);

    // Navigate to room details if not already there
    const currentSection = this.gameEngine.sectionManager?.getCurrentSection();
    if (currentSection === 'game-room-joining') {
      this.gameEngine.showSection('game-room-details');
    }
  }

  /**
   * Update players list in lobby
   */
  updatePlayersList(players) {
    const playersCards = this.gameEngine.block.querySelector('.players-cards');
    if (!playersCards || !players) return;

    playersCards.innerHTML = players.map(player => `
      <div class="player-card">
        <div class="avatar">
          <img src="${player.avatar || '/icons/image.png'}" 
               alt="${player.username}" />
        </div>
        <div class="player-name">${player.username}</div>
      </div>
    `).join('');
  }

  /**
   * Update squad status (answer submission tracking)
   */
  updateSquadStatus(players) {
    const squadContainer = this.gameEngine.block.querySelector('.suquad-container');
    if (!squadContainer || !players) return;

    squadContainer.innerHTML = players.map(player => `
      <div class="suquad-card">
        <div class="user-info">
          <div class="suquad-card-icon">
            <img src="${player.avatar || '/icons/image.png'}" 
                 alt="${player.username}" />
          </div>
          <div class="suquad-card-name">${player.username}</div>
        </div>
        <div class="suquad-card-status">
          ${player.hasSubmitted ? 'Submitted' : 'Not Yet'}
        </div>
      </div>
    `).join('');
  }

  /**
   * Update player answers display
   */
  updatePlayerAnswers(players) {
    const answersContainer = this.gameEngine.block.querySelector('.answers-container');
    if (!answersContainer || !players) return;

    answersContainer.innerHTML = players.map(player => {
      const answer = player.answers?.[player.answers.length - 1] || 'No answer';
      return `
        <div class="answer-card">
          <div class="player-info">
            <div class="avatar">
              <img src="${player.avatar || '/icons/image.png'}" 
                   alt="${player.username}" />
            </div>
            <div class="player-name">${player.username}</div>
          </div>
          <div class="player-answer">${answer}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Update clue answers for category game
   */
  updateClueAnswers(players) {
    // Get players who have submitted answers to question 1
    this.clueAnswersPlayers = players.filter(p => 
      p.answers && p.answers.length > 0
    );

    if (this.clueAnswersPlayers.length === 0) return;

    // Show first player's question
    this.currentCluePlayerIndex = 0;
    this.showCluePlayerQuestion(this.currentCluePlayerIndex);
  }

  /**
   * Show clue question for specific player
   */
  showCluePlayerQuestion(index) {
    if (index < 0 || index >= this.clueAnswersPlayers.length) return;

    const player = this.clueAnswersPlayers[index];
    const container = this.gameEngine.block.querySelector('.clue-answers-container');
    
    if (!container) return;

    // Update title
    const title = container.querySelector('.title');
    if (title) {
      title.textContent = `What is ${player.username}'s answer?`;
    }

    // Update answer options (mock data for now)
    const answersFormat = this.gameEngine.categoryManager?.getAnswersFormat(
      this.gameEngine.selectedCategory,
      this.gameEngine.selectedClue
    );

    if (answersFormat && Array.isArray(answersFormat)) {
      this.renderClueAnswerOptions(answersFormat);
    }

    // Update navigation buttons
    this.updateClueNavigationButtons();
  }

  /**
   * Render clue answer options
   */
  renderClueAnswerOptions(options) {
    const container = this.gameEngine.block.querySelector('.clue-answers-container');
    if (!container) return;

    // Find where to insert options
    const titleElement = container.querySelector('.title');
    const buttonElement = container.querySelector('.button');

    // Remove existing option cards
    const existingCards = container.querySelectorAll('.clue-answer-card');
    existingCards.forEach(card => card.remove());

    // Insert new options
    options.forEach((option, index) => {
      const card = document.createElement('div');
      card.className = 'clue-answer-card';
      card.innerHTML = `
        <div class="anwer">${option}</div>
        <div class="radio-button">
          <input type="radio" name="clue-answer" id="clue-answer-${index}" />
        </div>
      `;
      
      if (buttonElement) {
        container.insertBefore(card, buttonElement);
      } else {
        container.appendChild(card);
      }
    });
  }

  /**
   * Update clue navigation buttons state
   */
  updateClueNavigationButtons() {
    const prevButton = this.gameEngine.block.querySelector('.question-previous-button');
    const nextButton = this.gameEngine.block.querySelector('.question-next-button');

    if (prevButton) {
      prevButton.disabled = this.currentCluePlayerIndex === 0;
      prevButton.style.opacity = this.currentCluePlayerIndex === 0 ? '0.3' : '1';
    }

    if (nextButton) {
      nextButton.disabled = this.currentCluePlayerIndex >= this.clueAnswersPlayers.length - 1;
      nextButton.style.opacity = 
        this.currentCluePlayerIndex >= this.clueAnswersPlayers.length - 1 ? '0.3' : '1';
    }
  }

  /**
   * Go to next clue player
   */
  goToNextCluePlayer() {
    if (this.currentCluePlayerIndex < this.clueAnswersPlayers.length - 1) {
      this.currentCluePlayerIndex++;
      this.showCluePlayerQuestion(this.currentCluePlayerIndex);
    }
  }

  /**
   * Go to previous clue player
   */
  goToPreviousCluePlayer() {
    if (this.currentCluePlayerIndex > 0) {
      this.currentCluePlayerIndex--;
      this.showCluePlayerQuestion(this.currentCluePlayerIndex);
    }
  }

  /**
   * Update reveal results section
   */
  updateRevealResults(points, players) {
    const resultsTable = this.gameEngine.block.querySelector('#reveal-answer .results-table');
    if (!resultsTable || !players) return;

    // Sort players by votes (descending)
    const sortedPlayers = [...players].sort((a, b) => 
      (b.votes || 0) - (a.votes || 0)
    );

    const resultsHTML = sortedPlayers.map((player, index) => `
      <div class="result-item ${index === 0 ? 'active' : ''}">
        <div class="cell">${player.username}</div>
        <div class="cell">${player.votes || 0}</div>
      </div>
    `).join('');

    resultsTable.innerHTML = `
      <div class="result-header">
        <div class="cell">Name</div>
        <div class="cell">Votes</div>
      </div>
      ${resultsHTML}
    `;
  }

  /**
   * Update winner section
   */
  updateWinnerSection(points, players) {
    const resultsTable = this.gameEngine.block.querySelector('#winner .results-table');
    if (!resultsTable || !players) return;

    // Sort players by points (descending)
    const sortedPlayers = [...players].sort((a, b) => 
      (points[b.id] || 0) - (points[a.id] || 0)
    );

    const resultsHTML = sortedPlayers.map((player, index) => `
      <div class="result-item ${index === 0 ? 'active' : ''}">
        <div class="cell">${player.username}</div>
        <div class="cell">${points[player.id] || 0}</div>
      </div>
    `).join('');

    resultsTable.innerHTML = `
      <div class="result-header">
        <div class="cell">Name</div>
        <div class="cell">Points</div>
      </div>
      ${resultsHTML}
    `;
  }

  /**
   * Update leaderboard
   */
  updateLeaderboard(points, players) {
    const rankingsTable = this.gameEngine.block.querySelector('.rankings-table');
    if (!rankingsTable || !players) return;

    // Sort players by points (descending)
    const sortedPlayers = [...players].sort((a, b) => 
      (points[b.id] || 0) - (points[a.id] || 0)
    );

    const socket = this.gameEngine.socketHandler?.getSocket();
    const currentPlayerId = socket?.id || 'local';

    const rankingsHTML = sortedPlayers.map((player, index) => `
      <div class="rankings-item ${player.id === currentPlayerId ? 'active' : ''}">
        <div class="cell">${String(index + 1).padStart(2, '0')}</div>
        <div class="cell user-info">
          <div class="avatar">
            <img src="${player.avatar || '/icons/image.png'}" 
                 alt="${player.username}" />
          </div>
          <div class="name">${player.username}</div>
        </div>
        <div class="cell">${points[player.id] || 0}</div>
      </div>
    `).join('');

    rankingsTable.innerHTML = `
      <div class="rankings-header">
        <div class="cell">Rank</div>
        <div class="cell">Name</div>
        <div class="cell">Points</div>
      </div>
      ${rankingsHTML}
    `;
  }

  /**
   * Update category button visibility
   */
  updateCategoryButtonVisibility() {
    const startGameButton = this.gameEngine.block.querySelector('.start-game-button');
    if (!startGameButton) return;

    // Only host can start the game
    if (this.gameEngine.isHost) {
      startGameButton.style.display = 'flex';
    } else {
      startGameButton.style.display = 'none';
    }
  }

  /**
   * Copy room code to clipboard
   */
  async copyRoomCode() {
    if (!this.gameEngine.roomCode) return;

    const success = await copyToClipboard(this.gameEngine.roomCode);
    
    if (success) {
      // Show visual feedback
      const copyIcon = this.gameEngine.block.querySelector('.copy-icon');
      if (copyIcon) {
        copyIcon.classList.add('copied');
        setTimeout(() => copyIcon.classList.remove('copied'), 600);
      }
    }
  }

  /**
   * Share room code on WhatsApp
   */
  shareRoomCode() {
    if (!this.gameEngine.roomCode) return;
    shareOnWhatsApp(this.gameEngine.roomCode);
  }
}
