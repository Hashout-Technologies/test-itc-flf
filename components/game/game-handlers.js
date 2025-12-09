/* eslint-disable no-restricted-syntax */
// /**
//  * Game Event Handlers
//  * Handles all user interactions and events
//  */
// /* eslint-disable */
import { GAME_TYPES } from './game-config.js';

export class GameHandlers {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
  }

  // Handle button clicks
  handleButtonClick(button) {
    const { classList } = button;

    const buttonActions = {
      'create-room-btn': () => this.gameEngine.roomManager.handleCreateRoom(),
      'join-room-btn': () => this.gameEngine.sectionManager.showSection('game-room-joining'),
      'start-button': () => this.gameEngine.sectionManager.showSection('game-room-details'),
      'join-button': () => this.gameEngine.roomManager.handleJoinRoom(),
      'start-game-button': () => this.handleStartGameButton(),
      'lets-start-button': () => this.handleLetsStartButton(),
      'ready-button': () => this.handleReadyButton(),
      'dark-ready-button': () => this.handleDarkReadyButton(),
      'next-button': () => this.handleNextButton(),
      'save-next-button': () => {
        // Submit answer for current question before moving to player answers
        this.submitCurrentAnswer();
        this.gameEngine.timerManager.stopTimer();
        this.gameEngine.sectionManager.showSection('player-answers');
      },
      'spot-dark-button': () => this.handleSpotDarkButton(),
      'submit-button': () => this.handleSubmitButton(),
      'view-leadboard-button': () => this.gameEngine.sectionManager.showSection('leaderboard'),
      'play-more-button': () => this.handlePlayMoreButton(),
      'new-game-button': () => this.handleNewGameButton(),
      'question-previous-button': () => {
        this.gameEngine.roomManager.goToPreviousCluePlayer();
      },
      'question-next-button': () => {
        this.gameEngine.roomManager.goToNextCluePlayer();
      },
    };

    for (const [className, action] of Object.entries(buttonActions)) {
      if (classList.contains(className)) {
        action();
        break;
      }
    }
  }

  handleStartGameButton() {
    const players = this.gameEngine.players || [];
    const minPlayers = 3;

    const button = document.querySelector('#game-room-details .button');
    let requiredPlayersErrorMsg = document.querySelector('#game-room-details .min-players');

    const showError = (message) => {
      if (!button) return;

      if (!requiredPlayersErrorMsg) {
        requiredPlayersErrorMsg = document.createElement('div');
        requiredPlayersErrorMsg.className = 'min-players';
        requiredPlayersErrorMsg.style.cssText = 'text-align:center;color:black;font-size:0.9rem;margin-bottom:0.75rem;';
        button.parentNode.insertBefore(requiredPlayersErrorMsg, button);
      }

      requiredPlayersErrorMsg.textContent = message;
      requiredPlayersErrorMsg.style.display = 'block';
    };

    const hideError = () => {
      if (requiredPlayersErrorMsg) {
        requiredPlayersErrorMsg.style.display = 'none';
      }
    };

    if (players.length < minPlayers) {
      showError('You need at least 3 players to start the game.');
      return;
    }

    hideError();
    const socket = this.gameEngine.socketHandler.getSocket();
    const { roomCode } = this.gameEngine;

    if (!socket || !roomCode) return;

    // Host asks backend → backend will block if less than 3 players
    socket.emit('navigate_section', {
      roomCode,
      sectionId: 'choose-game-category',
    });

    console.log('Requesting backend to navigate to category selection...');
  }

  // Handle play button click
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
    this.gameEngine.sectionManager.showSection('game-instructions');
  }

  // Handle category selection
  handleCategorySelection(categoryCard) {
    const allCategoryCards = document.querySelectorAll('.category-card');
    allCategoryCards.forEach((card) => {
      card.classList.remove('selected');

      // Reset image to original
      const img = card.querySelector('.icon img');
      if (img) {
        const originalSrc = img.dataset.originalSrc || img.src;
        img.src = originalSrc;
        if (!img.dataset.originalSrc) {
          img.dataset.originalSrc = originalSrc;
        }
      }
    });
    categoryCard.classList.add('selected');

    const img = categoryCard.querySelector('.icon img');
    if (img) {
      if (!img.dataset.originalSrc) {
        img.dataset.originalSrc = img.src;
      }
      const { originalSrc } = img.dataset;
      const selectedSrc = originalSrc.replace(
        /\.(svg|png|jpg|jpeg)$/i,
        '_selected.$1',
      );
      img.src = selectedSrc;
    }

    const { categoryId } = categoryCard.dataset;
    this.gameEngine.selectedCategory = categoryId;

    const letsStartButton = document.querySelector('.lets-start-button');
    if (letsStartButton) {
      letsStartButton.disabled = false;
      letsStartButton.style.opacity = '1';
      letsStartButton.style.cursor = 'pointer';
      letsStartButton.removeAttribute('disabled');
    }
  }

  // Handle let's start button
  handleLetsStartButton() {
    if (!this.gameEngine.selectedCategory) {
      return;
    }

    this.gameEngine.categoryManager.updateQuestionSections(
      this.gameEngine.selectedCategory,
    );

    // If host, emit category selection to sync all players
    if (this.gameEngine.isHost) {
      if (this.gameEngine.socketHandler.getSocket() && this.gameEngine.roomCode) {
        this.gameEngine.socketHandler.selectCategory(
          this.gameEngine.roomCode,
          this.gameEngine.selectedCategory,
        );
      }
    }
  }

  // Handle category selected event
  async handleCategorySelected(data) {
    // Get categoryId from data
    const categoryId = data?.category;

    if (categoryId) {
      this.gameEngine.selectedCategory = categoryId;

      // Ensure categories are loaded before updating questions
      if (this.gameEngine.categoryManager.categories.length === 0
          && this.gameEngine.categoryManager.darkCategories.length === 0) {
        await this.gameEngine.categoryManager.fetchCategories();
      }

      // For who-is-in-the-dark, wait for clue selection (questions will be updated with clue)
      if (this.gameEngine.gameType !== GAME_TYPES.WHO_IS_IN_THE_DARK) {
        // Update question sections with selected category questions
        this.gameEngine.categoryManager.updateQuestionSections(categoryId);
      }
    } else if (this.gameEngine.selectedCategory) {
      // Fallback to stored selectedCategory
      // Ensure categories are loaded
      if (this.gameEngine.categoryManager.categories.length === 0
          && this.gameEngine.categoryManager.darkCategories.length === 0) {
        await this.gameEngine.categoryManager.fetchCategories();
      }

      // For who-is-in-the-dark, wait for clue selection
      if (this.gameEngine.gameType !== GAME_TYPES.WHO_IS_IN_THE_DARK) {
        this.gameEngine.categoryManager.updateQuestionSections(
          this.gameEngine.selectedCategory,
        );
      }
    }

    if (this.gameEngine.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK) {
      // Handle who-is-in-the-dark game
      if (this.gameEngine.isHost) {
        // Host: randomly select clue and dark player
        const selectedClue = this.gameEngine.categoryManager.selectRandomClue(categoryId);
        const darkPlayer = this.selectRandomDarkPlayer();

        if (selectedClue && darkPlayer) {
          this.gameEngine.selectedClue = selectedClue;
          this.gameEngine.darkPlayerId = darkPlayer.id;

          // Update questions for the selected clue
          this.gameEngine.categoryManager.updateQuestionSections(categoryId, selectedClue);

          // Update clue display
          this.updateClueDisplay(selectedClue);

          // Emit clue and dark player selection to backend
          if (this.gameEngine.roomCode) {
            this.gameEngine.socketHandler.selectClueAndDarkPlayer(
              this.gameEngine.roomCode,
              {
                clue: selectedClue,
                darkPlayerId: darkPlayer.id,
              },
            );
          }
        }

        // Check if host is the dark player
        const socket = this.gameEngine.socketHandler.getSocket();
        const isDarkPlayer = socket && socket.id === this.gameEngine.darkPlayerId;

        if (isDarkPlayer) {
          this.gameEngine.sectionManager.showSection('youre-in-the-dark');
        } else {
          this.gameEngine.sectionManager.showSection('clue-is-ready');
        }
      } else {
        // Non-host: wait for clue_and_dark_player_selected event
        // Questions will be updated when clue is received via handleClueAndDarkPlayerSelected
        // Check if we received clue and dark player from backend (shouldn't happen here, but handle it)
        if (data?.clue && data?.darkPlayerId) {
          this.gameEngine.selectedClue = data.clue;
          this.gameEngine.darkPlayerId = data.darkPlayerId;
          // Update questions for the selected clue
          this.gameEngine.categoryManager.updateQuestionSections(categoryId, data.clue);
          this.updateClueDisplay(data.clue);
        }

        // Check if current player is the dark player
        const socket = this.gameEngine.socketHandler.getSocket();
        const isDarkPlayer = socket && socket.id === this.gameEngine.darkPlayerId;

        if (isDarkPlayer) {
          this.gameEngine.sectionManager.showSection('youre-in-the-dark');
        } else {
          this.gameEngine.sectionManager.showSection('clue-is-ready');
        }
      }
    } else {
      // Category game - all players go to first question
      this.gameEngine.sectionManager.showSection('category-question-1');
    }
  }

  // Randomly select a dark player from all players
  selectRandomDarkPlayer(previousDarkId = null) {
    const players = this.gameEngine.players || [];
    if (players.length === 0) return null;

    let eligiblePlayers = players;
    if (players.length > 2 && previousDarkId) {
      eligiblePlayers = players.filter((p) => p.id !== previousDarkId);
    }

    const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
    return eligiblePlayers[randomIndex];
  }

  // Update clue display in UI
  updateClueDisplay(clue) {
    if (!clue) return;

    // Update clue-is-ready section
    const clueSection = document.querySelector('#clue-is-ready');
    if (clueSection) {
      const clueImage = clueSection.querySelector('.image img');
      const clueText = clueSection.querySelector('.clue-text');

      if (clueImage && clue.clueImage) {
        clueImage.src = clue.clueImage;
        clueImage.alt = clue.clueText;
      }

      if (clueText) {
        clueText.textContent = clue.clueText.toUpperCase();
      }
    }

    // Update reveal-answer section
    const revealSection = document.querySelector('#reveal-answer');
    if (revealSection) {
      const secretCardImage = revealSection.querySelector('.secrect-card img');
      const secretWordText = revealSection.querySelector('.secrect-card .secret-word');

      if (secretCardImage && clue.clueImage) {
        secretCardImage.src = clue.clueImage;
        secretCardImage.alt = clue.clueText;
      }

      if (secretWordText) {
        secretWordText.textContent = clue.clueText.toUpperCase();
      }
    }
  }

  // Handle ready button
  handleReadyButton() {
    // If user is on clue-is-ready section (regardless of host status), go to dark-question-1
    // This means they saw the clue, so they're not the dark player
    if (
      this.gameEngine.currentSection === 'clue-is-ready'
      && this.gameEngine.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK
    ) {
      // Ensure questions are updated before navigating to dark-question-1
      if (this.gameEngine.selectedCategory && this.gameEngine.selectedClue) {
        this.gameEngine.categoryManager.updateQuestionSections(
          this.gameEngine.selectedCategory,
          this.gameEngine.selectedClue,
        );
      }
      this.gameEngine.sectionManager.showSection('dark-question-1');
    } else {
      // Default behavior: go to youre-in-the-dark
      this.gameEngine.sectionManager.showSection('youre-in-the-dark');
    }
  }

  // Handle dark ready button
  handleDarkReadyButton() {
    const nextSection = this.gameEngine.gameType === GAME_TYPES.CATEGORY_GAME
      ? 'category-question-1'
      : 'dark-question-1';
    this.gameEngine.sectionManager.showSection(nextSection);
  }

  // Handle next button
  handleNextButton() {
    // Submit answer for current question before moving to next
    this.submitCurrentAnswer();

    this.gameEngine.timerManager.stopTimer();
    const nextSection = this.gameEngine.gameType === GAME_TYPES.CATEGORY_GAME
      ? 'category-question-2'
      : 'dark-question-2';
    this.gameEngine.sectionManager.showSection(nextSection);
  }
  //   handleNextButton() {
  //   this.submitCurrentAnswer();
  //   const currentSection = this.gameEngine.sectionManager?.getCurrentSection();

  //   if (currentSection === GAME_SECTIONS.CATEGORY_QUESTION_1) {
  //     this.gameEngine.showSection(GAME_SECTIONS.CATEGORY_QUESTION_2);
  //   } else if (currentSection === GAME_SECTIONS.DARK_QUESTION_1) {
  //     this.gameEngine.showSection(GAME_SECTIONS.DARK_QUESTION_2);
  //   }
  // }

  // Handle spot dark button (host only - navigates all users)
  handleSpotDarkButton() {
    // Only host can click this button
    if (!this.gameEngine.isHost) {
      return;
    }

    this.gameEngine.timerManager.stopTimer();

    const nextSection = this.gameEngine.gameType === GAME_TYPES.CATEGORY_GAME
      ? 'clue-answers'
      : 'who-is-in-the-dark';

    // Emit navigation event to backend, which will broadcast to all players
    if (this.gameEngine.socketHandler.getSocket() && this.gameEngine.roomCode) {
      this.gameEngine.socketHandler.navigateToSection(
        this.gameEngine.roomCode,
        nextSection,
      );
    }
  }

  // Handle submit button (used for multiple purposes)
  handleSubmitButton() {
    const { currentSection } = this.gameEngine;
    const socket = this.gameEngine.socketHandler.getSocket();

    // CASE 1: Voting in "Who Is in the Dark"
    if (currentSection === 'who-is-in-the-dark') {
      const voteSection = document.querySelector('#who-is-in-the-dark');
      if (!voteSection) return;

      const selectedRadio = voteSection.querySelector('input[name="player"]:checked');
      if (!selectedRadio) {
        console.warn('Please select a player before voting!');
        return;
      }

      const votedPlayerId = selectedRadio.value;
      const { roomCode } = this.gameEngine;

      if (!roomCode) {
        console.warn('Missing room code, cannot submit vote.');
        return;
      }

      console.log(`Submitting vote for player ID: ${votedPlayerId}`);

      // Use the centralized socket handler
      this.gameEngine.socketHandler.voteDarkPlayer(roomCode, votedPlayerId);

      // Disable submit button to prevent re-vote
      const voteButton = voteSection.querySelector('.submit-button');
      if (voteButton) {
        voteButton.disabled = true;
        voteButton.textContent = 'VOTE SUBMITTED';
        voteButton.style.opacity = '0.6';
      }

      return; // stop here — wait for backend to navigate on all votes
    }

    // CASE 2: Clue answers in category game
    if (currentSection === 'clue-answers') {
      this.submitClueAnswer();
      return;
    }

    // CASE 3: Normal flow for other transitions (category game → winner, dark game → reveal)
    this.gameEngine.timerManager.stopTimer();

    const nextSection = this.gameEngine.gameType === 'category-game'
      ? 'winner'
      : 'reveal-answer';

    this.gameEngine.sectionManager.showSection(nextSection);
  }

  // Submit answer for current question section
  submitCurrentAnswer() {
    const { currentSection } = this.gameEngine;

    // Determine question order based on section
    let questionOrder = 1;
    if (currentSection === 'category-question-2' || currentSection === 'dark-question-2') {
      questionOrder = 2;
    }

    // Get answer input
    const answerInput = document.querySelector(`#${currentSection} .answer-input`);
    if (!answerInput) return;

    const answerText = answerInput.value.trim();
    if (!answerText) {
      console.log('No answer provided');
      return;
    }

    // Get question text
    const questionText = document.querySelector(`#${currentSection} .question-text`);
    const question = questionText ? questionText.textContent : '';

    // Create answer object
    const answer = {
      questionOrder,
      questionText: question,
      answerText,
      section: currentSection,
    };

    // Submit to backend
    if (this.gameEngine.roomCode) {
      this.gameEngine.socketHandler.submitAnswer(
        this.gameEngine.roomCode,
        answer,
      );

      // Store locally
      this.gameEngine.playerAnswers.push(answer);

      // Clear input for next question
      answerInput.value = '';
      const charCountElement = answerInput.parentNode.querySelector('.char-count');
      if (charCountElement) {
        charCountElement.textContent = '0/30 characters';
      }
    }
  }

  // Submit clue answer (radio button selection)
  submitClueAnswer() {
    const selectedRadio = document.querySelector(
      '#clue-answers input[name="clue-answer"]:checked',
    );

    if (!selectedRadio) {
      console.log('No answer selected');
      return;
    }
    const answerText = selectedRadio.value.trim();
    // Get player ID directly from the radio button's data attribute
    const selectedAnswerPlayerId = selectedRadio.getAttribute('data-player-id');

    if (!answerText) {
      console.log('No answer text found');
      return;
    }

    if (!selectedAnswerPlayerId) {
      console.log('No player ID found for selected answer');
      return;
    }

    const questionText = document.querySelector(
      '.clue-answers-container .title',
    )?.textContent;

    // Get current player being viewed
    const currentPlayerIndex = this.gameEngine.roomManager.currentCluePlayerIndex;
    const playersWithQ1 = this.gameEngine.roomManager.clueAnswersPlayers;

    if (!playersWithQ1 || currentPlayerIndex >= playersWithQ1.length) {
      console.log('Invalid player index');
      return;
    }

    const targetPlayer = playersWithQ1[currentPlayerIndex];
    if (!targetPlayer) {
      console.log('Target player not found');
      return;
    }

    const allPlayers = this.gameEngine.players || [];
    const selectedAnswerPlayer = allPlayers.find(
      (player) => player.id === selectedAnswerPlayerId,
    );

    if (!selectedAnswerPlayer) {
      console.log('Selected answer player not found');
      return;
    }

    // Create guess object
    const guess = {
      questionOrder: 1,
      selectedAnswerText: answerText,
      targetPlayerId: targetPlayer.id,
    };

    // Submit guess to backend
    if (this.gameEngine.roomCode) {
      this.gameEngine.socketHandler.submitClueGuess(
        this.gameEngine.roomCode,
        guess,
      );

      // Store locally
      if (!this.gameEngine.clueGuesses) {
        this.gameEngine.clueGuesses = [];
      }
      this.gameEngine.clueGuesses.push(guess);

      // Navigate to next player's question if available
      const nextPlayerIndex = currentPlayerIndex + 1;
      if (nextPlayerIndex < playersWithQ1.length) {
        this.gameEngine.roomManager.currentCluePlayerIndex = nextPlayerIndex;
        this.gameEngine.roomManager.updateClueAnswers(this.gameEngine.players);

        // Only reset the radio selection when moving to the next question
        if (selectedRadio) {
          selectedRadio.checked = false;
        }
      } else {
        // All players' questions have been answered
        console.log('All clue answers submitted');

        // Show waiting message for others to complete answers
        const clueAnswersContainer = document.querySelector('.clue-answers-container');
        if (clueAnswersContainer) {
          let waitingMessage = clueAnswersContainer.querySelector('.waiting-message');
          if (!waitingMessage) {
            waitingMessage = document.createElement('div');
            waitingMessage.className = 'waiting-message';
            waitingMessage.style.marginTop = '1rem';
            waitingMessage.style.textAlign = 'center';
            waitingMessage.style.color = '#666';
            waitingMessage.style.fontSize = '0.95rem';

            const buttonContainer = clueAnswersContainer.querySelector('.button');
            if (buttonContainer) {
              buttonContainer.insertAdjacentElement('afterend', waitingMessage);
            } else {
              clueAnswersContainer.appendChild(waitingMessage);
            }
          }
          waitingMessage.textContent = 'Waiting for others to complete answers...';
        }
      }
    }
  }

  // Handle answer input
  handleAnswerInput(e) {
    const input = e.target;
    const charCountElement = input.parentNode.querySelector('.char-count');

    if (charCountElement) {
      const maxLength = input.getAttribute('maxlength') || 30;
      charCountElement.textContent = `${input.value.length}/${maxLength} characters`;
    }
  }

  // Handle error message
  handleErrorMessage(message) {
    const joiningSection = document.querySelector('#game-room-joining');
    if (joiningSection && this.gameEngine.currentSection === 'game-room-joining') {
      this.gameEngine.roomManager.handleJoinRoomError(message);
    } else {
      const joinButton = document.querySelector('.join-button');
      if (joinButton) {
        joinButton.disabled = false;
        joinButton.style.opacity = '1';
        joinButton.style.cursor = 'pointer';
      }
    }
    console.log('Error message:', message);
  }

  // Handle play more button - reset everything except points
  handlePlayMoreButton() {
    console.log('Play More clicked — resetting everything except points.');
    const savedPoints = { ...this.gameEngine.playerPoints };

    this.gameEngine.playerAnswers = [];
    this.gameEngine.clueGuesses = [];
    this.gameEngine.selectedClue = null;
    this.gameEngine.darkPlayerId = null;
    this.gameEngine.selectedCategory = null;
    this.gameEngine.roomManager.currentCluePlayerIndex = 0;

    const socket = this.gameEngine.socketHandler.getSocket();
    if (socket && this.gameEngine.roomCode) {
      socket.emit('reset_round', { roomCode: this.gameEngine.roomCode });
    }

    if (Array.isArray(this.gameEngine.players)) {
      this.gameEngine.players.forEach((player) => {
        player.answers = [];
        player.votes = 0;
        player.notQualified = false;
        delete player.hasVoted;
        delete player.votedFor;
        if (!savedPoints[player.id]) {
          savedPoints[player.id] = player.points || 0;
        }
      });
    }

    if (socket && this.gameEngine.roomCode) {
      socket.once('answers_reset', () => {
        console.log('Server acknowledged answers_reset — navigating to game-room-details');
        this.gameEngine.playerPoints = savedPoints;
        socket.emit('request_room_update', { roomCode: this.gameEngine.roomCode });
        this.gameEngine.sectionManager.showSection('game-room-details');
      });

      this.gameEngine.socketHandler.resetAnswers(this.gameEngine.roomCode);
    } else {
      this.gameEngine.sectionManager.showSection('game-room-details');
    }

    const allCategoryCards = document.querySelectorAll('.category-card.selected');
    allCategoryCards.forEach((card) => card.classList.remove('selected'));

    const currentPlayer = this.gameEngine.players?.find((p) => p.id === socket?.id);
    this.gameEngine.isHost = currentPlayer?.isHost || false;
    const letsStartButton = document.querySelector('.lets-start-button');
    if (letsStartButton && !this.gameEngine.isHost) {
      letsStartButton.remove();
      const nonHostCategoryWaitingMessage = document.querySelector('.non-host-waiting-msg');
      nonHostCategoryWaitingMessage.style.display = 'block';
    } else if (letsStartButton && this.gameEngine.isHost) {
      letsStartButton.disabled = true;
      letsStartButton.setAttribute('disabled', 'disabled');
      letsStartButton.style.opacity = '0.5';
      letsStartButton.style.cursor = 'not-allowed';
    }
  }

  // Handle new game button - full reset
  handleNewGameButton() {
    console.log('Starting completely new game — resetting everything.');

    const endSections = ['winner', 'leaderboard', 'reveal-answer'];
    const isEndOfGame = endSections.includes(this.gameEngine.currentSection);

    const socket = this.gameEngine.socketHandler.getSocket();

    // Notify backend that this user is leaving the room
    if (socket && this.gameEngine.roomCode) {
      socket.emit('leave_room', {
        roomCode: this.gameEngine.roomCode,
        isEndOfGame,
      });
    }

    // Remove "in-room" flag
    sessionStorage.removeItem('inRoom');

    // Reset local game data completely
    this.gameEngine.playerAnswers = [];
    this.gameEngine.clueGuesses = [];
    this.gameEngine.playerPoints = {};
    this.gameEngine.selectedCategory = null;
    this.gameEngine.selectedClue = null;
    this.gameEngine.darkPlayerId = null;

    if (socket && this.gameEngine.roomCode) {
      socket.emit('reset_round', { roomCode: this.gameEngine.roomCode });
    }

    // Reset player-level info
    if (this.gameEngine.players && Array.isArray(this.gameEngine.players)) {
      this.gameEngine.players.forEach((player) => {
        player.answers = [];
        player.votes = 0;
        delete player.hasVoted;
        delete player.votedFor;
        player.points = 0;
      });
    }

    // If host, clear room code flag locally (backend handles closing)
    this.gameEngine.roomCode = null;
    this.gameEngine.isHost = false;

    // Go back to carousel
    this.gameEngine.sectionManager.showSection('games-selector');
  }
}
