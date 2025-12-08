export default function decorate(block) {
  const childDivs = block.querySelectorAll(':scope > div');

  const firstChild = childDivs[0];
  firstChild.className = 'icons-link-title';

  const container = document.createElement('div');
  container.classList.add('icons-link-list');

  [...childDivs].slice(1).forEach((childDiv) => {
    childDiv.classList.add('icons-link-item');
    const pTagAnchor = childDiv.querySelector('div:first-child p');
    const anchorTag = childDiv.querySelector('a');
    const pictureTag = childDiv.querySelector('picture');
    const imgTag = pictureTag.querySelector('img');
    if (anchorTag && pictureTag) {
      anchorTag.classList.add('icons-link-content');
      if (imgTag) {
        anchorTag.innerHTML = '';
        anchorTag.appendChild(imgTag);
        pTagAnchor.replaceWith(anchorTag);
        const pTag = childDiv.querySelector('p');
        if (pTag) {
          const altText = pTag.textContent.trim();
          imgTag.alt = altText;
          anchorTag.setAttribute('title', altText);
          pTag.parentElement.remove();
        }
        pictureTag.parentElement.remove();
      }
    } else if (pictureTag && pictureTag) {
      pictureTag.querySelectorAll('source').forEach((source) => source.remove());
      pictureTag.replaceWith(imgTag);
      const pTag = childDiv.querySelector('p');
      if (imgTag && pTag) {
        const altText = pTag.textContent.trim();
        imgTag.alt = altText;
        anchorTag.setAttribute('title', altText);
        pTag.parentElement.remove();
      }
    }
    container.appendChild(childDiv);
  });
  block.appendChild(container);
  if (!firstChild.querySelector('p')) {
    firstChild.style.display = 'none';
  }
}
