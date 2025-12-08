/**
 * Game Socket Handler
 * Manages all Socket.io communication for real-time multiplayer
 */

import { SOCKET_CONFIG } from './game-config.js';

export class GameSocketHandler {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.socket = null;
    this.isConnected = false;
  }

  /**
   * Setup socket connection
   */
  setup() {
    // Check if socket.io is available
    if (typeof io === 'undefined') {
      console.warn('Socket.io not loaded. Running in offline mode.');
      return null;
    }

    try {
      // Use existing socket or create new one
      this.socket = window.socket || io(SOCKET_CONFIG.url, SOCKET_CONFIG.options);
      window.socket = this.socket;

      this.setupListeners();
      this.setupConnectionListeners();
      
      return this.socket;
    } catch (error) {
      console.error('Failed to setup socket:', error);
      return null;
    }
  }

  /**
   * Setup connection event listeners
   */
  setupConnectionListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Reconnect manually if server disconnected
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after maximum attempts');
      this.gameEngine.handleErrorMessage('Connection lost. Please refresh the page.');
    });
  }

  /**
   * Setup game event listeners
   */
  setupListeners() {
    if (!this.socket) return;

    // Room created event
    this.socket.on('room_created', (data) => {
      console.log('🎮 Room created:', data);
      this.gameEngine.handleRoomCreated(data);
    });

    // Room update event (players join/leave)
    this.socket.on('room_update', (players) => {
      console.log('👥 Room update:', players);
      this.gameEngine.handleRoomUpdate(players);
    });

    // Error message event
    this.socket.on('error_message', (message) => {
      console.error('❌ Error:', message);
      this.gameEngine.handleErrorMessage(message);
    });

    // Category selected event
    this.socket.on('category_selected', (data) => {
      console.log('📂 Category selected:', data);
      this.gameEngine.handleCategorySelected(data);
    });

    // Clue and dark player selected event
    this.socket.on('clue_and_dark_player_selected', (data) => {
      console.log('🎯 Clue and dark player:', data);
      this.gameEngine.handleClueAndDarkPlayerSelected(data);
    });

    // Navigate section event
    this.socket.on('navigate_section', (data) => {
      console.log('🔀 Navigate to:', data.sectionId);
      this.gameEngine.handleNavigateSection(data);
    });

    // Points update event
    this.socket.on('points_update', (data) => {
      console.log('📊 Points updated:', data);
      this.gameEngine.handlePointsUpdate(data);
    });

    // Votes update event
    this.socket.on('votes_update', (data) => {
      console.log('🗳️ Votes updated:', data);
      this.gameEngine.handleVotesUpdate(data);
    });

    // Answers reset event
    this.socket.on('answers_reset', () => {
      console.log('🔄 Answers reset');
      this.gameEngine.handleAnswersReset();
    });

    // Squad status update (answers submitted)
    this.socket.on('squad_status_update', (players) => {
      console.log('✅ Squad status update:', players);
      this.gameEngine.handleSquadStatusUpdate(players);
    });
  }

  /**
   * Emit create room event
   */
  createRoom(gameType, username) {
    if (!this.isConnected) {
      console.warn('Socket not connected. Cannot create room.');
      return false;
    }

    this.socket.emit('create_room', {
      gameType,
      username
    });

    return true;
  }

  /**
   * Emit join room event
   */
  joinRoom(roomCode, gameType, username) {
    if (!this.isConnected) {
      console.warn('Socket not connected. Cannot join room.');
      return false;
    }

    console.log('📨 Joining room:', { roomCode, gameType, username });

    this.socket.emit('join_room', {
      roomCode,
      gameType,
      username
    });

    return true;
  }

  /**
   * Emit select category event (host only)
   */
  selectCategory(roomCode, category) {
    if (!this.isConnected || !roomCode) {
      console.warn('Cannot select category. Not connected or no room code.');
      return false;
    }

    this.socket.emit('select_category', { roomCode, category });
    return true;
  }

  /**
   * Emit select clue and dark player event (host only)
   */
  selectClueAndDarkPlayer(roomCode, data) {
    if (!this.isConnected || !roomCode) {
      console.warn('Cannot select clue. Not connected or no room code.');
      return false;
    }

    this.socket.emit('select_clue_and_dark_player', { roomCode, ...data });
    return true;
  }

  /**
   * Emit submit answer event
   */
  submitAnswer(roomCode, answer) {
    if (!this.isConnected || !roomCode) {
      console.warn('Cannot submit answer. Not connected or no room code.');
      return false;
    }

    this.socket.emit('submit_answer', { roomCode, answer });
    return true;
  }

  /**
   * Emit submit clue guess event
   */
  submitClueGuess(roomCode, guess) {
    if (!this.isConnected || !roomCode) {
      console.warn('Cannot submit guess. Not connected or no room code.');
      return false;
    }

    this.socket.emit('submit_clue_guess', { roomCode, guess });
    return true;
  }

  /**
   * Emit navigate to section event (host only)
   */
  navigateToSection(roomCode, sectionId) {
    if (!this.isConnected || !roomCode) {
      console.warn('Cannot navigate. Not connected or no room code.');
      return false;
    }

    this.socket.emit('navigate_section', { roomCode, sectionId });
    return true;
  }

  /**
   * Emit reset answers event (host only)
   */
  resetAnswers(roomCode) {
    if (!this.isConnected || !roomCode) {
      console.warn('Cannot reset answers. Not connected or no room code.');
      return false;
    }

    this.socket.emit('reset_answers', { roomCode });
    return true;
  }

  /**
   * Emit vote dark player event
   */
  voteDarkPlayer(roomCode, votedPlayerId) {
    if (!this.isConnected || !roomCode || !votedPlayerId) {
      console.warn('Cannot vote. Missing required data.');
      return false;
    }

    console.log('🗳️ Voting for player:', votedPlayerId);
    this.socket.emit('vote_dark_player', { roomCode, votedPlayerId });
    return true;
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}
