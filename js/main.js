/* ============================================================
   ACADEMIA — App Bootstrap
   Auth flow (mocked), theme toggle, modals, global search wiring.
   ============================================================ */

let currentRole = "student";

/* ---------------- Theme ---------------- */
function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  const icon = document.querySelector("#themeToggle i");
  if (icon) icon.setAttribute("data-lucide", mode === "dark" ? "sun" : "moon");
  refreshIcons();
  try { localStorage.setItem("academia-theme", mode); } catch (e) {}
  // re-render charts so colors pick up new theme
  if (document.getElementById("appShell") && !document.getElementById("appShell").classList.contains("hidden")) {
    Router.render();
  }
}
(function initTheme() {
  let saved = "light";
  try { saved = localStorage.getItem("academia-theme") || "light"; } catch (e) {}
  document.documentElement.setAttribute("data-theme", saved);
})();

/* ---------------- Modal ---------------- */
function openModal(html) {
  document.getElementById("modalBody").innerHTML = html;
  document.getElementById("modalBackdrop").classList.add("show");
  refreshIcons();
}
function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("show");
}
document.getElementById("modalBackdrop").addEventListener("click", (e) => {
  if (e.target.id === "modalBackdrop") closeModal();
});

function openProfessorModal(profId) {
  const p = findProfessor(profId);
  if (!p) return;
  openModal(`
    <div class="modal__head">
      <div class="flex items-center gap-12">
        <div class="avatar" style="width:44px;height:44px;">${p.photoInitials}</div>
        <div>
          <h3 style="font-size:17px;">${p.name}</h3>
          <div class="small text-muted">${p.title} · ${findDept(p.dept).name}</div>
        </div>
      </div>
      <button class="btn-icon" id="closeModalBtn"><i data-lucide="x"></i></button>
    </div>
    <div class="flex items-center gap-8 mt-8">${starRow(avgRating(p.id))}<span class="small text-muted">${avgRating(p.id).toFixed(1)} · ${p.ratingCount} ratings</span></div>
    <p class="small text-muted mt-16">${p.bio}</p>
    <div class="mt-16"><i data-lucide="clock" style="width:13px;height:13px;vertical-align:-2px;"></i> <span class="small text-muted">${p.officeHours}</span></div>
    <div class="chart-box mt-16" style="height:200px;"><canvas id="modalRadar"></canvas></div>
    <button class="btn btn-primary mt-16" id="modalCloseBottom">Close</button>
  `);
  renderProfTraitRadar("modalRadar", p);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("modalCloseBottom").addEventListener("click", closeModal);
}

function openReviewModal() {
  const options = DB.professors.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  openModal(`
    <div class="modal__head">
      <h3 style="font-size:17px;">Write a Review</h3>
      <button class="btn-icon" id="closeModalBtn"><i data-lucide="x"></i></button>
    </div>
    <div class="field"><label>Professor</label><select id="rvProf">${options}</select></div>
    <div class="field"><label>Rating</label>
      <select id="rvRating"><option value="5">★★★★★ Excellent</option><option value="4">★★★★☆ Good</option><option value="3">★★★☆☆ Average</option><option value="2">★★☆☆☆ Below Average</option><option value="1">★☆☆☆☆ Poor</option></select>
    </div>
    <div class="field"><label>Pros</label><textarea id="rvPros" rows="2" placeholder="What worked well?"></textarea></div>
    <div class="field"><label>Cons</label><textarea id="rvCons" rows="2" placeholder="What could improve?"></textarea></div>
    <label class="small text-muted flex items-center gap-8" style="margin-bottom:16px;"><input type="checkbox" id="rvAnon" checked style="margin-right:6px"/>Post anonymously</label>
    <button class="btn btn-primary" id="submitReviewBtn"><i data-lucide="send" style="width:15px;height:15px"></i> Submit Review</button>
  `);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("submitReviewBtn").addEventListener("click", () => {
    const profId = document.getElementById("rvProf").value;
    const rating = +document.getElementById("rvRating").value;
    const pros = document.getElementById("rvPros").value.trim() || "No comment provided.";
    const cons = document.getElementById("rvCons").value.trim() || "No comment provided.";
    const anonymous = document.getElementById("rvAnon").checked;
    DB.reviews.unshift({ id: "r" + Date.now(), profId, author: anonymous ? "Anonymous" : DB.currentStudent.name, anonymous, rating, pros, cons, upvotes: 0, date: new Date().toISOString().slice(0, 10) });
    closeModal();
    toast("Review submitted — thank you!", "success");
    Router.render();
  });
}

function openForgotPasswordModal() {
  openModal(`
    <div class="modal__head">
      <h3 style="font-size:17px;">Reset your password</h3>
      <button class="btn-icon" id="closeModalBtn"><i data-lucide="x"></i></button>
    </div>
    <p class="small text-muted" style="margin-bottom:16px;">Enter the email on your account and we'll send a reset link.</p>
    <div class="field"><label>Email</label><input type="email" placeholder="you@university.edu"/></div>
    <button class="btn btn-primary" id="sendResetBtn"><i data-lucide="mail" style="width:15px;height:15px"></i> Send Reset Link</button>
  `);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("sendResetBtn").addEventListener("click", () => { closeModal(); toast("Reset link sent — check your inbox", "success"); });
}

/* ---------------- Notifications panel ---------------- */
function refreshNotifDot() {
  const dot = document.getElementById("notifDot");
  const unread = DB.notifications.some(n => n.unread);
  dot.style.display = unread ? "block" : "none";
}

/* ---------------- Auth screen wiring ---------------- */
const roleTabs = document.querySelectorAll(".role-tab");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authSwitch = document.getElementById("authSwitch");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
let authMode = "login";
let authRole = "student";

function updateAuthCopy() {
  const roleLabel = authRole[0].toUpperCase() + authRole.slice(1);
  if (authMode === "login") {
    authTitle.textContent = `Sign in to Academia`;
    authSubtitle.textContent = `${roleLabel} access · use any email & password to explore the demo.`;
    loginForm.classList.remove("hidden"); registerForm.classList.add("hidden");
    authSwitch.innerHTML = authRole === "student"
      ? `<div style="text-align:center; margin-top:20px;"><span class="small text-muted" style="display:block; margin-bottom:8px;">New here?</span><button type="button" class="btn btn-ghost" id="toRegister" style="width:100%;">Create a student account</button></div>`
      : `<p class="small text-muted" style="text-align:center; margin-top:20px;">Contact your department admin for ${authRole} access.</p>`;
    if (document.getElementById("toRegister")) document.getElementById("toRegister").addEventListener("click", () => { authMode = "register"; updateAuthCopy(); });
  } else {
    authTitle.textContent = "Create your student account";
    authSubtitle.textContent = "Set up your profile to get personalized recommendations.";
    loginForm.classList.add("hidden"); registerForm.classList.remove("hidden");
    authSwitch.innerHTML = `<div style="text-align:center; margin-top:20px;"><span class="small text-muted" style="display:block; margin-bottom:8px;">Already have an account?</span><button type="button" class="btn btn-ghost" id="toLogin" style="width:100%;">Sign in</button></div>`;
    document.getElementById("toLogin").addEventListener("click", () => { authMode = "login"; updateAuthCopy(); });
  }
}

roleTabs.forEach(tab => tab.addEventListener("click", () => {
  roleTabs.forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  authRole = tab.dataset.role;
  authMode = "login";
  updateAuthCopy();
}));

document.getElementById("forgotLink").addEventListener("click", (e) => { e.preventDefault(); openForgotPasswordModal(); });

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  enterApp(authRole);
});
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value || "New Student";
  DB.currentStudent.name = name;
  toast(`Welcome to Academia, ${name.split(" ")[0]}!`, "success");
  enterApp("student");
});

function enterApp(role) {
  currentRole = role;
  if (role === "professor") DB.currentProfessor = DB.professors[0];
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  renderSidebarUser(role);
  refreshNotifDot();
  Router.init(role);
  toast(`Signed in as ${role[0].toUpperCase() + role.slice(1)}`, "success");
}

function renderSidebarUser(role) {
  const host = document.getElementById("sidebarUser");
  let name, sub, ini;
  if (role === "student") { name = DB.currentStudent.name; sub = DB.currentStudent.major; ini = initials(name); }
  else if (role === "professor") { name = DB.currentProfessor.name; sub = DB.currentProfessor.title; ini = DB.currentProfessor.photoInitials; }
  else { name = "System Admin"; sub = "Registrar's Office"; ini = "SA"; }
  host.innerHTML = `<div class="avatar">${ini}</div><div><p>${name}</p><span>${sub}</span></div>`;
}

const handleLogout = () => {
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");
  toast("Signed out", "info");
};
document.getElementById("logoutBtn").addEventListener("click", handleLogout);
document.getElementById("topbarLogoutBtn").addEventListener("click", handleLogout);

/* ---------------- Topbar: theme, search, notifications, menu ---------------- */
document.getElementById("themeToggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

document.getElementById("globalSearch").addEventListener("input", debounce((e) => {
  Router.state.query = e.target.value;
  if (currentRole === "student" && Router.view !== "courses") Router.navigate("courses");
  else if (currentRole === "admin" && !["students", "professors", "courses"].includes(Router.view)) { /* no-op */ }
  else Router.render();
}, 250));

document.getElementById("notifBtn").addEventListener("click", () => {
  if (currentRole === "student") { Router.navigate("notifications"); return; }
  const items = DB.notifications.slice(0, 5).map(notifRow).join("");
  openModal(`
    <div class="modal__head"><h3 style="font-size:17px;">Notifications</h3><button class="btn-icon" id="closeModalBtn"><i data-lucide="x"></i></button></div>
    ${items}
  `);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
});

const menuToggle = document.getElementById("menuToggle");
menuToggle.style.display = "flex";
menuToggle.addEventListener("click", () => {
  if (window.innerWidth <= 980) {
    document.getElementById("sidebar").classList.toggle("open");
  } else {
    document.getElementById("appShell").classList.toggle("sidebar-collapsed");
  }
});

/* ---------------- Global Notification Marker ---------------- */
document.addEventListener("click", (e) => {
  const markReadBtn = e.target.closest("[data-mark-read]");
  if (markReadBtn) {
    const n = DB.notifications.find(notif => notif.id === markReadBtn.dataset.markRead);
    if (n) {
      n.unread = false;
      Router.render();
      refreshNotifDot();
      
      // If modal is open, redraw notifications inside it
      if (document.getElementById("modalBackdrop").classList.contains("show") && currentRole !== "student") {
        const items = DB.notifications.slice(0, 5).map(notifRow).join("");
        document.getElementById("modalBody").innerHTML = `
          <div class="modal__head"><h3 style="font-size:17px;">Notifications</h3><button class="btn-icon" id="closeModalBtn"><i data-lucide="x"></i></button></div>
          ${items}
        `;
        document.getElementById("closeModalBtn").addEventListener("click", closeModal);
        refreshIcons();
      }
    }
  }
});

/* ---------------- Init icons ---------------- */
refreshIcons();
