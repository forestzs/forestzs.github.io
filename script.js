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
  // 3) Background slider (robust)
  // =========================
  const bgImg = $("bgImg");
  const bgPrevBtn = $("bgPrevBtn");
  const bgNextBtn = $("bgNextBtn");

  // ✅ 改成你仓库 images/ 里真实存在的文件名
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

  function log(...args) {
    console.log("[bg]", ...args);
  }

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

    log("preload results:", results);
    log("valid images:", bgImages);

    if (bgImages.length === 0) {
      // fallback: at least keep current src
      bgImages = [bgImg.getAttribute("src") || "./images/qishen.jpg"];
      log("fallback to current src only:", bgImages);
    }

    // align index to current src if possible
    const cur = bgImg.getAttribute("src") || "";
    const found = bgImages.findIndex((p) => cur.includes(p.replace("./", "")) || cur === p);
    bgIdx = found >= 0 ? found : 0;

    setBg(bgIdx, true);
    startBgAuto();
  }

  function setBg(i, immediate = false) {
    if (!bgImg || bgImages.length === 0) return;

    bgIdx = (i + bgImages.length) % bgImages.length;
    const nextSrc = bgImages[bgIdx];

    log("switch ->", bgIdx, nextSrc);

    if (immediate) {
      bgImg.style.opacity = "1";
      bgImg.src = nextSrc;
      return;
    }

    // fade
    bgImg.style.opacity = "0";
    setTimeout(() => {
      bgImg.src = nextSrc;
      bgImg.style.opacity = "1";
    }, 180);
  }

  function bgNext() { setBg(bgIdx + 1); }
  function bgPrev() { setBg(bgIdx - 1); }

  function stopBgAuto() {
    if (bgTimer) {
      clearInterval(bgTimer);
      bgTimer = null;
      log("auto stopped");
    }
  }

  function startBgAuto() {
    stopBgAuto();
    if (bgImages.length < 2) {
      log("auto disabled, need >=2 valid images. current =", bgImages.length);
      return;
    }
    bgTimer = setInterval(bgNext, intervalMs);
    log("auto started interval =", intervalMs);
  }

  if (bgPrevBtn) {
    bgPrevBtn.addEventListener("click", () => {
      bgPrev();
      startBgAuto();
    });
  } else {
    log("bgPrevBtn not found");
  }

  if (bgNextBtn) {
    bgNextBtn.addEventListener("click", () => {
      bgNext();
      startBgAuto();
    });
  } else {
    log("bgNextBtn not found");
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopBgAuto();
    else startBgAuto();
  });

  initBgImages();

  // =========================
  // 4) Projects carousel (single card)
  // =========================
  const projTitle = $("projTitle");
  const projTime = $("projTime");
  const projBullets = $("projBullets");
  const projPrevBtn = $("projPrevBtn");
  const projNextBtn = $("projNextBtn");

  const projects = [
    {
      title: "Twitch Game Web App",
      time: "May 2025 – Jun 2025",
      bullets: [
        "Full-stack game streaming web; browse 1000+ Twitch streams/videos/clips via Twitch APIs.",
        "Spring Security + MySQL auth with role-based access.",
        "50+ JUnit tests; 90%+ coverage; deployed on AWS App Runner + Aurora RDS + ECR.",
      ],
    },
    {
      title: "Food Management & Ordering Web App",
      time: "Jul 2024 – Aug 2024",
      bullets: [
        "Spring Boot backend with auth/RBAC + real-time order status.",
        "Vue.js admin frontend; clear API contracts for smoother integration.",
        "Redis caching + MySQL: reduced DB load ~40%; latency 800ms → 480ms.",
      ],
    },
    {
      title: "BookingHouse Web App",
      time: "Jul 2025 – Aug 2025",
      bullets: [
        "Spring Boot + PostgreSQL + Hibernate Spatial for radius-based geo search over 10,000+ records (sub-200ms).",
        "React + Ant Design frontend with validation + async flows; RESTful integration via Fetch.",
        "JWT stateless auth + booking conflict checks + transaction-safe updates.",
      ],
    },
    {
      title: "EasyAI Web App",
      time: "Jun 2025 – Jul 2025",
      bullets: [
        "Java + LangChain RAG assistant on PDFs up to 50MB.",
        "Vector indexing pipeline; 90% responses under 2s while keeping relevance.",
        "Routing/caching reduced API latency ~40% during peaks; supports voice queries & history.",
      ],
    },
  ];

  let projIdx = 0;

  function renderProject(i) {
    if (!projTitle || !projTime || !projBullets) return;
    if (!projects.length) return;

    projIdx = (i + projects.length) % projects.length;
    const p = projects[projIdx];

    projTitle.textContent = p.title;
    projTime.textContent = p.time;

    projBullets.innerHTML = "";
    p.bullets.forEach((b) => {
      const li = document.createElement("li");
      li.textContent = b;
      projBullets.appendChild(li);
    });
  }

  if (projPrevBtn) projPrevBtn.addEventListener("click", () => renderProject(projIdx - 1));
  if (projNextBtn) projNextBtn.addEventListener("click", () => renderProject(projIdx + 1));
  renderProject(0);

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
