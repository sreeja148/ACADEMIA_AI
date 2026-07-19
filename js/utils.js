/* ============================================================
   ACADEMIA — UI Utilities
   ============================================================ */

function toast(message, kind = "info") {
  const host = document.getElementById("toastHost");
  const el = document.createElement("div");
  el.className = `toast toast--${kind}`;
  const icon = kind === "success" ? "check-circle" : kind === "warning" ? "alert-triangle" : kind === "danger" ? "x-circle" : "info";
  el.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  lucide.createIcons();
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3600);
}

function starRow(value, max = 5) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  let out = "";
  for (let i = 0; i < max; i++) {
    if (i < full) out += `<i data-lucide="star" class="star star--full"></i>`;
    else if (i === full && half) out += `<i data-lucide="star-half" class="star star--full"></i>`;
    else out += `<i data-lucide="star" class="star"></i>`;
  }
  return `<span class="star-row">${out}</span>`;
}

function traitBar(label, value, max = 5) {
  const pct = (value / max) * 100;
  return `
    <div class="trait-bar">
      <div class="trait-bar__head"><span>${label}</span><span class="trait-bar__val">${value.toFixed(1)}</span></div>
      <div class="trait-bar__track"><div class="trait-bar__fill" style="width:${pct}%"></div></div>
    </div>`;
}

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function el(tag, attrs = {}, html = "") {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  node.innerHTML = html;
  return node;
}

function debounce(fn, wait = 220) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function skeletonCards(n = 3) {
  return Array.from({ length: n }).map(() => `
    <div class="card skeleton-card">
      <div class="skel skel-line w-60"></div>
      <div class="skel skel-line w-40"></div>
      <div class="skel skel-block"></div>
    </div>`).join("");
}

function refreshIcons() { lucide.createIcons(); }
