// script.js

// ===== Background Slider Data (EN captions) =====
// (captions kept for future use; we do NOT render captions on page now)
const sliderData = [
  { url: './images/qishen.jpg', title: 'Traveler—come on, take a break with me...', color: 'rgb(181, 192, 184)' },
  { url: './images/wendi.jpg', title: 'The wind will carry away your worries—and bring new stories and adventures~', color: 'rgb(62, 150, 126)' },
  { url: './images/keqing.jpg', title: 'My blade is like lightning—cutting through all that stands in the way!', color: 'rgb(90, 78, 116)' },
  { url: './images/zhongli.jpg', title: 'If only we could drink again beneath the osmanthus... when will old friends meet once more?', color: 'rgb(210, 158, 78)' },
  { url: './images/ganyu.jpg', title: 'Ah, the scent of Glaze Lilies… wonderful.', color: 'rgb(96, 111, 191)' },
  { url: './images/leidian.jpg', title: 'The world remains for ages, yet a human life is but dew and a fleeting shadow.', color: 'rgb(153, 119, 217)' },
  { url: './images/shenzi.jpg', title: 'My god… I’ll leave everything to you!', color: 'rgb(185, 95, 84)' },
  { url: './images/naxida.jpg', title: 'Do you believe the Dendro Archon exists? I’ve seen her in my dreams.', color: 'rgb(130, 148, 124)' },
  { url: './images/nilu.jpg', title: 'Graceful steps—like a lotus in bloom, pure and untouched~', color: 'rgb(33, 166, 218)' },
  { url: './images/funingna.jpg', title: 'Rain never ceases; a hundred rivers surge onward!', color: 'rgb(136, 151, 184)' },
  { url: './images/naweiya.jpg', title: 'Isn’t a secret shared with friends all the more precious?', color: 'rgb(202, 159, 116)' }
];

const bgImg = document.getElementById('bgImg');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

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

  // cross-fade image
  bgImg.style.opacity = '0';
  setTimeout(() => {
    bgImg.src = item.url;
    bgImg.onload = () => {
      bgImg.style.opacity = '1';
      bgImg.style.transform = 'scale(1.06)';
      setTimeout(() => (bgImg.style.transform = 'scale(1.04)'), 600);
    };
  }, 120);

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

let calView = new Date();
calView.setDate(1);

let calSelected = new Date();

function updateCalHeader(){
  const now = new Date();
  if (calTime) calTime.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  if (calDate) calDate.textContent = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: '2-digit', year: 'numeric'
  }).format(now);
  if (calSub) calSub.textContent = 'Local time • Click a date to select';
}

function renderCalendar(){
  if (!calMonth || !calGrid) return;

  const y = calView.getFullYear();
  const m = calView.getMonth();

  calMonth.textContent = new Intl.DateTimeFormat('en-US', {
    month: 'long', year: 'numeric'
  }).format(new Date(y, m, 1));

  calGrid.innerHTML = '';

  const first = new Date(y, m, 1);
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

updateCalHeader();
renderCalendar();
setInterval(updateCalHeader, 250);

async function loadResumeJson(){
  const el = document.getElementById('resumeAuto');
  if (!el) return;

  try{
    // cache-bust so GitHub Pages
    const res = await fetch(`./resume.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    el.textContent = data.text || '(No text extracted)';
  }catch(e){
    console.error(e);
    el.textContent = 'Failed to load resume.json. Make sure GitHub Actions generated it.';
  }
}
loadResumeJson();
