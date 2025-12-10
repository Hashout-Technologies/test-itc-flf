/* eslint-disable class-methods-use-this */
// /**
//  * Game Room Manager
//  * Handles room creation, joining, and player management
//  */
import { copyToClipboard, shareOnWhatsApp } from './game-utils.js';
import { GAME_TYPES } from './game-config.js';

export class GameRoomManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.clueAnswersPlayers = []; // Store players with question 1 answers
    this.currentCluePlayerIndex = 0; // Track which player's question we're viewing
  }

  // Handle room creation
  handleCreateRoom() {
    const socket = this.gameEngine.socketHandler.getSocket();
    if (!socket) {
      console.log('Socket connection not available');
      return;
    }

    const username = this.gameEngine.getUsername();
    if (!username) {
      console.log('Username not found');
      return;
    }

    // Emit create_room event
    this.gameEngine.socketHandler.createRoom(
      this.gameEngine.gameType,
      username,
    );
    console.log('Creating room...');
  }

  // Handle room created response
  handleRoomCreated(data) {
    const { roomCode, players } = data;
    this.gameEngine.roomCode = roomCode;
    this.gameEngine.isHost = true;
    sessionStorage.setItem('inRoom', 'true');

    const savedUser = JSON.parse(localStorage.getItem('userData'));
    if (savedUser && savedUser.name) {
      const firstName = savedUser.name.split(' ')[0];

      const title = document.querySelector(
        '#game-room-creation .title',
      );

      if (title) {
        title.innerHTML = `
                ${firstName} has <br />
                <span class="yellow">Created Room</span>
            `;
      }
    }

    this.gameEngine.sectionManager.updateRoomCodeDisplay(roomCode);
    this.updatePlayersList(players);
    this.gameEngine.sectionManager.showSection('game-room-creation');
  }

  // Handle room joining
  handleJoinRoom() {
    const socket = this.gameEngine.socketHandler.getSocket();
    if (!socket) {
      console.log('Socket connection not available');
      return;
    }

    const roomCodeInput = document.querySelector('.room-code-input');
    if (!roomCodeInput) {
      console.log('Room code input not found');
      return;
    }

    const roomCode = roomCodeInput.value.trim().toUpperCase();

    // Show error message if room code is invalid
    const errorMessage = document.querySelector(
      '#game-room-joining .error-message',
    );
    if (roomCode.length !== 6) {
      if (errorMessage) {
        errorMessage.style.display = 'block';
      }
      // Add error styling to input
      if (roomCodeInput) {
        roomCodeInput.style.borderColor = '#bb1f3b';
      }
      return;
    }

    // Hide error message if valid
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }
    if (roomCodeInput) {
      roomCodeInput.style.borderColor = '#b8b8b8';
    }

    const username = this.gameEngine.getUsername();
    if (!username) {
      console.log('Failed to generate username');
      return;
    }

    // Disable button while joining
    const joinButton = document.querySelector('.join-button');
    if (joinButton) {
      joinButton.disabled = true;
      joinButton.style.opacity = '0.5';
      joinButton.style.cursor = 'not-allowed';
    }

    // Emit join_room event
    this.gameEngine.socketHandler.joinRoom(
      roomCode,
      this.gameEngine.gameType,
      username,
    );
    console.log('Joining room...');
  }

  // Handle room update (when players join/leave)
  handleRoomUpdate(players) {
    console.log('room_update received:', players);

    // Always store players
    this.gameEngine.players = players;

    players.forEach((p) => {
      p.answers = p.answers || [];
      p.notQualified = p.notQualified || false;
    });

    // Track inRoom
    sessionStorage.setItem('inRoom', 'true');

    const socket = this.gameEngine.socketHandler.getSocket();
    const currentPlayerId = socket?.id;

    // Update host
    if (socket && socket.id) {
      const currentPlayer = players.find((p) => p.id === socket.id);
      this.gameEngine.isHost = currentPlayer ? currentPlayer.isHost : false;
    }

    // LOBBY RE-ENTRY LOGIC — RESET EVERYTHING FOR NEW ROUND
    // If user is in lobby → cleanup round leftovers
    if (this.gameEngine.currentSection === 'game-room-details') {
      console.log('Resetting round state — lobby detected');

      // CLEAR all per-round data safely
      this.gameEngine.playerAnswers = [];
      this.gameEngine.clueGuesses = [];
      this.gameEngine.selectedClue = null;
      this.gameEngine.selectedCategory = null;
      this.gameEngine.darkPlayerId = null;

      // DO NOT RESET playerPoints → keep them for final scoreboard
    }

    // Update lobby UI
    this.updatePlayersList(players);

    // Squad status in question screens
    this.updateSquadStatus(players);

    // Player answers screen
    if (this.gameEngine.currentSection === 'player-answers') {
      this.updatePlayerAnswers(players);
      this.updateSpotDarkButtonVisibility();
    }

    // Clue answers screen
    if (this.gameEngine.currentSection === 'clue-answers') {
      this.updateClueAnswers(players);
    }

    // Joining → go to lobby
    if (this.gameEngine.currentSection === 'game-room-joining') {
      const roomCodeInput = document.querySelector('.room-code-input');
      if (roomCodeInput) {
        this.gameEngine.roomCode = roomCodeInput.value.trim().toUpperCase();
        this.gameEngine.sectionManager.updateRoomCodeDisplay(
          this.gameEngine.roomCode,
        );
      }
      this.gameEngine.sectionManager.showSection('game-room-details');
    }

    // Lobby → update room code + host button
    if (this.gameEngine.currentSection === 'game-room-details') {
      if (this.gameEngine.roomCode) {
        const codeElement = document.querySelector('#game-room-details .code');
        if (codeElement && codeElement.textContent !== this.gameEngine.roomCode) {
          codeElement.textContent = this.gameEngine.roomCode;
        }
      }
      this.updateCategoryButtonVisibility();
      const validPlayers = players;
      const requiredPlayersErrorMsg = document.querySelector('#game-room-details .min-players');

      if (validPlayers.length < 3) {
        if (requiredPlayersErrorMsg) {
          requiredPlayersErrorMsg.style.display = 'block';
          requiredPlayersErrorMsg.textContent = 'You need at least 3 players to start the game.';
        }
      } else if (requiredPlayersErrorMsg) {
        requiredPlayersErrorMsg.style.display = 'none';
      }
    }
  }

  // Update players list in UI
  updatePlayersList(players) {
    // --- CATEGORY GAME LOBBY ---
    const lobbyContainer = document.querySelector('#game-room-details .players-cards');
    if (lobbyContainer) {
      lobbyContainer.innerHTML = '';

      players.forEach((player) => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';

        // Always show only the first name in lobby
        const nameParts = (player.username || '').trim().split(/\s+/);
        const displayName = nameParts[0] || player.username || '';

        playerCard.innerHTML = `
          <div class="avatar">
            <img src="./icons/image.png" alt="Player Avatar" />
          </div>
          <div class="player-name">${displayName}</div>
        `;
        lobbyContainer.appendChild(playerCard);
      });
    }

    // --- WHO IS IN THE DARK SECTION ---
    const darkContainer = document.querySelector('#who-is-in-the-dark .players');
    if (darkContainer) {
      darkContainer.innerHTML = '';

      const socket = this.gameEngine.socketHandler.getSocket();
      const currentPlayerId = socket?.id;
      const { darkPlayerId } = this.gameEngine;

      // Hide current player only, not the dark player
      const visiblePlayers = players.filter((p) => p.id !== currentPlayerId);

      if (visiblePlayers.length === 0) {
        darkContainer.innerHTML = `
          <div style="text-align:center;color:#999;padding:1rem;">
            No players available to vote for.
          </div>`;
        return;
      }

      visiblePlayers.forEach((player) => {
        const div = document.createElement('div');
        div.classList.add('player');
        div.innerHTML = `
          <div class="player-name">${
  this.gameEngine.currentSection === 'game-room-details'
    ? player.username.split(' ')[0]
    : player.username
}</div>
          <div class="checkbox">
            <input type="radio" name="player" value="${player.id}" />
          </div>
        `;
        darkContainer.appendChild(div);
      });

      // --- Reset vote button state for new round ---
      const voteButton = document.querySelector('#who-is-in-the-dark .submit-button');
      if (voteButton) {
        voteButton.disabled = false;
        voteButton.textContent = 'SUBMIT';
        voteButton.style.opacity = '1';
        voteButton.style.cursor = 'pointer';
      }

      // Disable the vote button for the dark player (so they can’t vote)
      if (socket && socket.id === darkPlayerId) {
        const voteButton = document.querySelector('#who-is-in-the-dark .submit-button');
        if (voteButton) {
          voteButton.disabled = true;
          voteButton.textContent = 'You are in the Dark!';
          voteButton.style.opacity = '0.6';
        }
      }
    }
  }

  // Copy room code to clipboard
  async copyRoomCode() {
    const roomCodeElement = document.querySelector('.room-code');
    if (!roomCodeElement) return;

    const roomCode = roomCodeElement.textContent;
    const success = await copyToClipboard(roomCode);

    if (success) {
      const copyIcons = document.querySelectorAll('.copy-icon');
      copyIcons.forEach((icon) => {
        icon.classList.add('copied');
        setTimeout(() => {
          icon.classList.remove('copied');
        }, 600);
      });
    }
  }

  // Share room code on WhatsApp
  shareRoomCode() {
    const roomCodeElement = document.querySelector('.room-code');
    if (!roomCodeElement) return;

    const roomCode = roomCodeElement.textContent;
    shareOnWhatsApp(roomCode);
  }

  // Handle room code input
  handleRoomCodeInput(e) {
    const input = e.target;
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    const joiningSection = input.closest('#game-room-joining');
    const continueButton = joiningSection
      ? joiningSection.querySelector('.join-button')
      : document.querySelector('.join-button');
    const errorMessage = joiningSection
      ? joiningSection.querySelector('.error-message')
      : document.querySelector('.error-message');

    const isValid = input.value.length === 6;

    if (errorMessage) {
      if (isValid || input.value.length === 0) {
        errorMessage.style.display = 'none';
        input.style.borderColor = '#b8b8b8';
      } else {
        errorMessage.textContent = 'Please enter a valid 6-character room code';
        errorMessage.style.display = 'block';
        input.style.borderColor = '#bb1f3b';
      }
    }

    if (continueButton) {
      continueButton.disabled = !isValid;

      if (isValid) {
        continueButton.style.opacity = '1';
        continueButton.style.cursor = 'pointer';
        continueButton.removeAttribute('disabled');
      } else {
        continueButton.style.opacity = '0.5';
        continueButton.style.cursor = 'not-allowed';
        continueButton.setAttribute('disabled', 'disabled');
      }
    }
  }

  // Handle join room error from server
  handleJoinRoomError(message) {
    const joiningSection = document.querySelector('#game-room-joining');
    if (!joiningSection) return;

    const errorMessage = joiningSection.querySelector('.error-message');
    const roomCodeInput = joiningSection.querySelector('.room-code-input');
    const joinButton = joiningSection.querySelector('.join-button');

    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
    }

    if (roomCodeInput) {
      roomCodeInput.style.borderColor = '#bb1f3b';
    }

    if (joinButton) {
      joinButton.disabled = false;
      joinButton.style.opacity = '1';
      joinButton.style.cursor = 'pointer';
      joinButton.removeAttribute('disabled');
    }
  }

  // Update squad status based on player answers
  updateSquadStatus(players) {
    const { currentSection } = this.gameEngine;

    // Only update squad status for question sections
    const questionSections = [
      'category-question-1',
      'category-question-2',
    ];

    if (!questionSections.includes(currentSection)) {
      return;
    }

    // Determine question order and section type from current section
    let questionOrder = 1;
    const sectionType = 'category-question';

    if (currentSection === 'category-question-2') {
      questionOrder = 2;
    }

    // Find all squad containers in the current section
    const squadContainers = document.querySelectorAll(
      `#${currentSection} .squad-container`,
    );

    if (squadContainers.length === 0) return;

    // Get current player's socket ID to filter them out
    const socket = this.gameEngine.socketHandler.getSocket();
    const currentPlayerId = socket?.id;

    // Filter out current player
    const otherPlayers = players.filter((player) => player.id !== currentPlayerId);

    squadContainers.forEach((container) => {
      // Clear existing cards
      container.innerHTML = '';

      // Create squad cards for each player
      otherPlayers.forEach((player, index) => {
        const squadCard = document.createElement('div');
        squadCard.className = 'squad-card';

        // Check if player has submitted answer for this question
        const hasSubmitted = this.checkPlayerSubmission(
          player,
          questionOrder,
          sectionType,
        );

        const avatarImages = [
          './icons/image.png',
          './icons/image2.png',
          './icons/image3.png',
        ];
        const avatarImage = avatarImages[index % avatarImages.length] || avatarImages[0];

        squadCard.innerHTML = `
          <div class="user-info">
            <div class="squad-card-icon">
              <img src="${avatarImage}" alt="User Icon" />
            </div>
            <div class="squad-card-name">${player.username}</div>
          </div>
          <div class="squad-card-status">${hasSubmitted ? 'Submitted' : 'Not Yet'}</div>
        `;

        container.appendChild(squadCard);
      });
    });
  }

  // Check if player has submitted answer for specific question
  checkPlayerSubmission(player, questionOrder, sectionType) {
    if (!player.answers || !Array.isArray(player.answers)) {
      return false;
    }

    // Check if player has an answer matching the question order and section type
    return player.answers.some((answer) => {
      // Match by questionOrder
      if (answer.questionOrder === questionOrder) {
        // Match by section type
        if (sectionType === 'dark-question') {
          return (
            answer.section === 'dark-question-1'
            || answer.section === 'dark-question-2'
          );
        }
        return (
          answer.section === 'category-question-1'
            || answer.section === 'category-question-2'
        );
      }
      return false;
    });
  }

  // Update player answers display with formatted answers
  updatePlayerAnswers(players) {
    const answersContainer = document.querySelector('#player-answers .answers-container');
    if (!answersContainer) return;

    answersContainer.innerHTML = '';
    answersContainer.style.display = 'grid';

    const socket = this.gameEngine.socketHandler.getSocket();
    const currentPlayerId = socket?.id;

    // Redirect logic ONLY when user is in player-answers
    if (this.gameEngine.currentSection === 'player-answers') {
      const validPlayers = players.filter((player) => {
        const ans = player.answers || [];
        const hasBothAnswers = ans.some((a) => a.questionOrder === 1)
          && ans.some((a) => a.questionOrder === 2);

        if (hasBothAnswers) {
          return true;
        }

        return !player.notQualified;
      });

      if (validPlayers.length < 3) {
        console.log('Less than 3 valid players left → redirect to lobby');
        this.gameEngine.sectionManager.showSection('game-room-details');
        return;
      }
    }

    const avatarImages = [
      './icons/image.png',
      './icons/image2.png',
      './icons/image3.png',
    ];

    const categoryId = this.gameEngine.selectedCategory;
    const { selectedClue } = this.gameEngine;
    const answersFormat = this.gameEngine.categoryManager?.getAnswersFormat(categoryId, selectedClue);
    const isDarkGame = this.gameEngine.gameType === GAME_TYPES.WHO_IS_IN_THE_DARK;
    const requiresAnswer1 = isDarkGame || (answersFormat?.includes('{{answer1}}') ?? false);

    const otherPlayers = players.filter(
      (player) => !player.notQualified,
    );

    let renderedCount = 0;

    otherPlayers.forEach((player, index) => {
      const answers = player.answers || [];
      if (!Array.isArray(answers) || answers.length === 0) return;

      const hasAnswer1 = answers.some(
        (a) => a.questionOrder === 1 && a.answerText?.trim(),
      );
      const hasAnswer2 = answers.some(
        (a) => a.questionOrder === 2 && a.answerText?.trim(),
      );

      if ((requiresAnswer1 && !hasAnswer1) || !hasAnswer2) return;

      let displayAnswer = '';

      if (answersFormat) {
        const needsAnswer1 = answersFormat.includes('{{answer1}}');
        const needsAnswer2 = answersFormat.includes('{{answer2}}');

        const firstAnswer = needsAnswer1
          ? (answers.find((a) => a.questionOrder === 1)?.answerText || '').trim()
          : '';
        const secondAnswer = needsAnswer2
          ? (answers.find((a) => a.questionOrder === 2)?.answerText || '').trim()
          : '';

        displayAnswer = answersFormat
          .replace(/\{\{answer1\}\}/g, firstAnswer)
          .replace(/\{\{answer2\}\}/g, secondAnswer);
      } else {
        const firstAnswer = answers.find((a) => a.questionOrder === 1)?.answerText?.trim() || '';
        const secondAnswer = answers.find((a) => a.questionOrder === 2)?.answerText?.trim() || '';

        if (isDarkGame) {
          if (firstAnswer && secondAnswer) {
            displayAnswer = `With ${firstAnswer} at ${secondAnswer}`;
          } else if (firstAnswer) {
            displayAnswer = `With ${firstAnswer}`;
          } else if (secondAnswer) {
            displayAnswer = `At ${secondAnswer}`;
          } else {
            displayAnswer = 'No answers yet';
          }
        } else {
          displayAnswer = secondAnswer || 'No answer';
        }
      }

      const card = document.createElement('div');
      card.className = 'answer-card';
      card.innerHTML = `
        <div class="player-info">
          <div class="avatar"><img src="${avatarImages[index % avatarImages.length]}"></div>
          <div class="player-name">${player.username}</div>
        </div>
        <div class="player-answer">${displayAnswer}</div>
      `;

      answersContainer.appendChild(card);
      renderedCount += 1;
    });

    if (renderedCount === 0) {
      answersContainer.style.display = 'block';
      answersContainer.innerHTML = `
        <div style="text-align:center; padding:2rem; color:#666;">
          Waiting for everyone to finish...
        </div>
      `;
    }
  }

  // Update clue answers section with player question 1 answers
  updateClueAnswers(players) {
    const clueAnswersContainer = document.querySelector(
      '.clue-answers-container',
    );
    if (!clueAnswersContainer) return;

    // Get current player's socket ID to filter them out
    const socket = this.gameEngine.socketHandler.getSocket();
    const currentPlayerId = socket?.id;

    // Get all players with question 1 answers (excluding current user)
    const playersWithQ1 = players.filter((player) => {
      if (player.id === currentPlayerId) return false;
      if (!player.answers || !Array.isArray(player.answers)) return false;
      return player.answers.some((answer) => answer.questionOrder === 1);
    });

    // Store players list for navigation
    this.clueAnswersPlayers = playersWithQ1;

    // Ensure index is valid
    if (this.currentCluePlayerIndex >= playersWithQ1.length) {
      this.currentCluePlayerIndex = 0;
    }

    // If no players with answers, show message
    if (playersWithQ1.length === 0) {
      this.renderClueAnswersEmpty(clueAnswersContainer);
      this.updateClueQuestionCount(0, 0);
      return;
    }

    // Get current player being viewed
    const currentPlayer = playersWithQ1[this.currentCluePlayerIndex];
    if (!currentPlayer) {
      this.currentCluePlayerIndex = 0;
      return;
    }

    // Get current player's question 1
    const currentPlayerQ1 = currentPlayer.answers.find(
      (answer) => answer.questionOrder === 1,
    );

    if (!currentPlayerQ1) {
      return;
    }

    // Update question title with current player's question
    const titleElement = clueAnswersContainer.querySelector('.title');
    if (titleElement && currentPlayerQ1.questionText) {
      const firstWord = (currentPlayer.username || '').trim().split(/\s+/)[0]
        || currentPlayer.username
        || '';
      const displayName = firstWord || currentPlayer.username || '';
      let { questionText } = currentPlayerQ1;

      questionText = questionText.replace(/your/gi, `${displayName}'s`);

      if (
        displayName
        && !questionText.toLowerCase().includes(displayName.toLowerCase())
      ) {
        questionText = questionText.replace(
          /(what is|what's|who is|who's|where is|where's)\s+/gi,
          `$1 ${displayName}'s `,
        );
      }

      titleElement.textContent = questionText;
    }

    // Get ALL players' question 1 answers (including the current player being viewed)
    const allPlayersAnswers = [];
    playersWithQ1.forEach((player) => {
      const q1Answer = player.answers.find((a) => a.questionOrder === 1);
      if (q1Answer && q1Answer.answerText) {
        allPlayersAnswers.push({
          playerId: player.id,
          playerName: player.username,
          answerText: q1Answer.answerText,
        });
      }
    });

    // Randomize the order of answers to prevent cheating
    const shuffledAnswers = this.shuffleArray([...allPlayersAnswers]);

    // Render answer cards with all answers (in randomized order)
    this.renderClueAnswerCards(clueAnswersContainer, shuffledAnswers);

    // Update question count
    this.updateClueQuestionCount(
      this.currentCluePlayerIndex + 1,
      playersWithQ1.length,
    );

    // Update navigation buttons
    this.updateClueNavigationButtons();
  }

  // Render answer cards for clue answers
  renderClueAnswerCards(container, answers) {
    const buttonContainer = container.querySelector('.button');

    // Remove all existing answer cards
    const existingCards = container.querySelectorAll('.clue-answer-card');
    existingCards.forEach((card) => card.remove());

    // Remove any existing "no answers" message
    const noAnswersMsg = container.querySelector('.no-answers-message');
    if (noAnswersMsg) {
      noAnswersMsg.remove();
    }
    const waitingMessage = container.querySelector('.waiting-message');
    if (waitingMessage) {
      waitingMessage.remove();
    }

    if (answers.length > 0) {
      answers.forEach((answerData, index) => {
        const answerCard = document.createElement('div');
        answerCard.className = 'clue-answer-card';
        // Store player ID as data attribute for reliable identification
        answerCard.setAttribute('data-player-id', answerData.playerId || '');

        answerCard.innerHTML = `
          <div class="anwer">${answerData.answerText}</div>
          <div class="radio-button">
            <input type="radio" name="clue-answer" id="clue-answer-${index}" value="${answerData.answerText}" data-player-id="${answerData.playerId || ''}" />
          </div>
        `;

        if (buttonContainer) {
          container.insertBefore(answerCard, buttonContainer);
        } else {
          container.appendChild(answerCard);
        }
      });
    } else {
      const noAnswersMessage = document.createElement('div');
      noAnswersMessage.className = 'no-answers-message';
      noAnswersMessage.style.cssText = 'text-align: center; padding: 2rem; color: #666; width: 100%;';
      noAnswersMessage.textContent = 'No answers available for this question';

      if (buttonContainer) {
        container.insertBefore(noAnswersMessage, buttonContainer);
      } else {
        container.appendChild(noAnswersMessage);
      }
    }
  }

  // Render empty state for clue answers
  renderClueAnswersEmpty(container) {
    const buttonContainer = container.querySelector('.button');
    const existingCards = container.querySelectorAll('.clue-answer-card');
    existingCards.forEach((card) => card.remove());

    const noAnswersMsg = container.querySelector('.no-answers-message');
    if (noAnswersMsg) {
      noAnswersMsg.remove();
    }
    const waitingMessage = container.querySelector('.waiting-message');
    if (waitingMessage) {
      waitingMessage.remove();
    }

    const noAnswersMessage = document.createElement('div');
    noAnswersMessage.className = 'no-answers-message';
    noAnswersMessage.style.cssText = 'text-align: center; padding: 2rem; color: #666; width: 100%;';
    noAnswersMessage.textContent = 'Waiting for players to submit answers...';

    if (buttonContainer) {
      container.insertBefore(noAnswersMessage, buttonContainer);
    } else {
      container.appendChild(noAnswersMessage);
    }
  }

  // Update question count display
  updateClueQuestionCount(current, total) {
    const questionNumberElement = document.querySelector(
      '#clue-answers .timer-header .number',
    );
    if (questionNumberElement) {
      const formatNumber = (num) => num.toString().padStart(2, '0');
      questionNumberElement.textContent = `${formatNumber(current)} of ${formatNumber(total)}`;
    }
  }

  // Update navigation buttons state
  updateClueNavigationButtons() {
    const previousButton = document.querySelector('.question-previous-button');
    const nextButton = document.querySelector('.question-next-button');

    const isFirstPlayer = this.currentCluePlayerIndex <= 0;
    const isLastPlayer = this.currentCluePlayerIndex >= this.clueAnswersPlayers.length - 1;

    if (previousButton) {
      previousButton.disabled = isFirstPlayer;
      previousButton.style.opacity = isFirstPlayer ? '0.5' : '1';
    }

    if (nextButton) {
      nextButton.disabled = isLastPlayer;
      nextButton.style.opacity = isLastPlayer ? '0.5' : '1';
    }
  }

  // Navigate to previous player's question
  goToPreviousCluePlayer() {
    if (this.currentCluePlayerIndex > 0) {
      this.currentCluePlayerIndex--;
      if (this.gameEngine.players) {
        this.updateClueAnswers(this.gameEngine.players);
      }
    }
  }

  // Navigate to next player's question
  goToNextCluePlayer() {
    if (
      this.currentCluePlayerIndex
      < this.clueAnswersPlayers.length - 1
    ) {
      this.currentCluePlayerIndex += 1;
      if (this.gameEngine.players) {
        this.updateClueAnswers(this.gameEngine.players);
      }
    }
  }

  // Update points display in UI
  updatePointsDisplay(points, players) {
    // Update points in player list if visible
    const playersList = document.querySelector('.players-list');
    if (playersList && players) {
      players.forEach((player) => {
        const playerElement = playersList.querySelector(
          `[data-player-id="${player.id}"]`,
        );
        if (playerElement) {
          const pointsElement = playerElement.querySelector('.player-points');
          const playerPoints = points[player.id] || 0;

          if (pointsElement) {
            pointsElement.textContent = `${playerPoints} pts`;
          } else {
            // Create points element if it doesn't exist
            const pointsDiv = document.createElement('div');
            pointsDiv.className = 'player-points';
            pointsDiv.textContent = `${playerPoints} pts`;
            playerElement.appendChild(pointsDiv);
          }
        }
      });
    }

    // Update leaderboard if visible
    const leaderboardSection = document.getElementById('leaderboard');
    if (leaderboardSection) {
      this.updateLeaderboard(points, players);
    }

    // Update winner section if visible
    const winnerSection = document.getElementById('winner');
    if (winnerSection) {
      this.updateWinnerSection(points, players);
    }
  }

  // Update leaderboard with points
  updateLeaderboard(points, players) {
    if (!players || !points) return;

    const leaderboardSection = document.getElementById('leaderboard');
    if (!leaderboardSection) return;

    // Get current player's socket ID
    const socket = this.gameEngine.socketHandler.getSocket();
    const currentPlayerId = socket?.id;

    // Create sorted leaderboard (highest points first)
    const leaderboardData = players
      .map((player) => ({
        ...player,
        points: points[player.id] || 0,
      }))
      .sort((a, b) => b.points - a.points);

    // Find current player's rank
    const currentPlayerIndex = leaderboardData.findIndex(
      (p) => p.id === currentPlayerId,
    );
    const currentPlayerRank = currentPlayerIndex >= 0 ? currentPlayerIndex + 1 : null;
    const currentPlayer = currentPlayerIndex >= 0 ? leaderboardData[currentPlayerIndex] : null;

    // Calculate percentage of players doing worse than current player
    let betterThanPercentage = 0;
    if (currentPlayerRank && players.length > 1) {
      const playersBelow = players.length - currentPlayerRank;
      betterThanPercentage = Math.round((playersBelow / (players.length - 1)) * 100);
    }

    // Update note card
    const noteCard = leaderboardSection.querySelector('.note-card');
    if (noteCard && currentPlayerRank) {
      const numberElement = noteCard.querySelector('.number');
      const textElement = noteCard.querySelector('.text');

      if (numberElement) {
        numberElement.textContent = `#${currentPlayerRank}`;
      }

      if (textElement) {
        textElement.textContent = `You are doing better than ${betterThanPercentage}% of other players!`;
      }
    }

    // Update podium (top 3 players)
    this.updatePodium(leaderboardSection, leaderboardData);

    // Update rankings table
    this.updateRankingsTable(leaderboardSection, leaderboardData, currentPlayerId);
  }

  // Update podium with top 3 players
  updatePodium(container, leaderboardData) {
    const podiumContainer = container.querySelector('.podium-container');
    if (!podiumContainer) return;

    const podium = podiumContainer.querySelector('.podium');
    if (!podium) return;

    // Get top 3 players
    const top3 = leaderboardData.slice(0, 3);

    // Clear existing podium stages
    const existingStages = podium.querySelectorAll('.podium-stage');
    existingStages.forEach((stage) => stage.remove());

    // Create podium stages in order: 2nd (left), 1st (center), 3rd (right)
    const podiumOrder = [
      { player: top3[1], place: 'second-place', rank: 2 }, // 2nd place (left)
      { player: top3[0], place: 'first-place', rank: 1 }, // 1st place (center)
      { player: top3[2], place: 'third-place', rank: 3 }, // 3rd place (right)
    ];

    podiumOrder.forEach(({ player, place, rank }) => {
      if (!player) return; // Skip if less than 3 players

      const podiumStage = document.createElement('div');
      podiumStage.className = `podium-stage ${place}`;

      // Add crown icon for 1st place
      const crownIcon = rank === 1
        ? `<div class="crown-icon">
            <img src="./icons/crown.svg" alt="Crown Icon" />
           </div>`
        : '';

      podiumStage.innerHTML = `
        <div class="player-profile">
          ${crownIcon}
          <div class="profile-image">
            <img src="./icons/image2.png" alt="${player.username}" />
          </div>
          <div class="player-name">${player.username}</div>
        </div>
        <div class="podium-block">
          <div class="podium-number">${rank}</div>
        </div>
      `;

      podium.appendChild(podiumStage);
    });
  }

  // Shuffle array using Fisher-Yates algorithm
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Update rankings table
  updateRankingsTable(container, leaderboardData, currentPlayerId) {
    const rankingsTable = container.querySelector('.rankings-table');
    if (!rankingsTable) return;

    // Clear existing ranking items (keep header)
    const existingItems = rankingsTable.querySelectorAll('.rankings-item');
    existingItems.forEach((item) => item.remove());

    const loadMoreButton = container.querySelector('.load-more-button');

    // Attach rank to each player object for consistent display
    const rankedPlayers = leaderboardData.map((p, i) => ({ ...p, rank: i + 1 }));

    // Initially show top 3 players plus current player if they are not in top 3
    const initialShowCount = 3;
    let visiblePlayers = [];
    let hiddenPlayers = [];

    const currentPlayerIndex = rankedPlayers.findIndex((p) => p.id === currentPlayerId);
    const isCurrentPlayerInTop3 = currentPlayerIndex < initialShowCount;

    if (rankedPlayers.length <= initialShowCount) {
      // Less than or equal to 3 players: show everyone
      visiblePlayers = rankedPlayers;
      if (loadMoreButton) loadMoreButton.style.display = 'none';
    } else {
      // More than 3 players
      visiblePlayers = rankedPlayers.slice(0, initialShowCount);
      hiddenPlayers = rankedPlayers.slice(initialShowCount);

      if (!isCurrentPlayerInTop3 && currentPlayerIndex !== -1) {
        // If current player is beyond rank 3, show them too initially
        const currentPlayerObj = rankedPlayers[currentPlayerIndex];

        // Remove current player from hidden list to avoid duplication
        hiddenPlayers = hiddenPlayers.filter((p) => p.id !== currentPlayerId);

        visiblePlayers.push(currentPlayerObj);
      }

      if (loadMoreButton) {
        if (hiddenPlayers.length > 0) {
          loadMoreButton.style.display = 'block';

          // Clone to clear old listeners
          const newButton = loadMoreButton.cloneNode(true);
          loadMoreButton.parentNode.replaceChild(newButton, loadMoreButton);

          newButton.addEventListener('click', () => {
            // On click, reload the ENTIRE table with all players in correct order
            this.renderRankingItems(rankingsTable, rankedPlayers, currentPlayerId, true);
            newButton.style.display = 'none';
          });
        } else {
          loadMoreButton.style.display = 'none';
        }
      }
    }

    // Render initial visible items
    this.renderRankingItems(rankingsTable, visiblePlayers, currentPlayerId, true);
  }

  // Helper to render ranking items
  renderRankingItems(table, players, currentPlayerId, shouldClear = false) {
    if (shouldClear) {
      // Clear existing items EXCEPT the header
      const existingItems = table.querySelectorAll('.rankings-item');
      existingItems.forEach((item) => item.remove());
    }

    players.forEach((player) => {
      const isCurrentPlayer = player.id === currentPlayerId;

      const rankingsItem = document.createElement('div');
      rankingsItem.className = 'rankings-item';
      if (isCurrentPlayer) {
        rankingsItem.classList.add('active');
      }

      rankingsItem.innerHTML = `
        <div class="cell">${player.rank.toString().padStart(2, '0')}</div>
        <div class="cell user-info">
          <div class="avatar">
            <img src="./icons/image2.png" alt="Player Avatar" />
          </div>
          <div class="name">${player.username}</div>
        </div>
        <div class="cell">${player.points}</div>
      `;

      table.appendChild(rankingsItem);
    });
  }

  // Update winner section with points and ranking
  updateWinnerSection(points, players) {
    const winnerSection = document.getElementById('winner');
    if (!winnerSection || !players || !points) return;

    // Create sorted ranking (highest points first)
    const rankingData = players
      .map((player) => ({
        ...player,
        points: points[player.id] || 0,
      }))
      .sort((a, b) => b.points - a.points);

    // Get winner(s) - players with highest points
    const maxPoints = rankingData[0]?.points || 0;
    const winners = rankingData.filter((p) => p.points === maxPoints);

    // Update winner announcement
    const secretWordText = winnerSection.querySelector(
      '.secrect-card .secret-word-text',
    );
    if (secretWordText) {
      if (winners.length === 1) {
        secretWordText.textContent = `${winners[0].username} is the winner`;
      } else if (winners.length > 1) {
        // Handle ties
        const winnerNames = winners.map((w) => w.username).join(', ');
        secretWordText.textContent = `${winnerNames} are the winners`;
      } else {
        secretWordText.textContent = 'No winner yet';
      }
    }

    // Update ranking table
    const resultsTable = winnerSection.querySelector('.results-table');
    if (resultsTable) {
      // Clear existing result items (keep header)
      const existingItems = resultsTable.querySelectorAll('.result-item');
      existingItems.forEach((item) => item.remove());

      // Get current player ID
      const socket = this.gameEngine.socketHandler.getSocket();
      const currentPlayerId = socket?.id;

      // Render ranking items
      rankingData.forEach((player, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        // Mark current user as active instead of winner
        const isCurrentPlayer = player.id === currentPlayerId;
        if (isCurrentPlayer) {
          resultItem.classList.add('active');
        }

        resultItem.innerHTML = `
          <div class="cell">${player.username}</div>
          <div class="cell">${player.points}</div>
        `;
        resultsTable.appendChild(resultItem);
      });
    }
  }

  // dark answers
  updateRevealResults(points = {}, players = []) {
    const revealSection = document.getElementById('reveal-answer');
    if (!revealSection) {
      console.warn('Reveal Answer section not found');
      return;
    }

    const resultsTable = revealSection.querySelector('.results-table');
    if (!resultsTable) {
      console.warn('Reveal results table not found');
      return;
    }

    // Keep header, clear previous rows
    const oldItems = resultsTable.querySelectorAll('.result-item');
    oldItems.forEach((el) => el.remove());

    if (!Array.isArray(players) || players.length === 0) {
      console.warn('No players available for reveal results');
      return;
    }

    // Combine votes or points
    const results = players.map((p) => ({
      id: p.id,
      username: p.username,
      score: typeof p.votes === 'number' ? p.votes : (points[p.id] || 0),
    }));

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    // Create result-item rows
    const socket = this.gameEngine.socketHandler.getSocket();
    results.forEach((player) => {
      const row = document.createElement('div');
      row.classList.add('result-item');
      if (socket && player.id === socket.id) {
        row.classList.add('active');
      }

      row.innerHTML = `
        <div class="cell">${player.username}</div>
        <div class="cell">${player.score}</div>
      `;
      resultsTable.appendChild(row);
    });

    console.log('Reveal Answer results updated:', results);
  }

  // Update spot dark button visibility based on host status
  updateSpotDarkButtonVisibility() {
    const spotDarkButton = document.querySelector('.spot-dark-button');
    const buttonContainer = spotDarkButton?.closest('.button');

    if (spotDarkButton) {
      if (this.gameEngine.isHost) {
        spotDarkButton.style.display = 'flex';
        if (buttonContainer) {
          buttonContainer.style.display = 'flex';
        }
      } else {
        spotDarkButton.style.display = 'none';
        if (buttonContainer) {
          buttonContainer.style.display = 'none';
        }
      }
    }
  }

  // Update category button visibility based on host status
  updateCategoryButtonVisibility() {
    const categoryButton = document.querySelector(
      '#game-room-details .start-game-button',
    );
    if (categoryButton) {
      if (this.gameEngine.isHost) {
        categoryButton.style.display = 'block';
      } else {
        categoryButton.style.display = 'none';
      }
    }
  }
}
