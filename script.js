// script.js
(() => {
  const $ = (id) => document.getElementById(id);

  // =========================
  // 1) Background slider
  // =========================
  const bgImg = $("bgImg");
  const prevBtn = $("prevBtn");
  const nextBtn = $("nextBtn");

  
  const images = [
    "./images/qishen.jpg",
    // "./images/xxx.jpg",
    // "./images/yyy.jpg",
  ];

  let idx = 0;
  let timer = null;
  const intervalMs = 9000;

  
  if (bgImg) {
    const curSrc = bgImg.getAttribute("src") || "";
    const found = images.findIndex((p) => curSrc.endsWith(p.replace("./", "")) || curSrc === p);
    if (found >= 0) idx = found;
  }

  function safeIndex(i) {
    const n = images.length;
    return ((i % n) + n) % n;
  }

  function show(i) {
    if (!bgImg || images.length === 0) return;
    idx = safeIndex(i);

    // fade out -> swap -> fade in
    bgImg.style.opacity = "0";
    window.setTimeout(() => {
      bgImg.src = images[idx];
      bgImg.style.opacity = "1";
    }, 180);
  }

  function next() {
    show(idx + 1);
  }
  function prev() {
    show(idx - 1);
  }

  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function startAuto() {
    stopAuto();
    if (images.length <= 1) return;
    timer = setInterval(next, intervalMs);
  }

  
  if (prevBtn) prevBtn.addEventListener("click", () => { prev(); startAuto(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { next(); startAuto(); });

  
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  
  if (bgImg && images.length > 0) {
    bgImg.style.opacity = "1";
    startAuto();
  }

  // =========================
  // 2) Reveal animation
  // =========================
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-in");
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  // =========================
  // 3) Footer year
  // =========================
  const yearEl = $("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // =========================
  // 4) Calendar widget
  // =========================
  const calTime = $("calTime");
  const calDate = $("calDate");
  const calSub  = $("calSub");
  const calMonth = $("calMonth");
  const calGrid = $("calGrid");
  const calPrev = $("calPrev");
  const calNext = $("calNext");
  const calToday = $("calToday");
  
  if (calSub) calSub.textContent = "";

  let view = new Date(); // month view
  let selectedKey = "";

  const pad2 = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  function renderClock() {
    const now = new Date();
    if (calTime) calTime.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
    if (calDate) {
      const fmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" });
      calDate.textContent = fmt.format(now);
    }
  }

  function renderMonth() {
    if (!calGrid || !calMonth) return;
    calGrid.innerHTML = "";

    const y = view.getFullYear();
    const m = view.getMonth();

    const monthName = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(y, m, 1));
    calMonth.textContent = monthName;

    // calendar starts Monday
    const first = new Date(y, m, 1);
    const firstDow = (first.getDay() + 6) % 7; // Mon=0..Sun=6

    const start = new Date(y, m, 1 - firstDow);
    const todayKey = keyOf(new Date());

    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cal__cell";
      cell.textContent = String(d.getDate());

      const k = keyOf(d);

      if (d.getMonth() !== m) cell.classList.add("is-other");
      if (k === todayKey) cell.classList.add("is-today");
      if (k === selectedKey) cell.classList.add("is-selected");

      cell.addEventListener("click", () => {
        selectedKey = k;
        renderMonth();
      });

      calGrid.appendChild(cell);
    }
  }

  if (calPrev) calPrev.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderMonth(); });
  if (calNext) calNext.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderMonth(); });
  if (calToday) calToday.addEventListener("click", () => { view = new Date(); selectedKey = keyOf(new Date()); renderMonth(); });

  renderClock();
  setInterval(renderClock, 1000);
  renderMonth();

})();
