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

/*---todo widget---*/

const todoTasks = [
  { label: 'LockedIn', checked: false },
];

const TODO_ROW_COUNT = 6;

function renderTodoDate() {
  const now = new Date();
  document.getElementById('todoDate').textContent = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function renderTodoWeek() {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const dayIndex = now.getDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const cells = dayLabels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === now.toDateString();
    return `
      <div class="todo-day${isToday ? ' today' : ''}">
        <span class="todo-day-label">${label}</span>
        <span class="todo-day-num">${d.getDate()}</span>
      </div>
    `;
  }).join('');

  document.getElementById('todoWeek').innerHTML = cells;
}

function renderTodoList() {
  const rows = [];

  for (let i = 0; i < TODO_ROW_COUNT; i++) {
    const task = todoTasks[i];
    if (task) {
      rows.push(`
        <div class="todo-row">
          <span class="todo-checkbox${task.checked ? ' checked' : ''}" data-index="${i}">${task.checked ? '&#10003;' : ''}</span>
          <span class="todo-label${task.checked ? ' checked' : ''}">${task.label}</span>
        </div>
      `);
    } else {
      rows.push('<div class="todo-row"></div>');
    }
  }

  document.getElementById('todoList').innerHTML = rows.join('');

  document.querySelectorAll('.todo-checkbox').forEach(box => {
    box.addEventListener('click', () => {
      const i = Number(box.dataset.index);
      todoTasks[i].checked = !todoTasks[i].checked;
      renderTodoList();
    });
  });
}

renderTodoDate();
renderTodoWeek();
renderTodoList();

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

/*---reusable folder toggle system---*/

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

/*---About Me: skill badges---*/

function renderAboutSkillsNetwork() {
  const skills = ['HTML', 'CSS', 'JavaScript', 'Java', 'SQL'];

  const badges = skills.map(name => `
    <span class="skill-badge" data-skill="${name}">${name}</span>
  `).join('');

  document.getElementById('aboutSkillsNetwork').innerHTML = badges;
}

renderAboutSkillsNetwork();

/*---More panel: Certifications/Portfolio/Resume tabs---*/

const moreItems = document.querySelectorAll('.skill-icon');
const skillContentTitle = document.getElementById('skillContentTitle');
const skillContentBox = document.getElementById('skillContentBox');
const infoSkills = document.getElementById('info-skills');

const certData = [
  {
    title: 'COMP1010 2025 Jan Hext Prize',
    subtitle: 'Awarded for academic excellence in the unit COMP1010 Fundamentals of Computer Science',
    image: 'JanHext.JPG',
  },
  {
    title: 'Certificate of Participation — ASA DataFest 2026',
    subtitle: '',
    image: 'cert-datafest.png',
  },
  {
    title: 'Diploma of Business Analytics',
    subtitle: '2024–2025, Average WAM 92',
    image: 'cert-diploma.png',
  },
  {
    title: 'COMP2700 — Project Management and Professional Practice',
    subtitle: 'Session 2, 2025',
    image: 'cert-comp2700.png',
  },
  {
    title: 'COMP1010 — Fundamentals of Computer Science',
    subtitle: 'Session 2, 2025',
    image: 'cert-comp1010.png',
  },
];

let expandedCertIndex = null;

const certIconColors = ['#d0b692', '#82a3ac', '#ae828d', '#769775', '#928da3'];

function renderCertList() {
  skillContentBox.innerHTML = `
    <div class="cert-list">
      <div class="cert-group">
        ${certData.map((cert, i) => `
          <div class="cert-row${cert.subtitle ? '' : ' no-subtitle'}${i === expandedCertIndex ? ' expanded' : ''}" data-index="${i}">
            <span class="cert-row-icon" style="background-color: ${certIconColors[i % certIconColors.length]}">&#10022;</span>
            <div class="cert-row-main">
              <div class="cert-row-head">
                <p class="cert-row-title">${cert.title}</p>
                ${cert.subtitle ? '<span class="cert-row-chevron">&rsaquo;</span>' : ''}
              </div>
              ${cert.subtitle ? `<div class="cert-row-body"><div class="cert-row-body-inner"><p class="cert-row-subtitle">${cert.subtitle}</p></div></div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  skillContentBox.querySelectorAll('.cert-row:not(.no-subtitle)').forEach(row => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = Number(row.dataset.index);
      expandedCertIndex = expandedCertIndex === i ? null : i;
      renderCertList();
    });
  });
}

/*---Portfolio: swipeable image carousel---*/

const portfolioData = [
  { title: 'Design 1', subtitle: '', image: 'design1.PNG' },
  { title: 'Design 2', subtitle: '', image: 'design2.PNG' },
  { title: 'Design 3', subtitle: '', image: 'design3.PNG' },
  { title: 'Design 4', subtitle: '', image: 'design4.png' },
  { title: 'Design 5', subtitle: '', image: 'design5.png' },
  { title: 'Design 6', subtitle: '', image: 'design6.PNG' },
  { title: 'Design 7', subtitle: '', image: 'design7.jpg' },
  { title: 'Design 8', subtitle: '', image: 'design8.jpg' },
  { title: 'Design 9', subtitle: '', image: 'design9.jpg' },
];

let currentPortfolioIndex = 0;

function goToPortfolio(delta) {
  currentPortfolioIndex = (currentPortfolioIndex + delta + portfolioData.length) % portfolioData.length;
  renderPortfolio();
}

function renderPortfolio() {
  const prevItem = portfolioData[(currentPortfolioIndex - 1 + portfolioData.length) % portfolioData.length];
  const item = portfolioData[currentPortfolioIndex];
  const nextItem = portfolioData[(currentPortfolioIndex + 1) % portfolioData.length];

  skillContentBox.innerHTML = `
    <div class="portfolio-view">
      <div class="portfolio-stage" id="portfolioStage">
        <div class="portfolio-card portfolio-card-side portfolio-card-prev">
          <img src="${prevItem.image}" alt="${prevItem.title}" class="portfolio-card-img">
        </div>
        <div class="portfolio-card portfolio-card-main">
          <img src="${item.image}" alt="${item.title}" class="portfolio-card-img">
        </div>
        <div class="portfolio-card portfolio-card-side portfolio-card-next">
          <img src="${nextItem.image}" alt="${nextItem.title}" class="portfolio-card-img">
        </div>
      </div>
      <div class="portfolio-info">
        <p class="portfolio-card-title">${item.title}</p>
        ${item.subtitle ? `<p class="portfolio-card-subtitle">${item.subtitle}</p>` : ''}
      </div>
      <div class="portfolio-nav">
        <button class="proj-nav-btn" id="portfolioPrev">&lt;</button>
        <div class="portfolio-dots">
          ${portfolioData.map((_, i) => `<span class="portfolio-dot${i === currentPortfolioIndex ? ' active' : ''}"></span>`).join('')}
        </div>
        <button class="proj-nav-btn" id="portfolioNext">&gt;</button>
      </div>
    </div>
  `;

  document.getElementById('portfolioPrev').addEventListener('click', (e) => {
    e.stopPropagation();
    goToPortfolio(-1);
  });

  document.getElementById('portfolioNext').addEventListener('click', (e) => {
    e.stopPropagation();
    goToPortfolio(1);
  });

  const stage = document.getElementById('portfolioStage');
  let dragStartX = null;

  stage.addEventListener('pointerdown', (e) => {
    dragStartX = e.clientX;
  });

  stage.addEventListener('pointerup', (e) => {
    if (dragStartX === null) return;
    const diff = e.clientX - dragStartX;
    dragStartX = null;
    if (Math.abs(diff) > 40) {
      goToPortfolio(diff < 0 ? 1 : -1);
    }
  });

  stage.addEventListener('pointerleave', () => {
    dragStartX = null;
  });
}

let currentMoreTab = null;

function renderMoreTab(tabName, folderIconEl) {
  infoSkills.classList.remove('no-selection');
  currentMoreTab = tabName;

  moreItems.forEach(i => {
    i.classList.remove('selected');
    i.querySelector('.folder').classList.remove('opened');
  });
  folderIconEl.classList.add('selected');
  folderIconEl.querySelector('.folder').classList.add('opened');

  if (tabName === 'certifications') {
    skillContentTitle.textContent = 'Certifications';
    expandedCertIndex = null;
    renderCertList();
  } else if (tabName === 'portfolio') {
    skillContentTitle.textContent = 'Portfolio';
    currentPortfolioIndex = 0;
    renderPortfolio();
  } else if (tabName === 'resume') {
    skillContentTitle.textContent = 'Resume';
    skillContentBox.innerHTML = `
      <div class="resume-view">
        <a href="resume.pdf" download class="resume-download-btn" title="Download resume">
          <img src="download.png" alt="Download" class="resume-download-icon">
        </a>
        <div class="resume-preview">
          <iframe src="resume.pdf#toolbar=0&navpanes=0&scrollbar=0" class="resume-frame" title="Resume"></iframe>
        </div>
      </div>
    `;
  }
}

moreItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = item.querySelector('.folder').classList.contains('opened');
    if (isOpen) {
      resetSkillsPanel();
    } else {
      renderMoreTab(item.dataset.more, item);
    }
  });
});

const moreOptionLabels = {
  certifications: 'certs',
  portfolio: 'portfolio',
  resume: 'resume',
};

const moreTabOrder = Object.keys(moreOptionLabels);

function goToMoreTab(delta) {
  if (!currentMoreTab) return;
  const idx = moreTabOrder.indexOf(currentMoreTab);
  const nextTab = moreTabOrder[(idx + delta + moreTabOrder.length) % moreTabOrder.length];
  const sidebarItem = Array.from(moreItems).find(i => i.dataset.more === nextTab);
  renderMoreTab(nextTab, sidebarItem);
}

document.getElementById('skillContentPrev').addEventListener('click', (e) => {
  e.stopPropagation();
  goToMoreTab(-1);
});

document.getElementById('skillContentNext').addEventListener('click', (e) => {
  e.stopPropagation();
  goToMoreTab(1);
});

function renderEmptyState() {
  skillContentBox.innerHTML = `
    <div class="empty-state-icons">
      ${Object.entries(moreOptionLabels).map(([key, label]) => `
        <div class="skill-icon empty-state-icon" data-more="${key}">
          <div class="folder">
            <div class="folder-tab"></div>
            <div class="folder-body"></div>
            <div class="folder-body1"></div>
            <div class="folder-body2"><span>flo</span></div>
            <img src="star.png" alt="star">
          </div>
          <span>${label}</span>
        </div>
      `).join('')}
    </div>
  `;

  skillContentBox.querySelectorAll('.empty-state-icon').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const sidebarItem = Array.from(moreItems).find(i => i.dataset.more === el.dataset.more);
      renderMoreTab(el.dataset.more, sidebarItem);
    });
  });
}

function resetSkillsPanel() {
  infoSkills.classList.add('no-selection');
  currentMoreTab = null;

  moreItems.forEach(i => {
    i.classList.remove('selected');
    i.querySelector('.folder').classList.remove('opened');
  });
  skillContentTitle.textContent = 'Select an option';
  renderEmptyState();
}

document.getElementById('folder3').addEventListener('click', () => {
  const isNowClosed = !document.getElementById('folder3').classList.contains('opened');
  if (isNowClosed) {
    resetSkillsPanel();
  }
});

document.getElementById('closeSkills').addEventListener('click', resetSkillsPanel);

resetSkillsPanel();

/*---projects panel---*/

const projItems = document.querySelectorAll('.proj-item');
const projDetailTitle = document.getElementById('projDetailTitle');
let projDetailDesc = document.getElementById('projDetailDesc');
const projGalleryImg = document.getElementById('projGalleryImg');
const projPrev = document.getElementById('projPrev');
const projNext = document.getElementById('projNext');
const projThumbs = document.getElementById('projThumbs');

const infoProject = document.getElementById('info-project');
const projSidebarToggle = document.getElementById('projSidebarToggle');

projSidebarToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  infoProject.classList.toggle('sidebar-collapsed');
});

const projectData = {
  bharabas: {
    title: 'Bharabas Radio App Prototype',
    desc: 'Designed a high-fidelity mobile app prototype in Figma for Bharabas, a news-focused radio station in Indonesia, as part of the New Colombo Plan (NCP). Collaborated with an international team using Agile methodologies to conduct user research, create wireframes and interactive prototypes, and present a client-focused solution that modernised the radio listening experience.',
    skills: ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'User Research', 'Agile', 'Client Communication'],
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
    skills: ['Java', 'Object-Oriented Programming', 'Software Architecture', 'File I/O', 'CSV Data Handling', 'CLI Design'],
    images: ['CashFlo1.png', 'CashFlo2.png', 'CashFlo3.png', 'CashFlo4.png', 'CashFlo5.png', 'CashFlo6.png', 'CashFlo7.png'],
  },
  simba: {
    title: 'Simba',
    desc: 'A 2D top-down action-adventure built in Unity using Visual Scripting, where the player races against a countdown timer to rescue a kidnapped dog from a monster-infested camp. Designed and built the full game loop solo, from mechanics to UI to a WebGL build shipped on itch.io.',
    features: [
      'Dual-weapon combat system (sword + ranged wand) with real-time switching',
      'Procedurally escalating enemy difficulty and a two-phase boss encounter',
      'Enemy hazards with on-contact slow effects, plus chest-based rewards mixing permanent upgrades and temporary power-ups',
      'Full UI/UX including health bar, timer, and game-over/replay flow',
      'Playtested with a TA, with iterations made on timer pacing and UI placement based on feedback',
    ],
    skills: ['Unity', 'Visual Scripting (Script Graphs)', 'WebGL'],
    images: ['Simba1.png', 'Simba2.png', 'Simba3.png', 'Simba4.png', 'Simba5.png', 'Simba6.png', 'Simba7.png', 'Simba8.png', 'Simba9.png', 'Simba10.png', 'Simba11.png'],
  },
  processinggame: {
    title: 'Processing Game',
    desc: 'Developed a 2D interactive game using Processing (Java), implementing core game programming concepts such as player movement, collision detection, score tracking, game states, and object-oriented programming. The project focused on creating responsive gameplay while strengthening skills in event handling, animation, and game logic through a modular code structure.',
    skills: ['Processing', 'Java', 'Object-Oriented Programming', 'Game Development', 'Event Handling', 'Collision Detection'],
    images: ['processinggame1.png', 'processinggame2.png', 'processinggame3.png', 'processinggame4.png'],
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

  if (data.skills && data.skills.length > 0) {
    const skillItems = data.skills.map(s => `<span class="proj-tech-tag">${s}</span>`).join('');
    descHTML += `<h4 class="proj-detail-subhead">Skills</h4><div class="proj-tech-list">${skillItems}</div>`;
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