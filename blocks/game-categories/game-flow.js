// Build complete game HTML
export function buildGameHTML() {
  return `
    ${buildGameRoomCreation()}
    ${buildGameRoomJoining()}
    ${buildGameRoomDetails()}
    ${buildChooseCategory()}
    ${buildClueReady()}
    ${buildYoureInDark()}
    ${buildCategoryQuestion(1)}
    ${buildCategoryQuestion(2)}
    ${buildDarkQuestion(1)}
    ${buildDarkQuestion(2)}
    ${buildPlayerAnswers()}
    ${buildWhoIsInDark()}
    ${buildClueAnswers()}
    ${buildRevealAnswer()}
    ${buildWinner()}
    ${buildLeaderboard()}
    ${notQualifiedPopup()}
  `;
}

function buildGameRoomCreation() {
  return `
    <section id="game-room-creation" class="game-room-layout">
      <div class="title">
        <span class="username-display">You</span> have <br />
        <span class="yellow">Created Room</span>
      </div>
      <div class="sub-title">
        Share this code with your family members or friends
      </div>
      <div class="wrapper">
        <div class="content creation">
          <h3 class="code-text">Room Code</h3>
          <div class="code-container">
            <span class="room-code">ABCD12</span>
            <div class="copy-icon">
              <img src="./icons/copy.svg" alt="copy"/>
            </div>
          </div>
          <p>Friends can use this code to join your room</p>
          <div class="buttons">
            <button class="share-button">
              <span>SHARE ON WHATSAPP</span>
              <div class="arrow-right">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
            </button>
            <button class="start-button">CONTINUE TO GAME</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildGameRoomJoining() {
  return `
    <section id="game-room-joining" class="game-room-layout">
      <div class="title">
        Host has created a <br />
        <span class="yellow">Room</span>
      </div>
      <div class="sub-title">
        Enter the code to join your friends
      </div>
      <div class="wrapper">
        <div class="content joining">
          <h3>Join Room</h3>
          <p>Enter Code to Join the Room</p>
          <div class="input-container">
            <input
              type="text"
              class="room-code-input"
              maxlength="6"
              autocomplete="off"
              placeholder=""
            />
          </div>
          <span class="error-message" style="display: none;"></span>
          <div class="buttons">
            <button class="join-button" disabled>CONTINUE</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildGameRoomDetails() {
  return `
    <section id="game-room-details" class="game-room-layout">
      <div class="title">Waiting for <span class="yellow">Squad</span></div>
      <div class="sub-title">Hang tight, another player is on the way!</div>
      <div class="wrapper">
        <div class="content details">
          <h3 class="code-text">Room Code</h3>
          <p class="code">ABCD12</p>
          <div class="actions">
            <div class="copy">
              <div class="copy-icon">
                <img src="./icons/copy2.svg" alt="copy"/>
              </div>
              <span>Copy Code</span>
            </div>
            <div class="separator"></div>
            <div class="share">
              <div class="share-icon">
                <img src="./icons/share.svg" alt="share"/>
              </div>
              <span>Share Code</span>
            </div>
          </div>
          <h3 class="players-in-lobby">
            Players in <span class="red">Lobby</span>
          </h3>
          <p class="players-gathered">Players gathered in the lobby</p>
          <div class="players-cards">
            <!-- Players will be dynamically inserted -->
          </div>
          <div class="button">
            <button class="start-game-button">CHOOSE CATEGORY</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildChooseCategory() {
  return `
    <section id="choose-game-category" class="game-room-layout">
      <div class="title">Choose a <span class="yellow">Category</span></div>
      <div class="sub-title">Find the topic that fits your game</div>
      <div class="wrapper">
        <div class="content game-category">
          <div class="categories-cards">
            <!-- Categories will be dynamically rendered by GameCategoryManager -->
          </div>
          <div class="button">
            <button class="lets-start-button" disabled>LET'S START</button>
          </div>
           <div class="non-host-waiting-msg" style="display: none;">
              Waiting for HOST to choose the category
            </div>
        </div>
      </div>
    </section>
  `;
}

function buildClueReady() {
  return `
    <section id="clue-is-ready" class="game-room-layout">
      <div class="title">Your Clue is <span class="yellow">Ready</span></div>
      <div class="sub-title">One step closer to the right answer</div>
      <div class="wrapper">
        <div class="content clue-ready">
          <div class="image-container">
            <div class="image">
              <img src="./icons/objects.png" alt="Clue Image" />
            </div>
          </div>
          <h3 class="clue-text">CUPCAKE</h3>
          <div class="button">
            <button class="ready-button">OK, I AM READY</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildYoureInDark() {
  return `
    <section id="youre-in-the-dark" class="game-room-layout">
      <div class="title">You're in the <span class="yellow">Dark</span></div>
      <div class="sub-title">
        Everyone else knows the clue… <br />
        except you
      </div>
      <div class="wrapper">
        <div class="content youre-in-the-dark">
          <div class="image-container">
            <div class="image">
              <img src="./icons/dark.png" alt="Dark Room Image" />
            </div>
          </div>
          <h3 class="dark-text">You're in the Dark</h3>
          <div class="button">
            <button class="dark-ready-button">OK, I AM READY</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildCategoryQuestion(questionNum) {
  const questions = {
    1: "What's your favorite food in this category?",
    2: 'When would you typically eat this type of food?',
  };

  return `
    <section id="category-question-${questionNum}" class="game-question">
      <div class="question-timer">
        <div class="counter-down">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
            <circle cx="10" cy="10" r="9" stroke="currentColor" fill="none" stroke-width="2"/>
            <path d="M10 5v5l3 3" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          <span>30 sec</span>
        </div>
        <div class="timer-bar">
          <div class="timer-fill"></div>
        </div>
      </div>
      
      <div class="question-category">
        <div class="container">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
            <circle cx="7" cy="7" r="6"/>
          </svg>
          <span>Food</span>
        </div>
      </div>
      
      <div class="note">
        <div class="note-container">
          <div class="tube-icon">
            <img src="./icons/tubelight.svg" alt="tube" />
          </div>
          <p class="text">
            Answer questions about this category; think creatively!
          </p>
        </div>
      </div>
      
      <div class="question-content">
        <img class="question-icon" src="./icons/question.svg" alt="question mark">
        <h2 class="question-text">
          ${questions[questionNum]}
        </h2>
        <div class="question-input">
          <label for="answer" class="input-label">Your Answer:</label>
          <input
            type="text"
            class="answer-input"
            maxlength="30"
            autocomplete="off"
          />
          <p class="char-count">0/30 characters</p>
        </div>
        <div class="button">
          <button class="${questionNum === 2 ? 'save-next-button' : 'next-button'}">
            ${questionNum === 2 ? 'SAVE AND NEXT' : 'NEXT'}
          </button>
        </div>
      </div>
      <div class="squad-status">
          <div class="content">
            <div class="title">Check Who’s <span class="red">In</span></div>
            <div class="sub-title">
              Track who’s done and who’s<br />
              still thinking
            </div>
            <div class="squad-container">
              <div class="squad-card">
                <div class="user-info">
                  <div class="squad-card-icon">
                    <img src="./icons/image.png" alt="User Icon" />
                  </div>
                  <div class="squad-card-name">Rajat Saini</div>
                </div>
                <div class="squad-card-status">Submitted</div>
              </div>
              <div class="squad-card">
                <div class="user-info">
                  <div class="squad-card-icon">
                    <img src="./icons/image2.png" alt="User Icon" />
                  </div>
                  <div class="squad-card-name">Minakshi Pandey</div>
                </div>
                <div class="squad-card-status">Not Yet</div>
              </div>
              <div class="squad-card">
                <div class="user-info">
                  <div class="squad-card-icon">
                    <img src="./icons/image3.png" alt="User Icon" />
                  </div>
                  <div class="squad-card-name">Meher Sharma</div>
                </div>
                <div class="squad-card-status">Submitted</div>
              </div>
            </div>
          </div>
        </div>
    </section>
  `;
}

function buildDarkQuestion(questionNum) {
  const questions = {
    1: 'What food would you pair this dish with?',
    2: 'What time of the day would you have this dish?',
  };

  return `
    <section id="dark-question-${questionNum}" class="game-question">
      <div class="question-timer">
        <div class="counter-down">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
            <circle cx="10" cy="10" r="9" stroke="currentColor" fill="none" stroke-width="2"/>
            <path d="M10 5v5l3 3" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          <span>30 sec</span>
        </div>
        <div class="timer-bar">
          <div class="timer-fill"></div>
        </div>
      </div>
      
      <div class="question-category">
        <div class="container">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
            <circle cx="7" cy="7" r="6"/>
          </svg>
          <span>Food</span>
        </div>
      </div>
      
      <div class="note">
        <div class="note-container">
          <div class="target-icon">
            <img class="target-icon" src="./icons/target.svg" alt="question mark">
          </div>
          <p class="text">
            Answer questions on this word; beware the ignorant player!
          </p>
        </div>
      </div>
      
      <div class="question-content">
        <img class="question-icon" src="./icons/question.svg" alt="question mark">
        <h2 class="question-text">
          ${questions[questionNum]}
        </h2>
        <div class="question-input">
          <label for="answer" class="input-label">Your Answer:</label>
          <input
            type="text"
            class="answer-input"
            maxlength="30"
            autocomplete="off"
          />
          <p class="char-count">0/30 characters</p>
        </div>
        <div class="button">
          <button class="${questionNum === 2 ? 'save-next-button' : 'next-button'}">
            ${questionNum === 2 ? 'SAVE AND NEXT' : 'NEXT'}
          </button>
        </div>
      </div>
    </section>
  `;
}

function buildPlayerAnswers() {
  return `
    <section id="player-answers" class="game-question">
      <div class="question-category">
        <div class="container">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
            <circle cx="7" cy="7" r="6"/>
          </svg>
          <span>Food</span>
        </div>
      </div>
      
      <div class="note">
        <div class="note-container">
          <div class="target-icon">
            <img class="target-icon" src="./icons/target.svg" alt="question mark">
          </div>
          <p class="text">
            Answer questions on this word; beware the ignorant player!
          </p>
        </div>
      </div>
      
      <div class="question-content answers">
        <h2 class="question-text">Player Answers</h2>
        <div class="answers-container">
          <!-- Answers will be dynamically inserted -->
        </div>
        <div class="button">
          <button class="spot-dark-button">SPOT THE DARK ONE</button>
        </div>
      </div>
    </section>
  `;
}

function buildWhoIsInDark() {
  return `
    <section id="who-is-in-the-dark" class="game-room-layout">
      <div class="title">Who's in the <span class="yellow">Dark</span></div>
      <div class="sub-title">
        Vote for who you think doesn't <br />
        know the word!
      </div>
      <div class="wrapper">
        <div class="content who-is-in-the-dark">
          <div class="mystery-players">
            <h3>Find the Mystery Player</h3>
            <div class="players">
              <div class="player">
                <div class="name">Player 1</div>
                <div class="checkbox">
                  <input type="radio" name="player" id="player1" />
                </div>
              </div>
              <div class="player">
                <div class="name">Player 2</div>
                <div class="checkbox">
                  <input type="radio" name="player" id="player2" />
                </div>
              </div>
              <div class="player">
                <div class="name">Player 3</div>
                <div class="checkbox">
                  <input type="radio" name="player" id="player3" />
                </div>
              </div>
            </div>
          </div>
          <div class="button">
            <button class="submit-button">SUBMIT</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildClueAnswers() {
  return `
    <section id="clue-answers" class="game-room-result-layout">
      <div class="wrapper">
        <div class="question-timer">
          <div class="timer-header">
            <p class="number">01 of 03</p>
            <div class="counter-down">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#ED710A">
                <circle cx="10" cy="10" r="9" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
              <span>01:00</span>
            </div>
          </div>
          <div class="timer-bar">
            <div class="timer-fill"></div>
          </div>
        </div>
        
        <div class="content clue-answers">
          <div class="clue-answers-container">
            <div class="title">What is Player's favorite food?</div>
            <div class="clue-answer-card">
              <div class="anwer">Gulab Jamun</div>
              <div class="radio-button">
                <input type="radio" name="clue-answer" id="clue-answer-1" />
              </div>
            </div>
            <div class="clue-answer-card">
              <div class="anwer">Chicken Biryani</div>
              <div class="radio-button">
                <input type="radio" name="clue-answer" id="clue-answer-2" />
              </div>
            </div>
            <div class="clue-answer-card">
              <div class="anwer">Chole Bhature</div>
              <div class="radio-button">
                <input type="radio" name="clue-answer" id="clue-answer-3" />
              </div>
            </div>
            <div class="button">
              <button class="submit-button">SUBMIT</button>
            </div>
          </div>
          <div class="navigation-buttons">
            <button class="question-previous-button">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="#BB1F3B">
                <path d="M25 30l-10-10 10-10" stroke="currentColor" fill="none" stroke-width="3"/>
              </svg>
            </button>
            <button class="question-next-button">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="#BB1F3B">
                <path d="M15 30l10-10-10-10" stroke="currentColor" fill="none" stroke-width="3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildRevealAnswer() {
  return `
    <section id="reveal-answer" class="game-room-result-layout">
      <div class="wrapper">
        <div class="title">
          The Truth is <span class="yellow">Revealed</span>
        </div>
        <div class="sub-title">Time to see who was really in the dark</div>
        
        <div class="content reveal-answer">
          <div class="secrect-card">
            <p class="secret-word-text">The secret word was:</p>
            <img src="./icons/objects.png" alt="Secret Word" />
            <p class="secret-word">CUPCAKE</p>
          </div>
          
          <div class="player-in-the-dark">
          <div class="top-left-corner">
                <img src="./icons/mask-top-left.svg" alt="Top Left Corner" />
              </div>
            <div class="player-avatar">
              <img src="./icons/dark.png" alt="Player Avatar" />
            </div>
            <div class="text">
              Player was<br />in <span class="yellow">Dark</span>
            </div>
            <div class="bottom-right-corner">
                <img
                  src="./icons/mask-bottom-right.svg"
                  alt="Bottom Right Corner"
                />
              </div>
          </div>
          
          <div class="voting-results">
            <h3 class="title">Voting <span class="red">Results</span></h3>
            <h4 class="sub-title">See where you stand in this match</h4>
            <div class="results-table">
              <!-- Results will be dynamically inserted -->
            </div>
          </div>
          
          <div class="view-leadboard">
          <div class="top-left-corner">
                <img
                  src="./icons/mask-top-left_or.svg"
                  alt="Top Left Corner"
                />
              </div>
            <div class="text">Every points counts</div>
            <div class="button">
              <button class="view-leadboard-button">VIEW LEADERBOARD</button>
            </div>
            <div class="bottom-right-corner">
                <img
                  src="./icons/mask-bottom-right_or.svg"
                  alt="Bottom Right Corner"
                />
              </div>
          </div>
          
          <div class="buttons">
            <button class="new-game-button">NEW GAME</button>
            <button class="play-more-button">PLAY MORE</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildWinner() {
  return `
    <section id="winner" class="game-room-result-layout">
      <div class="wrapper">
        <div class="title">Who's <span class="yellow">Winning?</span></div>
        <div class="sub-title">Find out who's leading the match</div>
        
        <div class="content winner">
          <div class="secrect-card">
            <img src="./icons/trophy.svg" alt="Trophy" />
            <p class="secret-word">Congratulations!</p>
            <p class="secret-word-text">Winner is the champion</p>
          </div>
          
          <div class="voting-results">
            <h3 class="title">Match <span class="red">Ranking</span></h3>
            <h4 class="sub-title">See where you stand in this match</h4>
            <div class="results-table">
              <!-- Results will be dynamically inserted -->
            </div>
          </div>
          
          <div class="buttons">
            <button class="new-game-button">NEW GAME</button>
            <button class="play-more-button">PLAY MORE</button>
          </div>
          
          <div class="view-leadboard">
          <div class="top-left-corner">
                <img
                  src="./icons/mask-top-left_or.svg"
                  alt="Top Left Corner"
                />
              </div>
            <div class="text">
              Every points<br />
              counts
            </div>
            <div class="button">
              <button class="view-leadboard-button">VIEW LEADERBOARD</button>
            </div>
             <div class="bottom-right-corner">
                <img
                  src="./icons/mask-bottom-right_or.svg"
                  alt="Bottom Right Corner"
                />
              </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildLeaderboard() {
  return `
    <section id="leaderboard" class="game-room-result-layout">
      <div class="wrapper">
        <div class="title">Check <span class="yellow">Leaderboard</span></div>
        <div class="sub-title">Check the latest scores and positions</div>
        
        <div class="content leaderboard">
          <div class="note-card">
            <div class="number">#4</div>
            <p class="text">
              You are doing better than 60% of other players!
            </p>
          </div>

          <div class="podium-container">
              <div class="podium">
                <!-- 2nd Place (Left) -->
                <div class="podium-stage second-place">
                  <div class="player-profile">
                    <div class="profile-image">
                      <img src="./icons/image2.png" alt="Minakshi Pandey" />
                    </div>
                    <div class="player-name">Minakshi Pandey</div>
                  </div>
                  <div class="podium-block">
                    <div class="podium-number">2</div>
                  </div>
                </div>

                <!-- 1st Place (Center) -->
                <div class="podium-stage first-place">
                  <div class="player-profile">
                    <div class="crown-icon">
                      <img src="./icons/crown.svg" alt="Crown Icon" />
                    </div>
                    <div class="profile-image">
                      <img src="./icons/image2.png" alt="Rajat Saini" />
                    </div>
                    <div class="player-name">Rajat Saini</div>
                  </div>
                  <div class="podium-block">
                    <div class="podium-number">1</div>
                  </div>
                </div>

                <!-- 3rd Place (Right) -->
                <div class="podium-stage third-place">
                  <div class="player-profile">
                    <div class="profile-image">
                      <img src="./icons/image2.png" alt="Meher Sharma" />
                    </div>
                    <div class="player-name">Meher Sharma</div>
                  </div>
                  <div class="podium-block">
                    <div class="podium-number">3</div>
                  </div>
                </div>
              </div>
            </div>
          
          <div class="rankings">
            <div class="rankings-table">
              <div class="rankings-header">
                <div class="cell">Rank</div>
                <div class="cell">Name</div>
                <div class="cell">Points</div>
              </div>
              <div class="rankings-item">
                <div class="cell">01</div>
                <div class="cell user-info">
                  <div class="name">Player 1</div>
                </div>
                <div class="cell">100</div>
              </div>
              <div class="rankings-item">
                <div class="cell">02</div>
                <div class="cell user-info">
                  <div class="name">Player 2</div>
                </div>
                <div class="cell">90</div>
              </div>
              <div class="rankings-item active">
                <div class="cell">03</div>
                <div class="cell user-info">
                  <div class="name">You</div>
                </div>
                <div class="cell">80</div>
              </div>
            </div>
          </div>
          
          <div class="button">
            <button class="load-more-button">LOAD MORE</button>
          </div>

          <div class="buttons">
              <button class="new-game-button">NEW GAME</button>
              <button class="play-more-button">PLAY MORE</button>
            </div>
        </div>
      </div>
    </section>
  `;
}

function notQualifiedPopup() {
    return `
    <div id="not-qualified-popup" class="popup-overlay hidden">
      <div class="popup-content">
      <img class="close-popup" src="./icons/close.svg" alt="close"/>
        <div class="popup-header">
          <div class="img-container">
            <img src="./icons/alarm-clock.svg" alt="Alarm Clock Icon" class="popup-icon" />
          </div>
          <h3>Not Qualified</h3>
        </div>
        <p class="popup-message">
          Since you missed submitting your answer, you’re out for this round.
        </p>
        <button class="popup-button">I UNDERSTAND</button>
      </div>
    </div>

    <div id="room-closed-popup" class="popup hidden">
      <div class="popup-content">
          <h3>Game Ended</h3>
          <p>The host has ended the game.</p>
          <button id="popup-ok-button">OK</button>
      </div>
    </div>`;
}