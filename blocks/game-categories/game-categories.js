import { CreateElem } from '../../scripts/utils.js';

export default function decorate(block) {
  const allDivs = Array.from(block.children);

  const titleDiv = allDivs.shift();
  titleDiv.classList.add('game-category-title');

  const instructionsWrapper = CreateElem('div', 'game-instructions-list');

  allDivs.forEach((item) => {
    const instructionItem = CreateElem('div', 'game-instruction-item');
    const innerDivs = Array.from(item.children);

    const imageContainerDiv = innerDivs[0];
    const altTextDiv = innerDivs[1];
    const descriptionDiv = innerDivs[2];

    const picture = imageContainerDiv.querySelector('picture');
    const img = picture ? picture.querySelector('img') : imageContainerDiv.querySelector('img');

    const altText = altTextDiv?.querySelector('p')?.textContent?.trim() || '';
    if (img && altText) {
      img.setAttribute('alt', altText);
    }

    if (picture) picture.replaceWith(img);
    altTextDiv.remove();
    imageContainerDiv.className = 'game-instruction-item-image';

    descriptionDiv.className = 'game-instruction-item-description';
    instructionItem.append(imageContainerDiv, descriptionDiv);
    instructionsWrapper.append(instructionItem);
  });

  block.innerHTML = '';
  block.append(titleDiv, instructionsWrapper);
}
