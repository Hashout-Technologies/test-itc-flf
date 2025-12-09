/* eslint-disable consistent-return */
/**
 * Game Socket Handler
 * Manages all Socket.io communication for real-time multiplayer
 */
export class GameSocketHandler {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.socket = window.socket;
  }

  setup() {
    this.socket = window.socket;

    if (!this.socket) {
      console.error(
        'Socket not found. Make sure socket.io is initialized before game-engine.js',
      );
      return;
    }

    this.setupListeners();
    return this.socket;
  }

  setupListeners() {
    this.socket.on('room_created', (data) => {
      this.gameEngine.handleRoomCreated(data);
    });

    // Listen for room_update event (when someone joins/leaves)
    this.socket.on('room_update', (players) => {
      console.log('room_update', players);
      this.gameEngine.handleRoomUpdate(players);
    });

    // Listen for error_message event
    this.socket.on('error_message', (message) => {
      this.gameEngine.handleErrorMessage(message);
    });

    // Listen for category_selected event (when host selects category)
    this.socket.on('category_selected', (data) => {
      this.gameEngine.handleCategorySelected(data);
    });

    // Listen for clue_and_dark_player_selected event (when host selects clue and dark player)
    this.socket.on('clue_and_dark_player_selected', (data) => {
      this.gameEngine.handleClueAndDarkPlayerSelected(data);
    });

    // Listen for navigate_section event (when host navigates to next section)
    this.socket.on('navigate_section', (data) => {
      this.gameEngine.handleNavigateSection(data);
    });

    // Listen for points_update event (when points are calculated)
    this.socket.on('points_update', (data) => {
      this.gameEngine.handlePointsUpdate(data);
    });

    // Listen for votes_update event (when someone votes in "Who is in the Dark")
    this.socket.on('votes_update', (data) => {
      console.log('Votes updated:', data.players);

      // Update reveal results with latest vote data
      this.gameEngine.roomManager.updateRevealResults(
        this.gameEngine.playerPoints || {},
        data.players,
      );
    });

    // Listen for answers_reset event (when answers are reset for new round)
    this.socket.on('answers_reset', () => {
      this.gameEngine.handleAnswersReset();
    });

    this.socket.on('host_transferred', (data) => {
      console.log('Host transferred:', data);

      if (data.newHostId === this.socket.id) {
        this.gameEngine.isHost = true;
        console.log('You are now the host!');
      } else {
        this.gameEngine.isHost = false;
      }

      // Update player list UI immediately
      if (this.gameEngine.players) {
        this.gameEngine.players = this.gameEngine.players.map((p) => ({
          ...p,
          isHost: p.id === data.newHostId,
        }));
        this.gameEngine.roomManager.updatePlayersList(this.gameEngine.players);
      }
    });

    this.socket.on('room_closed', () => {
      console.log('Room closed by host');

      sessionStorage.removeItem('inRoom');
      this.gameEngine.roomCode = null;
      this.gameEngine.isHost = false;

      // Show popup
      const popup = document.querySelector('#room-closed-popup');
      if (popup) popup.classList.remove('hidden');

      // OK button → redirect to home
      const okBtn = document.querySelector('#popup-ok-button');
      if (okBtn) {
        okBtn.onclick = () => {
          popup.classList.add('hidden');
          this.gameEngine.sectionManager.showSection('games-selector');
        };
      }
    });
  }

  // Emit create room event
  createRoom(gameType, username) {
    if (!this.socket) {
      console.log('Socket connection not available');
      return false;
    }
    this.socket.emit('create_room', {
      gameType,
      username: this.gameEngine.fullName,
    });

    return true;
  }

  // Emit join room event
  joinRoom(roomCode, gameType, username) {
    if (!this.socket) {
      console.log('Socket connection not available');
      return false;
    }

    console.log('Joining existing room:', {
      roomCode,
      gameType,
      username: this.gameEngine.fullName,
    });

    this.socket.emit('join_room', {
      roomCode,
      gameType,
      username: this.gameEngine.fullName,
    });

    return true;
  }

  // Emit select category event
  selectCategory(roomCode, category) {
    if (!this.socket || !roomCode) {
      return false;
    }
    this.socket.emit('select_category', { roomCode, category });
    return true;
  }

  // Emit clue and dark player selection event (host only)
  selectClueAndDarkPlayer(roomCode, data) {
    if (!this.socket || !roomCode) {
      console.log('Socket connection or room code not available');
      return false;
    }
    this.socket.emit('select_clue_and_dark_player', { roomCode, ...data });
    return true;
  }

  // Emit submit answer event
  submitAnswer(roomCode, answer) {
    if (!this.socket || !roomCode) {
      console.log('Socket connection or room code not available');
      return false;
    }
    this.socket.emit('submit_answer', { roomCode, answer });
    return true;
  }

  // Emit submit clue guess event
  submitClueGuess(roomCode, guess) {
    if (!this.socket || !roomCode) {
      console.log('Socket connection or room code not available');
      return false;
    }
    this.socket.emit('submit_clue_guess', { roomCode, guess });
    return true;
  }

  // Emit navigate to section event (host only - navigates all players)
  navigateToSection(roomCode, sectionId) {
    if (!this.socket || !roomCode) {
      console.log('Socket connection or room code not available');
      return false;
    }
    this.socket.emit('navigate_section', { roomCode, sectionId });
    return true;
  }

  // Emit reset answers event (host only - resets answers for all players)
  resetAnswers(roomCode) {
    if (!this.socket || !roomCode) {
      console.log('Socket connection or room code not available');
      return false;
    }
    this.socket.emit('reset_answers', { roomCode });
    return true;
  }

  // Emit vote_dark_player event
  voteDarkPlayer(roomCode, votedPlayerId) {
    if (!this.socket || !roomCode || !votedPlayerId) {
      console.warn('Missing socket, roomCode, or votedPlayerId');
      return false;
    }
    console.log('Emitting vote_dark_player:', { roomCode, votedPlayerId });
    this.socket.emit('vote_dark_player', { roomCode, votedPlayerId });
    return true;
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.socket;
  }
}
