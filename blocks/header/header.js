import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const sidebar = document.querySelector('.nav-sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      // eslint-disable-next-line no-use-before-define
      toggleSidebar();
    }
  }
}

/**
 * Toggles the sidebar menu
 */
function toggleSidebar() {
  const sidebar = document.querySelector('.nav-sidebar');
  const hamburger = document.querySelector('.nav-hamburger button');
  const hamburgerIcon = hamburger.querySelector('.nav-icon-hamburger');
  const closeIcon = hamburger.querySelector('.nav-icon-close');
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    document.body.style.overflowY = '';
    hamburger.setAttribute('aria-label', 'Open navigation');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburgerIcon.style.display = 'block';
    closeIcon.style.display = 'none';
    window.removeEventListener('keydown', closeOnEscape);
  } else {
    sidebar.classList.add('open');
    document.body.style.overflowY = 'hidden';
    hamburger.setAttribute('aria-label', 'Close navigation');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburgerIcon.style.display = 'none';
    closeIcon.style.display = 'block';
    window.addEventListener('keydown', closeOnEscape);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const navTools = nav.querySelector('.nav-tools');
  const navSections = nav.querySelector('.nav-sections');

  if (navBrand) {
    const authoredLink = navBrand.querySelector('a');
    const authoredImage = navBrand.querySelector('picture');
    const img = authoredImage?.querySelector('img');

    const allParagraphs = Array.from(navBrand.querySelectorAll('p'));
    const altTextParam = allParagraphs.find((p) => !p.querySelector('a') && p.textContent.trim().length > 0);
    const altText = altTextParam ? altTextParam.textContent.trim() : 'Home';

    if (authoredLink && authoredImage) {
      const logoLink = document.createElement('a');
      logoLink.href = authoredLink.href;
      logoLink.title = altText;
      logoLink.className = 'nav-brand-logo-link';

      if (img) img.alt = altText;

      logoLink.append(authoredImage);
      navBrand.innerHTML = '';
      navBrand.append(logoLink);
    } else {
      const brandLink = navBrand.querySelector('.button');
      if (brandLink) {
        brandLink.className = '';
        brandLink.closest('.button-container').className = '';
      }
    }
  }

  if (navTools) {
    const toolsLink = navTools.querySelector('a');
    const toolsImage = navTools.querySelector('picture');
    const toolsImg = toolsImage?.querySelector('img');

    const toolsParagraphs = Array.from(navTools.querySelectorAll('p'));
    const toolsAltParam = toolsParagraphs.find((p) => !p.querySelector('a') && p.textContent.trim().length > 0);
    const toolsAltText = toolsAltParam ? toolsAltParam.textContent.trim() : 'Notifications';

    if (toolsLink && toolsImage) {
      const iconLink = document.createElement('a');
      iconLink.href = toolsLink.href;
      iconLink.title = toolsAltText;
      iconLink.className = 'nav-tools-icon-link';

      if (toolsImg) toolsImg.alt = toolsAltText;

      iconLink.append(toolsImage);
      navTools.innerHTML = '';
      navTools.append(iconLink);
    }
  }

  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav-sidebar');
  hamburgerButton.setAttribute('aria-label', 'Open navigation');
  hamburgerButton.setAttribute('aria-expanded', 'false');

  const iconContainer = document.createElement('span');
  iconContainer.classList.add('nav-hamburger-icon');

  const hamburgerIcon = document.createElement('img');
  const codeBasePath = window.hlx?.codeBasePath || '';
  hamburgerIcon.src = `${codeBasePath}/icons/align-left.png`;
  hamburgerIcon.alt = 'Menu';
  hamburgerIcon.classList.add('nav-icon-hamburger');

  const closeIcon = document.createElement('img');
  closeIcon.src = `${codeBasePath}/icons/close.svg`;
  closeIcon.alt = 'Close';
  closeIcon.classList.add('nav-icon-close');

  iconContainer.append(hamburgerIcon);
  iconContainer.append(closeIcon);
  hamburgerButton.append(iconContainer);
  hamburgerButton.addEventListener('click', toggleSidebar);
  hamburger.append(hamburgerButton);

  const sidebar = document.createElement('div');
  sidebar.classList.add('nav-sidebar');
  sidebar.id = 'nav-sidebar';

  if (navSections) {
    sidebar.append(navSections);

    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) {
        navSection.classList.add('nav-drop');
        navSection.addEventListener('click', () => {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
      }
    });

    const menuItems = navSections.querySelectorAll('.menu-list-box > div');
    menuItems.forEach((item) => {
      const picture = item.querySelector('picture');
      const link = item.querySelector('a');

      if (picture && link) {
        picture.style.cursor = 'pointer';

        picture.addEventListener('click', () => {
          window.location.href = link.href;
        });
      }
    });
  }

  const overlay = document.createElement('div');
  overlay.classList.add('nav-sidebar-overlay');
  overlay.addEventListener('click', toggleSidebar);

  nav.textContent = '';
  nav.append(hamburger);

  if (navBrand) {
    nav.append(navBrand);
  }

  if (navTools) {
    nav.append(navTools);
  }

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  navWrapper.append(sidebar);
  navWrapper.append(overlay);
  block.append(navWrapper);
}
