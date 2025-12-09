import { CreateElem } from '../../scripts/utils.js';
import { GameEngine } from '../../components/game/game-engine.js';
import { buildGameHTML } from './game-flow.js';
import { GAME_TYPES } from '../../components/game/game-config.js';

export default async function decorate(block) {
  const divs = [...block.children];

  const titleDiv = divs[0];
  titleDiv.classList.add('game-category-title');

  const instructionsWrapper = CreateElem('div', 'game-instructions-list');

  divs.slice(1).forEach((div) => {
    div.classList.add('game-instruction-item');

    const innerDivs = [...div.children];
    const imageContainer = innerDivs[0];
    const altDiv = innerDivs[1];
    const descDiv = innerDivs[2];

    imageContainer.classList.add('game-instruction-item-image');
    const picture = imageContainer.querySelector('picture');
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        picture.replaceWith(img);
      }
    }

    const altText = altDiv?.querySelector('p')?.textContent?.trim();
    if (altText) {
      const img = imageContainer.querySelector('img');
      if (img) img.alt = altText;
    }

    altDiv.remove();

    descDiv.classList.add('game-instruction-item-description');

    instructionsWrapper.append(div);
  });

  block.append(instructionsWrapper);

  const buttonContainer = CreateElem('div', 'game-actions');
  const createRoomBtn = CreateElem('button', 'game-action-button create-room-btn', 'create-room-btn', 'Create Room');

  const joinRoomBtn = CreateElem('button', 'game-action-button join-room-btn', 'join-room-btn', 'Join Room');

  buttonContainer.append(createRoomBtn, joinRoomBtn);

  block.append(buttonContainer);

  const html = buildGameHTML();
  const gameContainer = CreateElem('div', 'game-container');
  gameContainer.innerHTML = html;
  block.append(gameContainer);

  createRoomBtn.addEventListener('click', () => {
    const titleSection = block.querySelector('.game-category-title');
    const instructionsSection = block.querySelector('.game-instructions-list');
    if (titleSection) titleSection.style.display = 'none';
    if (instructionsSection) instructionsSection.style.display = 'none';
    buttonContainer.style.display = 'none';

    const roomCreationSection = block.querySelector('#game-room-creation');
    if (roomCreationSection) roomCreationSection.style.display = 'block';
  });

  joinRoomBtn.addEventListener('click', () => {
    const titleSection = block.querySelector('.game-category-title');
    const instructionsSection = block.querySelector('.game-instructions-list');
    if (titleSection) titleSection.style.display = 'none';
    if (instructionsSection) instructionsSection.style.display = 'none';
    buttonContainer.style.display = 'none';

    const roomJoiningSection = block.querySelector('#game-room-joining');
    if (roomJoiningSection) roomJoiningSection.style.display = 'block';
  });

  await new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });

  try {
    const gameEngine = new GameEngine(block);
    if (block.classList.contains('category-game')) {
      gameEngine.gameType = GAME_TYPES.CATEGORY_GAME;
    } else if (block.classList.contains('who-is-in-the-dark')) {
      gameEngine.gameType = GAME_TYPES.WHO_IS_IN_THE_DARK;
    } else {
      console.warn('Game type not detected from block class, defaulting to CATEGORY_GAME');
      gameEngine.gameType = GAME_TYPES.CATEGORY_GAME;
    }

    block.gameEngine = gameEngine;
    console.log('Games block initialized successfully with game type:', gameEngine.gameType);
  } catch (error) {
    console.error('Error initializing games block:', error);

    // Show fallback UI
    block.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
          <h2>Unable to load games</h2>
          <p>Please refresh the page or try again later.</p>
          <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem;">
            Refresh Page
          </button>
        </div>
      `;
  }
}
