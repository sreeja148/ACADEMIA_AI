/* ============================================================
   ACADEMIA — App Bootstrap & Event Wiring
   Integrated with MLEngine lifecycle and enhanced search
   ============================================================ */

let currentRole = "student";

/* ---------------- Theme ---------------- */
function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  const icon = document.querySelector("#themeToggle i");
  if (icon) icon.setAttribute("data-lucide", mode === "dark" ? "sun" : "moon");
  refreshIcons();
  try { localStorage.setItem("academia-theme", mode); } catch (e) {}
  
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
  
  const reviews = reviewsForProfessor(p.id);
  const allText = reviews.map(r => `${r.pros} ${r.cons}`).join(" ");
  const sentiment = MLEngine.analyzeSentiment(allText);

  openModal(`
    <div class="modal__head">
      <div class="flex items-center gap-12">
        <div class="avatar" style="width:46px;height:46px;font-size:15px;">${p.photoInitials}</div>
        <div>
          <h3 style="font-size:18px;">${p.name}</h3>
          <div class="small text-muted">${p.title} · ${findDept(p.dept).name}</div>
        </div>
      </div>
      <button class="btn-icon" id="closeModalBtn"><i data-lucide="x"></i></button>
    </div>
    <div class="flex items-center gap-8 mt-8">
      ${starRow(avgRating(p.id))}
      <span class="small text-muted font-bold">${avgRating(p.id).toFixed(1)} · ${p.ratingCount} student evaluations</span>
    </div>
    
    <div class="card mt-12" style="background:var(--bg-alt); padding:12px 14px;">
      <div class="flex items-center gap-8 mb-4">
        <span class="tag tag-ai"><i data-lucide="sparkles" style="width:11px;height:11px;"></i> AI Profile Insights</span>
        <span class="tag tag-${sentiment.badge}">${sentiment.label} Tone</span>
      </div>
      <p class="small text-muted">${p.aiSummary || p.bio}</p>
    </div>

    <div class="mt-14"><i data-lucide="clock" style="width:14px;height:14px;vertical-align:-2px;color:var(--accent);"></i> <span class="small text-muted font-bold">${p.officeHours}</span></div>
    
    <div class="chart-box mt-16" style="height:200px;"><canvas id="modalRadar"></canvas></div>
    <button class="btn btn-primary mt-16" id="modalCloseBottom">Done</button>
  `);
  
  renderProfTraitRadar("modalRadar", p);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("modalCloseBottom").addEventListener("click", closeModal);
}

function openReviewModal() {
  const options = DB.professors.map(p => `<option value="${p.id}">${p.name} (${findDept(p.dept).name})</option>`).join("");
  openModal(`
    <div class="modal__head">
      <h3 style="font-size:18px;">Submit Course Evaluation</h3>
      <button class="btn-icon" id="closeModalBtn"><i data-lucide="x"></i></button>
    </div>
    <div class="field"><label>Faculty Member</label><select id="rvProf">${options}</select></div>
    <div class="field"><label>Rating Score</label>
      <select id="rvRating"><option value="5">★★★★★ 5.0 - Exceptional</option><option value="4">★★★★☆ 4.0 - Good</option><option value="3">★★★☆☆ 3.0 - Average</option><option value="2">★★☆☆☆ 2.0 - Needs Improvement</option><option value="1">★☆☆☆☆ 1.0 - Poor</option></select>
    </div>
    <div class="field"><label>Pros & Strengths</label><textarea id="rvPros" rows="2" placeholder="e.g. Great lecture slides, patient in office hours..."></textarea></div>
    <div class="field"><label>Areas for Improvement</label><textarea id="rvCons" rows="2" placeholder="e.g. Fast pacing, heavy problem sets..."></textarea></div>
    <label class="small text-muted flex items-center gap-8" style="margin-bottom:16px;"><input type="checkbox" id="rvAnon" checked style="margin-right:6px"/>Post feedback anonymously</label>
    <button class="btn btn-primary" id="submitReviewBtn"><i data-lucide="send" style="width:15px;height:15px"></i> Submit Evaluation</button>
  `);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("submitReviewBtn").addEventListener("click", () => {
    const profId = document.getElementById("rvProf").value;
    const rating = +document.getElementById("rvRating").value;
    const pros = document.getElementById("rvPros").value.trim() || "Clear instructional delivery.";
    const cons = document.getElementById("rvCons").value.trim() || "Challenging course assignments.";
    const anonymous = document.getElementById("rvAnon").checked;
    
    DB.reviews.unshift({
      id: "r" + Date.now(),
      profId,
      author: anonymous ? "Anonymous" : DB.currentStudent.name,
      anonymous,
      rating,
      pros,
      cons,
      upvotes: 0,
      date: new Date().toISOString().slice(0, 10)
    });
    
    closeModal();
    toast("Review submitted and processed with NLP Sentiment!", "success");
    Router.render();
  });
}

function openForgotPasswordModal() {
  openModal(`
    <div class="modal__head">
      <h3 style="font-size:18px;">Reset Password</h3>
      <button class="btn-icon" id="closeModalBtn"><i data-lucide="x"></i></button>
    </div>
    <p class="small text-muted" style="margin-bottom:16px;">Enter your institutional email address and we'll send a password recovery link.</p>
    <div class="field"><label>Email Address</label><input type="email" placeholder="you@university.edu"/></div>
    <button class="btn btn-primary" id="sendResetBtn"><i data-lucide="mail" style="width:15px;height:15px"></i> Send Reset Link</button>
  `);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("sendResetBtn").addEventListener("click", () => { closeModal(); toast("Reset link sent to your email", "success"); });
}

/* ---------------- Notifications Panel ---------------- */
function refreshNotifDot() {
  const dot = document.getElementById("notifDot");
  const unread = DB.notifications.some(n => n.unread);
  dot.style.display = unread ? "block" : "none";
}

/* ---------------- Auth Screen Wiring ---------------- */
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
    authSubtitle.textContent = `${roleLabel} portal · Enter any email & password to test the platform.`;
    loginForm.classList.remove("hidden"); registerForm.classList.add("hidden");
    authSwitch.innerHTML = authRole === "student"
      ? `<div style="text-align:center; margin-top:20px;"><span class="small text-muted" style="display:block; margin-bottom:8px;">New student?</span><button type="button" class="btn btn-ghost" id="toRegister" style="width:100%;">Create a student account</button></div>`
      : `<p class="small text-muted" style="text-align:center; margin-top:20px;">Contact your department administrator for ${authRole} credentials.</p>`;
    if (document.getElementById("toRegister")) document.getElementById("toRegister").addEventListener("click", () => { authMode = "register"; updateAuthCopy(); });
  } else {
    authTitle.textContent = "Create Student Profile";
    authSubtitle.textContent = "Personalize your learning style to calibrate the Neural Recommender.";
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
  const name = document.getElementById("regName").value || "Jordan Blake";
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
  else { name = "Registrar Admin"; sub = "System Administrator"; ini = "RA"; }
  host.innerHTML = `<div class="avatar">${ini}</div><div><p>${name}</p><span>${sub}</span></div>`;
}

const handleLogout = () => {
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");
  toast("Signed out successfully", "info");
};

document.getElementById("logoutBtn").addEventListener("click", handleLogout);
document.getElementById("topbarLogoutBtn").addEventListener("click", handleLogout);

/* ---------------- Topbar: Theme, Search, Notifications, Menu ---------------- */
document.getElementById("themeToggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

document.getElementById("globalSearch").addEventListener("input", debounce((e) => {
  Router.state.query = e.target.value;
  if (currentRole === "student" && Router.view !== "courses") Router.navigate("courses");
  else Router.render();
}, 220));

document.getElementById("notifBtn").addEventListener("click", () => {
  if (currentRole === "student") { Router.navigate("notifications"); return; }
  const items = DB.notifications.slice(0, 5).map(notifRow).join("");
  openModal(`
    <div class="modal__head"><h3 style="font-size:18px;">Notifications</h3><button class="btn-icon" id="closeModalBtn"><i data-lucide="x"></i></button></div>
    ${items}
  `);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
});

const menuToggle = document.getElementById("menuToggle");
menuToggle.addEventListener("click", () => {
  if (window.innerWidth <= 980) {
    document.getElementById("sidebar").classList.toggle("open");
  } else {
    document.getElementById("appShell").classList.toggle("sidebar-collapsed");
  }
});

/* Close sidebar when clicking outside on mobile */
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 980) {
    const sidebar = document.getElementById("sidebar");
    if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove("open");
    }
  }
});

// Initialize TensorFlow.js and ML Engine
if (typeof MLEngine !== 'undefined') {
  MLEngine.init();
}

refreshIcons();
