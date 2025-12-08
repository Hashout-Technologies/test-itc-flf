// import { CreateElem } from '../../scripts/utils.js';

// export default function decorate(block) {
//   const allDivs = [...block.children];

//   const titleDiv = allDivs[0];
//   titleDiv.classList.add('game-category-title');

//   const instructionsWrapper = CreateElem('div', 'game-instructions-list');

//   allDivs.slice(1).forEach((item) => {
//     const instructionItem = CreateElem('div', 'game-instruction-item');
//     const innerDivs = [...item.children];

//     const imageContainerDiv = innerDivs[0];
//     const altTextDiv = innerDivs[1];
//     const descriptionDiv = innerDivs[2];

//     const picture = imageContainerDiv.querySelector('picture');
//     const img = picture ? picture.querySelector('img') : imageContainerDiv.querySelector('img');

//     const altText = altTextDiv?.querySelector('p')?.textContent?.trim() || '';
//     if (img && altText) {
//       img.setAttribute('alt', altText);
//     }

//     if (picture) picture.replaceWith(img);
//     altTextDiv.remove();
//     imageContainerDiv.className = 'game-instruction-item-image';

//     descriptionDiv.className = 'game-instruction-item-description';
//     instructionItem.append(imageContainerDiv, descriptionDiv);
//     instructionsWrapper.append(instructionItem);
//   });

//   block.append(instructionsWrapper);
// }
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
}
