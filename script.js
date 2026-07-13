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

/*---tap to unlock---*/
const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');

lockscreen.addEventListener('click', () => {
  lockscreen.classList.add('unlocking');
  setTimeout(() =>{
    lockscreen.style.display = 'none';
    homescreen.style.display = 'block';
  }, 400);
});