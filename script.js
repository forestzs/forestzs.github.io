// ===== Data (from your sliderData) =====
// You can keep your original list exactly; image paths must exist in /images.
// Source: your carousel HTML :contentReference[oaicite:11]{index=11}
const sliderData = [
  { url: './images/qishen.jpg', title: '旅行者，快来啊！一起休息一下吧...', color: 'rgb(181, 192, 184)' },
  { url: './images/wendi.jpg', title: '风会带走你的忧虑，也会带来新的故事和冒险~', color: 'rgb(62, 150, 126)' },
  { url: './images/keqing.jpg', title: '剑光如我,斩尽芜杂!', color: 'rgb(90, 78, 116)' },
  { url: './images/zhongli.jpg', title: '欲买桂花同载酒,只可惜故人何日再见呢？', color: 'rgb(210, 158, 78)' },
  { url: './images/ganyu.jpg', title: '啊,琉璃百合的味道,真好啊！', color: 'rgb(96, 111, 191)' },
  { url: './images/leidian.jpg', title: '浮世景色百千年依旧,人之在世却如白露与泡影！', color: 'rgb(153, 119, 217)' },
  { url: './images/shenzi.jpg', title: '我的神明，就托付给你了！', color: 'rgb(185, 95, 84)' },
  { url: './images/naxida.jpg', title: '你相信草神的存在吗？我曾在梦中见过她', color: 'rgb(130, 148, 124)' },
  { url: './images/nilu.jpg', title: '舞姿娉婷，如睡莲初绽，一尘不染~', color: 'rgb(33, 166, 218)' },
  { url: './images/funingna.jpg', title: '雨露不休，百川奔流!', color: 'rgb(136, 151, 184)' },
  { url: './images/naweiya.jpg', title: '和朋友分享的秘密不是更加珍贵吗?', color: 'rgb(202, 159, 116)' }
];

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

  // Cross-fade image
  bgImg.style.opacity = '0';
  setTimeout(() => {
    bgImg.src = item.url;
    bgImg.onload = () => {
      bgImg.style.opacity = '1';
      bgImg.style.transform = 'scale(1.06)'; // subtle living background
      setTimeout(() => (bgImg.style.transform = 'scale(1.04)'), 600);
    };
  }, 120);

  bgCaption.textContent = item.title;
  setAccent(item.color);

  // Show clock after first slide (same idea as your original code)
  // Source: original toggles clock display :contentReference[oaicite:12]{index=12}
  if (idx !== 0) {
    bgClock.style.display = 'block';
    bgClock.style.borderColor = 'color-mix(in oklab, var(--accent) 65%, rgba(255,255,255,.18))';
  } else {
    bgClock.style.display = 'none';
  }
}

function startTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    i += 1;
    render(i);
  }, 3500);
}

prevBtn.addEventListener('click', () => {
  i -= 1;
  render(i);
  startTimer();
});

nextBtn.addEventListener('click', () => {
  i += 1;
  render(i);
  startTimer();
});

// Pause on hover background (optional)
bgImg.addEventListener('mouseenter', () => timer && clearInterval(timer));
bgImg.addEventListener('mouseleave', startTimer);

// Clock (fix your original "strong selector" issue)
function updateClock() {
  const d = new Date();
  const dayMap = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  clockText.innerHTML = `${dayMap[d.getDay()]}<br>${d.toLocaleTimeString()}<br>${d.toLocaleDateString()}`;
}
setInterval(updateClock, 250);
updateClock();

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) e.target.classList.add('is-in');
  }
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Init
render(0);
startTimer();
