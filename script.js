/*---lockscreen---*/

function updateClock() {
  const now = new Date();
  const dateText = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeText = hours + ':' + minutes;

  document.getElementById('date').textContent = dateText;
  document.getElementById('time').textContent = timeText;
}

updateClock();
setInterval(updateClock, 10000);

/*---elements---*/

const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');
const folder = document.getElementById('file');

const card1 = document.getElementById('card1');
const card2 = document.getElementById('card2');
const card3 = document.getElementById('card3');
const cards = [card1, card2, card3];

const originalCardConfig = {
  card1: { top: -25, height: 50, left: 10, width: 35, rotate: -15 },
  card2: { top: -40, height: 60, left: 30, width: 35, rotate: 5 },
  card3: { top: -20, height: 60, left: 50, width: 35, rotate: 20 },
};

const cardEndTargets = {
  card1: { topVh: 8,  leftVw: 6,  widthRem: 8, heightRem: 7, rotate: 0 },
  card2: { topVh: 32, leftVw: 6,  widthRem: 8, heightRem: 7, rotate: 0 },
  card3: { topVh: 8,  leftVw: 75, widthRem: 8, heightRem: 7, rotate: 0 },
};

/*---math helpers---*/

function getRootFontSizePx() {
  return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function clampPx(minRem, vwPercent, maxRem) {
  const rootPx = getRootFontSizePx();
  const minPx = minRem * rootPx;
  const maxPx = maxRem * rootPx;
  const preferredPx = window.innerWidth * vwPercent / 100;
  return Math.min(Math.max(preferredPx, minPx), maxPx);
}

function getFolderUndockedRect() {
  const width = clampPx(1.25, 70, 15.625);
  const height = clampPx(1, 56, 12.5);
  const left = window.innerWidth / 2 - width / 2;
  const top = window.innerHeight / 2 - height / 2;
  return { left, top, width, height };
}

function configToPx(config, folderRect) {
  return {
    left: folderRect.left + (folderRect.width * config.left / 100),
    top: folderRect.top + (folderRect.height * config.top / 100),
    width: folderRect.width * config.width / 100,
    height: folderRect.height * config.height / 100,
  };
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/*---core animation loop---*/

function animateCardFlight(card, startPx, startRotate, endPx, endRotate, duration, onComplete) {
  card.style.transition = 'none';
  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeInOutQuad(t);

    const curLeft = startPx.left + (endPx.left - startPx.left) * eased;
    const curTop = startPx.top + (endPx.top - startPx.top) * eased;
    const curWidth = startPx.width + (endPx.width - startPx.width) * eased;
    const curHeight = startPx.height + (endPx.height - startPx.height) * eased;
    const curRotate = startRotate + (endRotate - startRotate) * eased;

    const folderRectNow = folder.getBoundingClientRect();

    const leftPct = (curLeft - folderRectNow.left) / folderRectNow.width * 100;
    const topPct = (curTop - folderRectNow.top) / folderRectNow.height * 100;
    const widthPct = curWidth / folderRectNow.width * 100;
    const heightPct = curHeight / folderRectNow.height * 100;

    card.style.left = leftPct + '%';
    card.style.top = topPct + '%';
    card.style.width = widthPct + '%';
    card.style.height = heightPct + '%';
    card.style.transform = `rotate(${curRotate}deg)`;

    if (t < 1) {
      requestAnimationFrame(frame);
    } else if (onComplete) {
      onComplete();
    }
  }

  requestAnimationFrame(frame);
}

/*---trigger functions---*/

function flyCardsToHomescreen() {
  const rootPx = getRootFontSizePx();

  cards.forEach(card => {
    const startRect = card.getBoundingClientRect();
    const startRotate = originalCardConfig[card.id].rotate;

    const target = cardEndTargets[card.id];
    const endRect = {
      left: (window.innerWidth * target.leftVw / 100),
      top: (window.innerHeight * target.topVh / 100),
      width: target.widthRem * rootPx,
      height: target.heightRem * rootPx,
    };

    animateCardFlight(card, startRect, startRotate, endRect, target.rotate, 400);
  });
}

function flyCardsBackToFolder() {
  const folderUndockedRect = getFolderUndockedRect();

  cards.forEach(card => {
    const startRect = card.getBoundingClientRect();
    const startRotate = cardEndTargets[card.id].rotate;

    const config = originalCardConfig[card.id];
    const endRect = configToPx(config, folderUndockedRect);

    animateCardFlight(card, startRect, startRotate, endRect, config.rotate, 400, () => {
      card.removeAttribute('style');
    });
  });
}

/*---unlocking screen---*/

document.addEventListener('click', (e) => {
  const isLocked = homescreen.style.display === 'none';

  if (isLocked) {
    lockscreen.classList.add('unlocking');
    folder.classList.add('docked');
    flyCardsToHomescreen();
    setTimeout(() => {
      lockscreen.style.display = 'none';
      homescreen.style.display = 'block';
    }, 400);
  }
});

/*---locking screen---*/

folder.addEventListener('click', (e) => {
  const isLocked = homescreen.style.display === 'none';

  if (!isLocked) {
    e.stopPropagation();
    lockscreen.classList.remove('unlocking');
    folder.classList.remove('docked');
    lockscreen.style.display = 'block';
    flyCardsBackToFolder();
    setTimeout(() => {
      homescreen.style.display = 'none';
    }, 400);
  }
});

/*---reusable folder toggle system (About/Projects/Skills)---*/

const allToggles = [];

function registerFolderToggle(folderId, wrapperId, closeId) {
  const folderEl = document.getElementById(folderId);
  const wrapperEl = document.getElementById(wrapperId);
  const closeEl = document.getElementById(closeId);

  const entry = { folderEl, wrapperEl };
  allToggles.push(entry);

  folderEl.addEventListener('click', (e) => {
    e.stopPropagation();

    const isOpen = folderEl.classList.contains('opened');

    if (!isOpen) {
      allToggles.forEach(other => {
        if (other.folderEl !== folderEl && other.folderEl.classList.contains('opened')) {
          other.wrapperEl.style.display = 'none';
          other.folderEl.classList.remove('opened');
        }
      });

      folderEl.classList.add('opened');
      setTimeout(() => {
        wrapperEl.style.display = 'flex';
      }, 400);
    } else {
      wrapperEl.style.display = 'none';
      folderEl.classList.remove('opened');
    }
  });

  closeEl.addEventListener('click', (e) => {
    e.stopPropagation();
    wrapperEl.style.display = 'none';
    folderEl.classList.remove('opened');
  });
}

registerFolderToggle('folder1', 'infoWrapperAbout', 'closeAbout');
registerFolderToggle('folder2', 'infoWrapperProject', 'closeProject');
registerFolderToggle('folder3', 'infoWrapperSkills', 'closeSkills');

/*---skills panel: click a skill to update content + morph shape---*/

const skillIcons = document.querySelectorAll('.skill-icon');
const skillContentTitle = document.getElementById('skillContentTitle');
const skillContentBox = document.getElementById('skillContentBox');

const skillVisuals = {
  CSS: `
    <div class="skill-visual">
      <svg viewBox="0 0 100 100">
        <path class="design-path" d="M25 20 L75 20 L70 65 L50 75 L30 65 L28 45 L65 45 L63 58 L50 63 L38 58 L37 52" />
      </svg>
      <div class="design-swatches">
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
      </div>
    </div>
  `,
  JavaScript: `
    <div class="skill-visual">
      <svg viewBox="0 0 100 100">
        <path class="design-path js-bolt" d="M55 15 L30 55 L48 55 L42 85 L72 42 L52 42 Z" />
      </svg>
      <div class="design-swatches">
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
      </div>
    </div>
  `,
  HTML: `
    <div class="skill-visual">
      <svg viewBox="0 0 100 100">
        <path class="design-path" d="M25 20 L30 80 L50 88 L70 80 L75 20 Z" />
        <path class="design-path html-brackets" d="M40 40 L32 50 L40 60 M60 40 L68 50 L60 60" />
      </svg>
      <div class="design-swatches">
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
      </div>
    </div>
  `,
  Design: `
    <div class="skill-visual">
      <svg viewBox="0 0 100 100">
        <path class="design-path" d="M20 70 L20 30 Q20 20 30 20 L70 20 Q80 20 80 30 L80 70 Q80 80 70 80 L30 80 Q20 80 20 70 Z" />
      </svg>
      <div class="design-swatches">
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
        <span class="design-swatch"></span>
      </div>
    </div>
  `,
};

let javaTypeInterval = null;

function renderJavaVisual() {
  skillContentBox.innerHTML = `
    <div class="skill-code-panel">
      <p class="skill-code-intro">Used in university coursework and personal projects, including CashFlo (a Java budget tracker) and a 2D game built with Processing. Comfortable applying core OOP principles — classes, encapsulation, inheritance — to structure real, working applications.</p>
      <pre class="skill-code-block"><code id="javaCodeTyped"></code><span class="skill-code-cursor"></span></pre>
    </div>
  `;

 const codeText = `public class Flo {
    String[] skills = {"Java", "CSS", "JavaScript", "HTML"};
    String favoriteThing = "design";
    boolean stillGoogling = true; // even after 4 years

    public String sayHi() {
        return "hey, welcome!";
    }

    public void debug() {
        stareAtScreen();
        findTypo();
        fixIt();
    }
}`;

  const codeEl = document.getElementById('javaCodeTyped');
  let i = 0;

  if (javaTypeInterval) clearInterval(javaTypeInterval);

  javaTypeInterval = setInterval(() => {
    if (i < codeText.length) {
      codeEl.textContent += codeText[i];
      i++;
    } else {
      clearInterval(javaTypeInterval);
    }
  }, 20);
}

function renderSkillVisual(skillName) {
  if (skillName === 'Java') {
    renderJavaVisual();
  } else {
    skillContentBox.innerHTML = skillVisuals[skillName] || '';
  }
}

function resetSkillsPanel() {
  skillIcons.forEach(i => {
    i.classList.remove('selected');
    i.querySelector('.folder').classList.remove('opened');
  });
  skillContentTitle.textContent = 'Select a skill';
  skillContentBox.innerHTML = '';
  if (javaTypeInterval) clearInterval(javaTypeInterval);
}

skillIcons.forEach(icon => {
  icon.addEventListener('click', (e) => {
    e.stopPropagation();

    const folderEl = icon.querySelector('.folder');
    const alreadySelected = icon.classList.contains('selected');

    skillIcons.forEach(i => {
      i.classList.remove('selected');
      i.querySelector('.folder').classList.remove('opened');
    });

    if (javaTypeInterval) clearInterval(javaTypeInterval);

    if (alreadySelected) {
      skillContentTitle.textContent = 'Select a skill';
      skillContentBox.innerHTML = '';
    } else {
      icon.classList.add('selected');
      folderEl.classList.add('opened');
      skillContentTitle.textContent = icon.dataset.skill;
      renderSkillVisual(icon.dataset.skill);
    }
  });
});

document.getElementById('folder3').addEventListener('click', () => {
  const isNowClosed = !document.getElementById('folder3').classList.contains('opened');
  if (isNowClosed) {
    resetSkillsPanel();
  }
});

document.getElementById('closeSkills').addEventListener('click', resetSkillsPanel);

/*---projects panel: list, gallery, thumbnails with highlight, feature/tech lists---*/

const projItems = document.querySelectorAll('.proj-item');
const projDetailTitle = document.getElementById('projDetailTitle');
let projDetailDesc = document.getElementById('projDetailDesc');
const projGalleryImg = document.getElementById('projGalleryImg');
const projPrev = document.getElementById('projPrev');
const projNext = document.getElementById('projNext');
const projThumbs = document.getElementById('projThumbs');

const projectData = {
  bharabas: {
    title: 'Bharabas Radio App Prototype',
    desc: 'Designed a high-fidelity mobile app prototype in Figma for Bharabas, a news-focused radio station in Indonesia, as part of the New Colombo Plan (NCP). Collaborated with an international team using Agile methodologies to conduct user research, create wireframes and interactive prototypes, and present a client-focused solution that modernised the radio listening experience.',
    images: ['bharabas1.png', 'bharabas2.png', 'bharabas3.png', 'bharabas4.png', 'bharabas5.png', 'bharabas6.png', 'bharabas7.png', 'bharabas8.png', 'bharabas9.png', 'bharabas10.png'],
  },
  cashflo: {
    title: 'CashFlo Budget Tracker',
    desc: 'Built CashFlo, a Java personal finance tracker designed with object-oriented programming principles. Implemented transaction management, category-based reporting, CSV data persistence, and an interactive command-line interface. The project highlights skills in software architecture, data handling, file operations, and modular Java development.',
    features: [
      'Add, edit, and manage income and expense transactions',
      'View complete transaction history',
      'Generate category-based spending summaries',
      'Save and load financial data using CSV files',
      'Interactive menu-driven command-line interface',
    ],
    images: ['cashflo1.png', 'cashflo2.png'],
  },
  processinggame: {
    title: 'Processing Game',
    desc: 'Developed a 2D interactive game using Processing (Java), implementing core game programming concepts such as player movement, collision detection, score tracking, game states, and object-oriented programming. The project focused on creating responsive gameplay while strengthening skills in event handling, animation, and game logic through a modular code structure.',
    tech: ['Processing', 'Java', 'Object-Oriented Programming', 'Game Development', 'Event Handling', 'Collision Detection'],
    images: ['processinggame1.png', 'processinggame2.png'],
  },
};

let currentProjectId = 'bharabas';
let currentImageIndex = 0;
let thumbElements = [];

function updateActiveThumb() {
  thumbElements.forEach((thumb, i) => {
    thumb.classList.toggle('active', i === currentImageIndex);
  });
}

function renderProject(id) {
  const data = projectData[id];
  if (!data) return;

  currentProjectId = id;
  currentImageIndex = 0;

  projDetailTitle.textContent = data.title;

  let descHTML = `<p class="proj-detail-desc-text">${data.desc}</p>`;

  if (data.features && data.features.length > 0) {
    const featureItems = data.features.map(f => `<li>${f}</li>`).join('');
    descHTML += `<h4 class="proj-detail-subhead">Key Features</h4><ul class="proj-detail-list">${featureItems}</ul>`;
  }

  if (data.tech && data.tech.length > 0) {
    const techItems = data.tech.map(t => `<span class="proj-tech-tag">${t}</span>`).join('');
    descHTML += `<h4 class="proj-detail-subhead">Tech</h4><div class="proj-tech-list">${techItems}</div>`;
  }

  const newDescContainer = document.createElement('div');
  newDescContainer.id = 'projDetailDesc';
  newDescContainer.innerHTML = descHTML;
  projDetailDesc.replaceWith(newDescContainer);
  projDetailDesc = newDescContainer;

  projGalleryImg.src = data.images[0];

  projThumbs.innerHTML = '';
  thumbElements = data.images.map((src, i) => {
    const thumb = document.createElement('img');
    thumb.src = src;
    thumb.className = 'proj-thumb';
    thumb.alt = 'thumbnail';
    thumb.addEventListener('click', () => {
      currentImageIndex = i;
      projGalleryImg.src = src;
      updateActiveThumb();
    });
    projThumbs.appendChild(thumb);
    return thumb;
  });

  updateActiveThumb();
}

projItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    projItems.forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    renderProject(item.dataset.proj);
  });
});

projPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  const images = projectData[currentProjectId].images;
  currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
  projGalleryImg.src = images[currentImageIndex];
  updateActiveThumb();
});

projNext.addEventListener('click', (e) => {
  e.stopPropagation();
  const images = projectData[currentProjectId].images;
  currentImageIndex = (currentImageIndex + 1) % images.length;
  projGalleryImg.src = images[currentImageIndex];
  updateActiveThumb();
});

renderProject('bharabas');