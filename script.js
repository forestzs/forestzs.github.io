// script.js

// ===== Background Slider Data (EN captions) =====
const bgImg = document.querySelector('.bg__img');
const bgCaption = document.getElementById('bgCaption');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const bgClock = document.getElementById('bgClock');
const clockText = document.getElementById('clockText');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

let i = 0;
let timer = null;

function normIndex(index) {
  const n = sliderData.length;
  return ((index % n) + n) % n;
}

function setAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
}

function render(index) {
  const idx = normIndex(index);
  const item = sliderData[idx];

  if (bgClock) bgClock.style.display = 'block';

  bgImg.style.opacity = '0';
  setTimeout(() => {
    bgImg.src = item.url;
    bgImg.onload = () => {
      bgImg.style.opacity = '1';
      bgImg.style.transform = 'scale(1.06)';
      setTimeout(() => (bgImg.style.transform = 'scale(1.04)'), 600);
    };
  }, 120);

  bgCaption.textContent = item.title;
  setAccent(item.color);
}

function startTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    i += 1;
    render(i);
  }, 3500);
}

prevBtn?.addEventListener('click', () => {
  i -= 1;
  render(i);
  startTimer();
});

nextBtn?.addEventListener('click', () => {
  i += 1;
  render(i);
  startTimer();
});

// Pause on hover background (optional)
bgImg?.addEventListener('mouseenter', () => timer && clearInterval(timer));
bgImg?.addEventListener('mouseleave', startTimer);

// Small clock (EN)
function updateSmallClock() {
  if (!clockText) return;
  const d = new Date();
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(d);
  const date = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  clockText.innerHTML = `${day}<br>${time}<br>${date}`;
}
setInterval(updateSmallClock, 250);
updateSmallClock();

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) e.target.classList.add('is-in');
  }
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Init slider
render(0);
startTimer();


// ===== Top-right calendar widget (EN) =====
const calTime = document.getElementById('calTime');
const calDate = document.getElementById('calDate');
const calSub  = document.getElementById('calSub');
const calMonth = document.getElementById('calMonth');
const calGrid = document.getElementById('calGrid');
const calPrev = document.getElementById('calPrev');
const calNext = document.getElementById('calNext');
const calTodayBtn = document.getElementById('calToday');

function pad2(n){ return String(n).padStart(2, '0'); }
function sameDay(a, b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

// current view month
let calView = new Date();
calView.setDate(1);

// selected day
let calSelected = new Date();

function updateCalHeader(){
  const now = new Date();

  // Time with seconds (24h-like but using leading zeros)
  calTime.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  // Date line: Thu, Dec 25, 2025
  calDate.textContent = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: '2-digit', year: 'numeric'
  }).format(now);

  // Sub line
  if (calSub) calSub.textContent = 'Local time • Click a date to select';
}

function renderCalendar(){
  const y = calView.getFullYear();
  const m = calView.getMonth();

  // Month line: December 2025
  calMonth.textContent = new Intl.DateTimeFormat('en-US', {
    month: 'long', year: 'numeric'
  }).format(new Date(y, m, 1));

  calGrid.innerHTML = '';

  const first = new Date(y, m, 1);

  // Monday-based week grid
  const shift = (first.getDay() + 6) % 7; // Mon=0
  const start = new Date(y, m, 1 - shift);
  const today = new Date();

  for (let k = 0; k < 42; k++){
    const d = new Date(start);
    d.setDate(start.getDate() + k);

    const btn = document.createElement('button');
    btn.className = 'cal__cell';
    btn.type = 'button';
    btn.textContent = d.getDate();

    if (d.getMonth() !== m) btn.classList.add('is-other');
    if (sameDay(d, today)) btn.classList.add('is-today');
    if (sameDay(d, calSelected)) btn.classList.add('is-selected');

    btn.addEventListener('click', () => {
      calSelected = d;
      renderCalendar();
    });

    calGrid.appendChild(btn);
  }
}

calPrev?.addEventListener('click', () => {
  calView = new Date(calView.getFullYear(), calView.getMonth()-1, 1);
  renderCalendar();
});

calNext?.addEventListener('click', () => {
  calView = new Date(calView.getFullYear(), calView.getMonth()+1, 1);
  renderCalendar();
});

calTodayBtn?.addEventListener('click', () => {
  const t = new Date();
  calSelected = t;
  calView = new Date(t.getFullYear(), t.getMonth(), 1);
  renderCalendar();
});

// init calendar
updateCalHeader();
renderCalendar();
setInterval(updateCalHeader, 250);
