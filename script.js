// script.js

// ============================
// A) Background slider
// ============================
const sliderData = [
  { url: './images/qishen.jpg', title: 'Come on, Traveler—take a break with me for a while...', color: 'rgb(181, 192, 184)' },
  { url: './images/wendi.jpg', title: 'The wind will carry away your worries—and bring new stories and adventures.', color: 'rgb(62, 150, 126)' },
  { url: './images/keqing.jpg', title: 'My blade is like lightning—cutting through all that is impure!', color: 'rgb(90, 78, 116)' },
  { url: './images/zhongli.jpg', title: 'If only we could buy osmanthus wine and share it again… when will we meet once more?', color: 'rgb(210, 158, 78)' },
  { url: './images/ganyu.jpg', title: 'Ah… the scent of Glaze Lilies. So soothing.', color: 'rgb(96, 111, 191)' },
  { url: './images/leidian.jpg', title: 'The scenery remains for millennia, yet human life is but dew and bubbles.', color: 'rgb(153, 119, 217)' },
  { url: './images/shenzi.jpg', title: 'My god… I entrust them to you.', color: 'rgb(185, 95, 84)' },
  { url: './images/naxida.jpg', title: 'Do you believe the Dendro Archon exists? I’ve seen her in my dreams.', color: 'rgb(130, 148, 124)' },
  { url: './images/nilu.jpg', title: 'Graceful as a lotus bloom—pure and untouched.', color: 'rgb(33, 166, 218)' },
  { url: './images/funingna.jpg', title: 'Rain never ceases; rivers keep flowing!', color: 'rgb(136, 151, 184)' },
  { url: './images/naweiya.jpg', title: 'Isn’t a secret shared with friends even more precious?', color: 'rgb(202, 159, 116)' }
];

const bgImg = document.getElementById('bgImg');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let i = 0;
let timer = null;

function normIndex(index) {
  const n = sliderData.length;
  return ((index % n) + n) % n;
}
function setAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
}

function renderBg(index) {
  const item = sliderData[normIndex(index)];
  if (!bgImg) return;

  bgImg.style.opacity = '0';
  setTimeout(() => {
    bgImg.src = item.url;

    // avoid caching issues when you replace images with same filename:
    // bgImg.src = `${item.url}?v=${Date.now()}`;

    bgImg.onload = () => {
      bgImg.style.opacity = '1';
      bgImg.style.transform = 'scale(1.06)';
      setTimeout(() => (bgImg.style.transform = 'scale(1.04)'), 600);
    };
  }, 120);

  setAccent(item.color);
}

function startBgTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    i += 1;
    renderBg(i);
  }, 3500);
}

prevBtn?.addEventListener('click', () => { i -= 1; renderBg(i); startBgTimer(); });
nextBtn?.addEventListener('click', () => { i += 1; renderBg(i); startBgTimer(); });

// init bg
renderBg(0);
startBgTimer();


// ============================
// B) Resume JSON -> bind to existing layout
// ============================
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

function chip(text) {
  const s = document.createElement('span');
  s.className = 'chip';
  s.textContent = text;
  return s;
}

function renderEducation(list) {
  const eduList = document.getElementById('eduList');
  if (!eduList) return;
  eduList.innerHTML = '';

  (list || []).forEach((e) => {
    const wrap = document.createElement('div');
    wrap.className = 'edu__item';

    const title = document.createElement('div');
    title.className = 'edu__title';
    title.textContent = e.school || '';

    const muted = document.createElement('div');
    muted.className = 'muted';
    // keep your original style: one line under school
    const parts = [e.degree, e.dates].filter(Boolean).join(' • ');
    muted.textContent = parts;

    wrap.appendChild(title);
    wrap.appendChild(muted);
    eduList.appendChild(wrap);
  });
}

function renderSkills(skills) {
  const langs = document.getElementById('skillsLanguages');
  const frms  = document.getElementById('skillsFrameworks');
  const tools = document.getElementById('skillsTools');

  if (langs) { langs.innerHTML = ''; (skills?.languages || []).forEach(x => langs.appendChild(chip(x))); }
  if (frms)  { frms.innerHTML  = ''; (skills?.frameworks || []).forEach(x => frms.appendChild(chip(x))); }
  if (tools) { tools.innerHTML = ''; (skills?.tools || []).forEach(x => tools.appendChild(chip(x))); }
}

function renderProjects(projects) {
  const box = document.getElementById('projectsList');
  if (!box) return;
  box.innerHTML = '';

  (projects || []).forEach((p) => {
    const article = document.createElement('article');
    article.className = 'project';

    const head = document.createElement('div');
    head.className = 'project__head';

    const t = document.createElement('div');
    t.className = 'project__title';
    t.textContent = p.name || '';

    const time = document.createElement('div');
    time.className = 'project__time';
    time.textContent = p.dates || '';

    head.appendChild(t);
    head.appendChild(time);

    const ul = document.createElement('ul');
    ul.className = 'ul';
    (p.bullets || []).forEach((b) => {
      const li = document.createElement('li');
      li.textContent = b;
      ul.appendChild(li);
    });

    article.appendChild(head);
    article.appendChild(ul);
    box.appendChild(article);
  });
}

function applyResume(data) {
  // Basics
  const nameEl = document.getElementById('nameEl');
  const titleEl = document.getElementById('titleEl');
  const phoneEl = document.getElementById('phoneEl');
  const locationEl = document.getElementById('locationEl');
  const emailTextEl = document.getElementById('emailTextEl');
  const summaryEl = document.getElementById('summaryEl');

  const githubLink = document.getElementById('githubLink');
  const linkedinLink = document.getElementById('linkedinLink');
  const emailLink = document.getElementById('emailLink');

  if (nameEl && data?.basics?.name) nameEl.textContent = data.basics.name;
  if (titleEl && data?.basics?.title) titleEl.textContent = data.basics.title;
  if (phoneEl && data?.basics?.phone) phoneEl.textContent = data.basics.phone;
  if (locationEl && data?.basics?.location) locationEl.textContent = data.basics.location;
  if (emailTextEl && data?.basics?.email) emailTextEl.textContent = data.basics.email;
  if (summaryEl && data?.summary) summaryEl.textContent = data.summary;

  if (githubLink && data?.basics?.github) githubLink.href = data.basics.github;
  if (linkedinLink && data?.basics?.linkedin) linkedinLink.href = data.basics.linkedin;
  if (emailLink && data?.basics?.email) emailLink.href = `mailto:${data.basics.email}`;

  // Sections
  renderEducation(data?.education || []);
  renderSkills(data?.skills || {});
  renderProjects(data?.projects || []);
}

async function loadResumeJson() {
  try {
    // no-store avoids the "I updated json but page didn't change" cache issue
    const res = await fetch('./resume.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`resume.json fetch failed: ${res.status}`);
    const data = await res.json();
    applyResume(data);
  } catch (e) {
    console.warn('resume.json not loaded, using hardcoded HTML:', e);
  }
}

loadResumeJson();


// ============================
// C) Calendar widget (Top-right)
// ============================
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

let calView = new Date(); calView.setDate(1);
let calSelected = new Date();

function updateCalHeader(){
  if (!calTime || !calDate) return;
  const now = new Date();
  calTime.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  calDate.textContent = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: '2-digit', year: 'numeric'
  }).format(now);
}

function renderCalendar(){
  if (!calMonth || !calGrid) return;

  const y = calView.getFullYear();
  const m = calView.getMonth();

  calMonth.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
    .format(new Date(y, m, 1));

  calGrid.innerHTML = '';

  const first = new Date(y, m, 1);
  const shift = (first.getDay() + 6) % 7; // Monday=0
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


// ============================
// D) Reveal on scroll
// ============================
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) e.target.classList.add('is-in');
  }
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));
