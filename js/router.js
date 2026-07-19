/* ============================================================
   ACADEMIA — Router
   Minimal client-side router: swaps view content inside #viewRoot
   and keeps the sidebar / topbar in sync. No page reloads.
   ============================================================ */

const NAV_CONFIG = {
  student: [
    { section: "Plan" },
    { key: "overview", label: "Overview", icon: "layout-dashboard" },
    { key: "courses", label: "Course Catalog", icon: "book-open" },
    { key: "recommendations", label: "Recommendations", icon: "sparkles" },
    { key: "planner", label: "Semester Planner", icon: "calendar-range" },
    { section: "Community" },
    { key: "reviews", label: "Reviews", icon: "message-square-text" },
    { key: "notifications", label: "Notifications", icon: "bell" },
  ],
  professor: [
    { section: "Teaching" },
    { key: "overview", label: "Overview", icon: "layout-dashboard" },
    { key: "courses", label: "My Courses", icon: "book-open" },
    { key: "feedback", label: "Student Feedback", icon: "message-square-text" },
    { section: "Account" },
    { key: "profile", label: "Edit Profile", icon: "user-cog" },
  ],
  admin: [
    { section: "Overview" },
    { key: "overview", label: "Dashboard", icon: "layout-dashboard" },
    { key: "analytics", label: "Analytics", icon: "bar-chart-3" },
    { section: "Manage" },
    { key: "students", label: "Students", icon: "users" },
    { key: "professors", label: "Professors", icon: "graduation-cap" },
    { key: "courses", label: "Courses", icon: "book-open" },
    { key: "adminReviews", label: "Moderate Reviews", icon: "shield-check" },
  ],
};

const VIEW_MAP = { student: StudentViews, professor: ProfessorViews, admin: AdminViews };

const Router = {
  role: "student",
  view: "overview",
  state: {}, // scratch state: query, filters, selected ids, etc.

  init(role) {
    this.role = role;
    this.view = "overview";
    this.state = {};
    this.renderNav();
    this.render();
  },

  navigate(viewKey) {
    this.view = viewKey;
    this.renderNav();
    this.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.innerWidth <= 980) document.getElementById("sidebar").classList.remove("open");
  },

  renderNav() {
    const host = document.getElementById("navItems");
    const items = NAV_CONFIG[this.role];
    host.innerHTML = items.map(item => {
      if (item.section) return `<div class="sidebar__section-label">${item.section}</div>`;
      return `<div class="nav-item ${this.view === item.key ? "active" : ""}" data-nav="${item.key}"><i data-lucide="${item.icon}"></i>${item.label}</div>`;
    }).join("");
    host.querySelectorAll("[data-nav]").forEach(n => n.addEventListener("click", () => this.navigate(n.dataset.nav)));
    refreshIcons();
  },

  render() {
    const viewsObj = VIEW_MAP[this.role];
    const fn = viewsObj[this.view] || viewsObj.overview;
    const result = fn(this.state);
    document.getElementById("pageTitle").textContent = result.title;
    document.getElementById("pageSub").textContent = result.sub;
    const root = document.getElementById("viewRoot");
    root.innerHTML = `<div class="view">${result.html}</div>`;
    if (result.mount) result.mount(root);
    refreshIcons();
    // re-bind any global data-nav links inside view bodies (e.g. "See all →")
    root.querySelectorAll("[data-nav]").forEach(n => n.addEventListener("click", () => this.navigate(n.dataset.nav)));
  },
};

// global click-to-navigate helper for cards and buttons (mini prof cards, view profile buttons etc.)
document.addEventListener("click", (e) => {
  const openProfEl = e.target.closest("[data-open-prof]");
  if (openProfEl) {
    const button = e.target.closest("button");
    // If we clicked a button, only trigger modal if the button itself holds the data-open-prof attribute
    if (button && button !== openProfEl) return;
    openProfessorModal(openProfEl.dataset.openProf);
  }
});
