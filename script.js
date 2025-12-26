// script.js
(function () {
  const $ = (id) => document.getElementById(id);

  // =========================
  // 1) Reveal animation
  // =========================
  const revealEls = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-in");
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));

  // =========================
  // 2) Footer year
  // =========================
  const yearEl = $("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // =========================
  // 3) Accent color from background image -> Resume button
  // =========================
  const resumeBtn = document.querySelector(".btn--primary"); // your Resume button

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  }

  function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  function averageColorFromImage(imgEl) {
    // Downsample for speed
    const w = 48, h = 48;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    ctx.drawImage(imgEl, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    let r = 0, g = 0, b = 0, cnt = 0;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 20) continue;

      const rr = data[i], gg = data[i + 1], bb = data[i + 2];

      // ignore near-white & near-black pixels to get "theme" color
      const bright = (rr + gg + bb) / 3;
      if (bright > 245 || bright < 10) continue;

      r += rr; g += gg; b += bb; cnt++;
    }

    if (!cnt) {
      // fallback: just average all pixels
      r = g = b = 0; cnt = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2];
        cnt++;
      }
    }

    return {
      r: Math.round(r / cnt),
      g: Math.round(g / cnt),
      b: Math.round(b / cnt),
    };
  }

  function applyAccentToResumeButton(rgb) {
    if (!resumeBtn) return;

    // Make it look consistent: slightly boost saturation, clamp lightness
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const tuned = hslToRgb(
      hsl.h,
      clamp(hsl.s * 1.15, 0.35, 0.85),
      clamp(hsl.l, 0.34, 0.55)
    );

    // update CSS variables (optional but useful)
    document.documentElement.style.setProperty(
      "--accent-rgb",
      `${tuned.r} ${tuned.g} ${tuned.b}`
    );

    // directly set button style (guaranteed to work)
    resumeBtn.style.background = `rgba(${tuned.r}, ${tuned.g}, ${tuned.b}, 0.40)`;
    resumeBtn.style.borderColor = `rgba(${tuned.r}, ${tuned.g}, ${tuned.b}, 0.70)`;
    resumeBtn.style.boxShadow = `0 10px 30px rgba(${tuned.r}, ${tuned.g}, ${tuned.b}, 0.18)`;
  }

  function updateAccentFromBgImage(bgImgEl) {
    try {
      const rgb = averageColorFromImage(bgImgEl);
      applyAccentToResumeButton(rgb);
    } catch (e) {
      // if canvas fails for any reason, do nothing
      console.warn("[accent] failed:", e);
    }
  }

  // =========================
  // 4) Background slider (robust)
  // =========================
  const bgImg = $("bgImg");
  // ✅ 兼容两套 id
  const bgPrevBtn = $("bgPrevBtn") || $("prevBtn");
  const bgNextBtn = $("bgNextBtn") || $("nextBtn");

  // ✅ 你的真实图片
  const rawImages = [
    "./images/qishen.jpg",
    "./images/funingna.jpg",
    "./images/ganyu.jpg",
    "./images/keqing.jpg",
    "./images/leidian.jpg",
    "./images/naweiya.jpg",
    "./images/naxida.jpg",
    "./images/nilu.jpg",
    "./images/shenzi.jpg",
    "./images/wendi.jpg",
    "./images/zhongli.jpg",
  ];

  const intervalMs = 6000;
  let bgIdx = 0;
  let bgTimer = null;
  let bgImages = []; // only valid-loaded images

  function preloadOne(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ src, ok: true });
      img.onerror = () => resolve({ src, ok: false });
      img.src = src;
    });
  }

  async function initBgImages() {
    if (!bgImg) return;

    const results = await Promise.all(rawImages.map(preloadOne));
    bgImages = results.filter((r) => r.ok).map((r) => r.src);

    if (bgImages.length === 0) {
      bgImages = [bgImg.getAttribute("src") || "./images/qishen.jpg"];
    }

    // align index to current src if possible
    const cur = bgImg.getAttribute("src") || "";
    const found = bgImages.findIndex((p) => cur.includes(p.replace("./", "")) || cur === p);
    bgIdx = found >= 0 ? found : 0;

    // ensure accent updates even on first load
    bgImg.addEventListener("load", () => updateAccentFromBgImage(bgImg));

    setBg(bgIdx, true);
    startBgAuto();
  }

  function setBg(i, immediate = false) {
    if (!bgImg || bgImages.length === 0) return;

    bgIdx = (i + bgImages.length) % bgImages.length;
    const nextSrc = bgImages[bgIdx];

    if (immediate) {
      bgImg.style.opacity = "1";
      bgImg.src = nextSrc;
      // accent will update via load event
      return;
    }

    bgImg.style.opacity = "0";
    setTimeout(() => {
      bgImg.src = nextSrc;
      bgImg.style.opacity = "1";
      // accent will update via load event
    }, 180);
  }

  function bgNext() { setBg(bgIdx + 1); }
  function bgPrev() { setBg(bgIdx - 1); }

  function stopBgAuto() {
    if (bgTimer) {
      clearInterval(bgTimer);
      bgTimer = null;
    }
  }

  function startBgAuto() {
    stopBgAuto();
    if (bgImages.length < 2) return;
    bgTimer = setInterval(bgNext, intervalMs);
  }

  if (bgPrevBtn) {
    bgPrevBtn.addEventListener("click", () => {
      bgPrev();
      startBgAuto();
    });
  }
  if (bgNextBtn) {
    bgNextBtn.addEventListener("click", () => {
      bgNext();
      startBgAuto();
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopBgAuto();
    else startBgAuto();
  });

  initBgImages();

  // =========================
  // 5) Calendar (simple)
  // =========================
  const calTime = $("calTime");
  const calDate = $("calDate");
  const calMonth = $("calMonth");
  const calGrid = $("calGrid");
  const calPrev = $("calPrev");
  const calNext = $("calNext");
  const calToday = $("calToday");

  let view = new Date();
  let selected = null;

  function pad(n) { return String(n).padStart(2, "0"); }

  function fmtDateLine(d) {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function tickClock() {
    const now = new Date();
    if (calTime) calTime.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    if (calDate) calDate.textContent = fmtDateLine(now);
  }

  function renderCalendar() {
    if (!calGrid || !calMonth) return;

    const year = view.getFullYear();
    const month = view.getMonth();

    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    calMonth.textContent = `${monthNames[month]} ${year}`;

    calGrid.innerHTML = "";

    // Monday-first grid
    const first = new Date(year, month, 1);
    const firstDow = (first.getDay() + 6) % 7; // Mon=0
    const start = new Date(year, month, 1 - firstDow);

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const selKey = selected ? `${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}` : "";

    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal__cell";
      btn.textContent = String(d.getDate());

      const dKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (d.getMonth() !== month) btn.classList.add("is-other");
      if (dKey === todayKey) btn.classList.add("is-today");
      if (selKey && dKey === selKey) btn.classList.add("is-selected");

      btn.addEventListener("click", () => {
        selected = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        renderCalendar();
      });

      calGrid.appendChild(btn);
    }
  }

  if (calPrev) calPrev.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCalendar(); });
  if (calNext) calNext.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCalendar(); });
  if (calToday) calToday.addEventListener("click", () => { view = new Date(); selected = new Date(); renderCalendar(); });

  tickClock();
  setInterval(tickClock, 1000);
  renderCalendar();
})();
