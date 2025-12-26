// 1) Scroll reveal (IntersectionObserver)
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.12 }
);
revealEls.forEach((el) => io.observe(el));

// 2) Mouse-follow highlight on card
const card = document.querySelector(".highlight");
if (card) {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    card.style.setProperty("--mx", `${x}%`);
    card.style.setProperty("--my", `${y}%`);
  });
}

// 3) Button ripple effect
document.querySelectorAll(".btn.ripple").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const dot = document.createElement("span");
    dot.className = "rippleDot";
    const r = btn.getBoundingClientRect();
    dot.style.left = `${e.clientX - r.left}px`;
    dot.style.top = `${e.clientY - r.top}px`;
    btn.appendChild(dot);
    setTimeout(() => dot.remove(), 650);
  });
});
