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

  // decorate nav DOM
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

  // hamburger at start
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav-sidebar');
  hamburgerButton.setAttribute('aria-label', 'Open navigation');
  hamburgerButton.setAttribute('aria-expanded', 'false');

  // Create icon container
  const iconContainer = document.createElement('span');
  iconContainer.classList.add('nav-hamburger-icon');

  // Create hamburger icon
  const hamburgerIcon = document.createElement('img');
  const codeBasePath = window.hlx?.codeBasePath || '';
  hamburgerIcon.src = `${codeBasePath}/icons/align-left.png`;
  hamburgerIcon.alt = 'Menu';
  hamburgerIcon.classList.add('nav-icon-hamburger');

  // Create close icon
  const closeIcon = document.createElement('img');
  closeIcon.src = `${codeBasePath}/icons/close.svg`;
  closeIcon.alt = 'Close';
  closeIcon.classList.add('nav-icon-close');

  iconContainer.append(hamburgerIcon);
  iconContainer.append(closeIcon);
  hamburgerButton.append(iconContainer);
  hamburgerButton.addEventListener('click', toggleSidebar);
  hamburger.append(hamburgerButton);

  // Create sidebar for navigation sections
  const sidebar = document.createElement('div');
  sidebar.classList.add('nav-sidebar');
  sidebar.id = 'nav-sidebar';

  // Create sidebar footer
  const sidebarFooter = document.createElement('div');
  sidebarFooter.classList.add('nav-sidebar-footer');

  // Background pattern
  const bgPatternContainer = document.createElement('div');
  bgPatternContainer.style.backgroundColor = '#f37906';
  bgPatternContainer.classList.add('background-pattern-container');
  bgPatternContainer.setAttribute('data-bg-color', '#F37906');

  const bgPattern = document.createElement('div');
  bgPattern.classList.add('background-pattern');

  const curveImg = document.createElement('img');
  curveImg.src = `${codeBasePath}/icons/scalloped-curve_beige.svg`;
  curveImg.alt = '';
  curveImg.setAttribute('fetchpriority', 'high');
  curveImg.setAttribute('decoding', 'async');
  curveImg.classList.add('curve-img');
  bgPattern.append(curveImg);

  // ITC Footer
  const itcFooter = document.createElement('div');
  itcFooter.classList.add('itc-footer');

  // Brand section
  const footerBrand = document.createElement('div');
  footerBrand.classList.add('itc-footer__brand');
  const footerLogo = document.createElement('div');
  footerLogo.classList.add('itc-footer__logo');
  const logoImg = document.createElement('img');
  logoImg.src = `${codeBasePath}/icons/itc-logo-white.webp`;
  logoImg.alt = 'ITC Logo';
  footerLogo.append(logoImg);
  footerBrand.append(footerLogo);
  itcFooter.append(footerBrand);

  // Navigation section
  const footerNav = document.createElement('div');
  footerNav.classList.add('itc-footer__nav');

  const navColumn1 = document.createElement('div');
  navColumn1.classList.add('itc-footer__nav-column');
  const links1 = [
    { href: '/about', text: 'About us' },
    { href: '/terms', text: 'Terms and Conditions' },
    { href: '/privacy', text: 'Privacy Policy' },
  ];
  links1.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.href;
    a.classList.add('itc-footer__link');
    a.textContent = link.text;
    navColumn1.append(a);
  });

  const navSeparator = document.createElement('div');
  navSeparator.classList.add('itc-footer__nav-separator');

  const navColumn2 = document.createElement('div');
  navColumn2.classList.add('itc-footer__nav-column');
  const links2 = [
    { href: '/contact', text: 'Contact us' },
    { href: '/sitemap', text: 'Sitemap' },
    { href: '/faq', text: "FAQ's" },
  ];
  links2.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.href;
    a.classList.add('itc-footer__link');
    a.textContent = link.text;
    navColumn2.append(a);
  });

  footerNav.append(navColumn1);
  footerNav.append(navSeparator);
  footerNav.append(navColumn2);
  itcFooter.append(footerNav);

  // Social media
  const footerSocial = document.createElement('div');
  footerSocial.classList.add('itc-footer__social');
  const socialTitle = document.createElement('h3');
  socialTitle.classList.add('itc-footer__social-title');
  socialTitle.textContent = 'Follow us on';
  footerSocial.append(socialTitle);

  const socialIcons = document.createElement('div');
  socialIcons.classList.add('itc-footer__social-icons');

  const fbIcon = document.createElement('a');
  fbIcon.href = '#';
  fbIcon.classList.add('itc-footer__social-icon');
  fbIcon.setAttribute('aria-label', 'Facebook');
  fbIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>';
  socialIcons.append(fbIcon);

  const igIcon = document.createElement('a');
  igIcon.href = '#';
  igIcon.classList.add('itc-footer__social-icon');
  igIcon.setAttribute('aria-label', 'Instagram');
  igIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>';
  socialIcons.append(igIcon);

  const ytIcon = document.createElement('a');
  ytIcon.href = '#';
  ytIcon.classList.add('itc-footer__social-icon');
  ytIcon.setAttribute('aria-label', 'YouTube');
  ytIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75,15.02 15.5,11.75 9.75,8.48"></polygon></svg>';
  socialIcons.append(ytIcon);

  footerSocial.append(socialIcons);
  itcFooter.append(footerSocial);

  // Footer links
  const footerLinks = document.createElement('div');
  footerLinks.classList.add('itc-footer__links');
  const portalLink = document.createElement('a');
  portalLink.href = '/portal';
  portalLink.classList.add('itc-footer__footer-link');
  portalLink.textContent = 'ITC Portal';
  const linkSeparator = document.createElement('div');
  linkSeparator.classList.add('itc-footer__link-separator');
  const estoreLink = document.createElement('a');
  estoreLink.href = '/estore';
  estoreLink.classList.add('itc-footer__footer-link');
  estoreLink.textContent = 'ITC eStore';
  footerLinks.append(portalLink);
  footerLinks.append(linkSeparator);
  footerLinks.append(estoreLink);
  itcFooter.append(footerLinks);

  // Copyright
  const footerCopyright = document.createElement('div');
  footerCopyright.classList.add('itc-footer__copyright');
  const copyrightP = document.createElement('p');
  copyrightP.textContent = '© 2024 Sunfeast. All Rights Reserved.';
  footerCopyright.append(copyrightP);
  itcFooter.append(footerCopyright);

  bgPattern.append(itcFooter);
  bgPatternContainer.append(bgPattern);
  sidebarFooter.append(bgPatternContainer);

  if (navSections) {
    // Move nav sections to sidebar
    sidebar.append(navSections);

    // Handle dropdowns in sidebar
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) {
        navSection.classList.add('nav-drop');
        navSection.addEventListener('click', () => {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
      }
    });

    // Select the wrapper divs in the menu list
    const menuItems = navSections.querySelectorAll('.menu-list-box > div');
    menuItems.forEach((item) => {
      // Find the image and the text link within this item
      const picture = item.querySelector('picture');
      const link = item.querySelector('a');

      if (picture && link) {
        // Add cursor style so it looks clickable
        picture.style.cursor = 'pointer';

        // Add click event to navigate to the link's href
        picture.addEventListener('click', () => {
          window.location.href = link.href;
        });
      }
    });
  }

  // Append sidebar footer to sidebar
  sidebar.append(sidebarFooter);

  // Add overlay for sidebar
  const overlay = document.createElement('div');
  overlay.classList.add('nav-sidebar-overlay');
  overlay.addEventListener('click', toggleSidebar);

  // Clear nav and rebuild structure: hamburger at start, brand in center, tools at end
  nav.textContent = '';
  nav.append(hamburger);

  if (navBrand) {
    nav.append(navBrand);
  }

  if (navTools) {
    nav.append(navTools);
  }

  // Add sidebar and overlay to nav wrapper
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  navWrapper.append(sidebar);
  navWrapper.append(overlay);
  block.append(navWrapper);
}