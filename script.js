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

/*---about me + projects info panels---*/

const folder1 = document.getElementById('folder1');
const infoWrapperAbout = document.getElementById('infoWrapperAbout');
const closeAbout = document.getElementById('closeAbout');

const folder2 = document.getElementById('folder2');
const infoWrapperProject = document.getElementById('infoWrapperProject');
const closeProject = document.getElementById('closeProject');

folder1.addEventListener('click', (e) => {
  e.stopPropagation();

  const isOpen = folder1.classList.contains('opened');

  if (!isOpen) {
    if (folder2.classList.contains('opened')) {
      infoWrapperProject.style.display = 'none';
      folder2.classList.remove('opened');
    }

    folder1.classList.add('opened');
    setTimeout(() => {
      infoWrapperAbout.style.display = 'flex';
    }, 400);
  } else {
    infoWrapperAbout.style.display = 'none';
    folder1.classList.remove('opened');
  }
});

closeAbout.addEventListener('click', (e) => {
  e.stopPropagation();
  infoWrapperAbout.style.display = 'none';
  folder1.classList.remove('opened');
});

folder2.addEventListener('click', (e) => {
  e.stopPropagation();

  const isOpen = folder2.classList.contains('opened');

  if (!isOpen) {
    if (folder1.classList.contains('opened')) {
      infoWrapperAbout.style.display = 'none';
      folder1.classList.remove('opened');
    }

    folder2.classList.add('opened');
    setTimeout(() => {
      infoWrapperProject.style.display = 'flex';
    }, 400);
  } else {
    infoWrapperProject.style.display = 'none';
    folder2.classList.remove('opened');
  }
});

closeProject.addEventListener('click', (e) => {
  e.stopPropagation();
  infoWrapperProject.style.display = 'none';
  folder2.classList.remove('opened');
});