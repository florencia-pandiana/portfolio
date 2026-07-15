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

/*---unlocking screen---*/

updateClock();
setInterval(updateClock, 10000);

const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');
const folder = document.getElementById('file');
// const folder1 = document.getElementById('whole');

document.addEventListener('click', (e) => {
  const isLocked = homescreen.style.display === 'none';

  if (isLocked) {
    lockscreen.classList.add('unlocking');
    folder.classList.add('docked');
    setTimeout(() => {
      lockscreen.style.display = 'none';
      homescreen.style.display = 'block';
      // folder1.style.display = 'block';
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
    setTimeout(() => {
      homescreen.style.display = 'none';
      folder1.style.display = 'none';
    }, 400);
  }
});