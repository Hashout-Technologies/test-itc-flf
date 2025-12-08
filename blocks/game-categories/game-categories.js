import { CreateElem } from '../../scripts/utils.js';

export default function decorate(block) {
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
  const createRoomBtn = CreateElem('a', 'game-action-button create-room-btn', 'create-room-btn', 'Create Room');
  createRoomBtn.setAttribute('href', '#');

  const joinRoomBtn = CreateElem('a', 'game-action-button join-room-btn', 'join-room-btn', 'Join Room');
  joinRoomBtn.setAttribute('href', '#');

  buttonContainer.append(createRoomBtn, joinRoomBtn);

  block.append(buttonContainer);
}
