/* ============================================================
   ACADEMIA — Views with AI & Machine Learning Integration
   ============================================================ */

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DEPT_COLORS = { cs: "#6366f1", ee: "#06b6d4", ma: "#10b981", bi: "#f59e0b" };

function courseConflicts(courseIds) {
  const blocks = [];
  courseIds.forEach(id => {
    const c = findCourse(id);
    if (c && c.schedule) c.schedule.forEach(s => blocks.push({ ...s, courseId: id }));
  });
  const conflicts = new Set();
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i], b = blocks[j];
      if (a.day === b.day && a.start < b.end && b.start < a.end && a.courseId !== b.courseId) {
        conflicts.add(a.courseId); conflicts.add(b.courseId);
      }
    }
  }
  return conflicts;
}

function missingPrereqs(courseId, completed) {
  return findCourse(courseId)?.prereqs.filter(p => !completed.includes(p)) || [];
}

/* ---------------------------------------------------------
   STUDENT VIEWS
--------------------------------------------------------- */

const StudentViews = {

  overview() {
    const s = DB.currentStudent;
    const pct = Math.round((s.creditsCompleted / s.creditsRequired) * 100);
    const top3 = recommendProfessors(s, null, 3);
    const unread = DB.notifications.filter(n => n.unread).length;
    const mlPlan = MLEngine.predictSemesterPlan(s, s.plan);

    return {
      title: `Welcome back, ${s.name.split(" ")[0]}`,
      sub: `${s.major} · ${s.year} · Fall 2026`,
      html: `
        <div class="grid grid-4">
          ${statCard("gauge", "Current GPA", s.gpa.toFixed(2), "var(--primary-500)", "+0.06 vs last term", "up")}
          ${statCard("sparkles", "ML Projected GPA", mlPlan.predictedGpa, "var(--accent-cyan)", "Neural Estimate")}
          ${statCard("flame", "Term Burnout Risk", mlPlan.burnoutRisk, mlPlan.riskLevel === "danger" ? "var(--danger-500)" : mlPlan.riskLevel === "warn" ? "var(--warn-500)" : "var(--ok-500)", `${mlPlan.estimatedWeeklyHours} hrs/wk`)}
          ${statCard("bell", "Unread Alerts", unread, "var(--accent-purple)")}
        </div>

        <div class="grid grid-3 mt-24" style="grid-template-columns: 1.35fr 1fr;">
          <div class="card">
            <div class="section-head" style="margin-top:0">
              <h3>Academic Performance & ML Forecast</h3>
              <span class="tag tag-ai"><i data-lucide="cpu" style="width:12px;height:12px;"></i> Neural Projection</span>
            </div>
            <div class="chart-box"><canvas id="chartGpaTrend"></canvas></div>
          </div>
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Degree Completion</h3></div>
            <div class="ring-wrap">
              <div class="ring" style="--pct:${pct}"><b>${pct}%</b></div>
              <div>
                <p class="text-muted small">${s.creditsCompleted} of ${s.creditsRequired} credits complete</p>
                <p class="text-muted small mt-8">Est. graduation: <b class="mono">Spring 2028</b></p>
                <a class="link-btn mt-8" data-nav="planner">Open semester planner <i data-lucide="arrow-right" style="width:13px;height:13px;"></i></a>
              </div>
            </div>
          </div>
        </div>

        <div class="section-head">
          <h3>Top AI-Matched Faculty</h3>
          <span class="link-btn" data-nav="recommendations">Explore all recommendations <i data-lucide="arrow-right" style="width:13px;height:13px;"></i></span>
        </div>
        <div class="grid grid-3">
          ${top3.map(r => miniProfCard(r)).join("")}
        </div>

        <div class="section-head"><h3>Recent Notifications & Alerts</h3><span class="link-btn" data-nav="notifications">View all <i data-lucide="arrow-right" style="width:13px;height:13px;"></i></span></div>
        <div class="card-solid">
          ${DB.notifications.slice(0, 3).map(notifRow).join("")}
        </div>
      `,
      mount() { renderGpaTrendChart("chartGpaTrend"); }
    };
  },

  courses(state) {
    const s = DB.currentStudent;
    const q = (state.query || "").toLowerCase().trim();
    const dept = state.filterDept || "all";

    // Check if semantic AI search query
    let semanticMatches = null;
    if (q.length > 2 && (q.includes("easy") || q.includes("lab") || q.includes("lenient") || q.includes("strict") || q.includes("hands") || q.includes("math") || q.includes("algorithms") || q.includes("biology") || q.includes("circuits") || q.includes("database"))) {
      semanticMatches = MLEngine.semanticSearch(q);
    }

    let list = DB.courses.filter(c =>
      (dept === "all" || c.dept === dept) &&
      (!q || c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (semanticMatches && semanticMatches.courses.some(sc => sc.course.id === c.id)))
    );

    return {
      title: "Course Catalog & Discovery",
      sub: `${DB.courses.length} courses offered this term`,
      html: `
        <div class="flex justify-between items-center" style="margin-bottom:18px; flex-wrap:wrap; gap:12px;">
          <div class="filter-row">
            ${["all", ...DB.departments.map(d => d.id)].map(id => {
              const label = id === "all" ? "All Departments" : findDept(id).name;
              return `<button class="pill-btn ${dept === id ? "active" : ""}" data-filter-dept="${id}">${label}</button>`;
            }).join("")}
          </div>
          ${q ? `<span class="tag tag-ai"><i data-lucide="sparkles" style="width:12px;height:12px;"></i> AI Semantic Filter Active</span>` : ""}
        </div>

        <div class="grid" style="grid-template-columns:1fr; gap:12px;">
          ${list.length ? list.map(c => courseRow(c, s)).join("") : emptyState("search-x", "No courses match your query. Try searching 'easy elective', 'hands-on lab', or a department name.")}
        </div>
      `,
      mount(root) {
        root.querySelectorAll("[data-filter-dept]").forEach(b => b.addEventListener("click", () => {
          Router.state.filterDept = b.dataset.filterDept; Router.render();
        }));
        root.querySelectorAll("[data-view-recs]").forEach(b => b.addEventListener("click", () => {
          Router.state.recCourse = b.dataset.viewRecs; Router.navigate("recommendations");
        }));
        root.querySelectorAll("[data-add-plan]").forEach(b => b.addEventListener("click", () => {
          addToPlan(b.dataset.addPlan); Router.render();
        }));
      }
    };
  },

  recommendations(state) {
    const s = DB.currentStudent;
    const courseId = state.recCourse || DB.courses[0].id;
    const results = recommendProfessors(s, courseId, 5);

    return {
      title: "AI Professor Recommendations",
      sub: "Deep Neural Network match scores based on teaching traits, grading leniency, and student learning profile",
      html: `
        <div class="card" style="margin-bottom:20px;">
          <div class="flex items-center gap-8 mb-12">
            <span class="tag tag-ai"><i data-lucide="cpu" style="width:13px;height:13px;"></i> TensorFlow.js Neural Recommender</span>
            <span class="small text-muted">Real-time inference</span>
          </div>
          <div class="grid grid-3" style="align-items:end; gap:14px;">
            <div class="field" style="margin:0;">
              <label>Target Course</label>
              <select id="recCourseSelect">
                ${DB.courses.map(c => `<option value="${c.id}" ${c.id === courseId ? "selected" : ""}>${c.code} — ${c.title}</option>`).join("")}
              </select>
            </div>
            <div class="field" style="margin:0;">
              <label>Your Learning Style</label>
              <select id="recLearningStyle">
                ${["visual", "handson", "theoretical", "discussion"].map(v => `<option value="${v}" ${s.learningStyle === v ? "selected" : ""}>${v[0].toUpperCase() + v.slice(1)}</option>`).join("")}
              </select>
            </div>
            <div class="field" style="margin:0;">
              <label>Grading Preference</label>
              <select id="recGradingPref">
                ${["lenient", "balanced", "rigorous"].map(v => `<option value="${v}" ${s.gradingPreference === v ? "selected" : ""}>${v[0].toUpperCase() + v.slice(1)}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>

        <div class="grid" style="grid-template-columns:1fr; gap:16px;">
          ${results.map((r, i) => profRecCard(r, i, courseId)).join("")}
        </div>
      `,
      mount(root) {
        root.querySelector("#recCourseSelect").addEventListener("change", (e) => { Router.state.recCourse = e.target.value; Router.render(); });
        root.querySelector("#recLearningStyle").addEventListener("change", (e) => { DB.currentStudent.learningStyle = e.target.value; Router.render(); toast("Learning style updated (Weights Recalibrated)", "success"); });
        root.querySelector("#recGradingPref").addEventListener("change", (e) => { DB.currentStudent.gradingPreference = e.target.value; Router.render(); toast("Grading preference updated", "success"); });
        root.querySelectorAll("[data-add-plan]").forEach(b => b.addEventListener("click", () => { addToPlan(b.dataset.addPlan); Router.render(); }));
        root.querySelectorAll("[data-open-prof]").forEach(b => b.addEventListener("click", () => openProfessorModal(b.dataset.openProf)));
      }
    };
  },

  planner() {
    const s = DB.currentStudent;
    const plan = s.plan.map(findCourse).filter(Boolean);
    const conflicts = courseConflicts(s.plan);
    const credits = planCredits();
    const overLimit = credits > s.maxCredits;
    const prereqIssues = s.plan.map(id => ({ id, missing: missingPrereqs(id, s.completedCourses) })).filter(x => x.missing.length && findCourse(x.id));
    const mlPlan = MLEngine.predictSemesterPlan(s, s.plan);

    return {
      title: "Semester Planner & Timetable",
      sub: `Fall 2026 · ${credits}/${s.maxCredits} credits staged`,
      html: `
        ${overLimit ? warnBanner("alert-triangle", "Over Credit Limit", `Your plan totals ${credits} credits, above the ${s.maxCredits}-credit maximum. Remove a course before finalizing.`) : ""}
        ${conflicts.size ? warnBanner("calendar-x", "Timetable Conflict Detected", `${[...conflicts].map(id => findCourse(id)?.code || id).join(" and ")} have overlapping meeting hours.`) : ""}
        ${prereqIssues.map(pi => warnBanner("lock", "Missing Prerequisite", `${findCourse(pi.id)?.title || pi.id} requires ${pi.missing.map(m => findCourse(m)?.title || m).join(", ")}.`)).join("")}

        <!-- ML Workload & Burnout Analysis Card -->
        <div class="card mb-16" style="margin-bottom:18px; border-left: 4px solid ${mlPlan.riskLevel === 'danger' ? 'var(--danger-500)' : mlPlan.riskLevel === 'warn' ? 'var(--warn-500)' : 'var(--ok-500)'};">
          <div class="flex justify-between items-center" style="flex-wrap:wrap; gap:10px;">
            <div class="flex items-center gap-10">
              <span class="tag tag-ai"><i data-lucide="cpu" style="width:12px;height:12px;"></i> ML Workload Forecaster</span>
              <strong>Burnout Risk: <span style="color:${mlPlan.riskLevel === 'danger' ? 'var(--danger-500)' : mlPlan.riskLevel === 'warn' ? 'var(--warn-500)' : 'var(--ok-500)'}">${mlPlan.burnoutRisk}</span></strong>
            </div>
            <div class="flex items-center gap-12 small text-muted">
              <span>Avg Difficulty: <b class="mono">${mlPlan.avgDifficulty || '3.2'}/5.0</b></span>
              <span>Est. Study Load: <b class="mono">${mlPlan.estimatedWeeklyHours} hrs/wk</b></span>
              <span>Projected GPA: <b class="mono" style="color:var(--accent); font-size:14px;">${mlPlan.predictedGpa}</b></span>
            </div>
          </div>
          <div class="mt-8 small text-muted">
            ${mlPlan.recommendations.map(r => `<div class="flex items-center gap-6 mt-4"><i data-lucide="info" style="width:13px;height:13px;color:var(--accent);"></i>${r}</div>`).join("")}
          </div>
        </div>

        <div class="grid grid-3" style="grid-template-columns:1.45fr 1fr;">
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Weekly Interactive Schedule</h3></div>
            ${renderTimetable(s.plan, conflicts)}
          </div>
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Staged Courses (${plan.length})</h3></div>
            ${plan.length ? plan.map(c => `
              <div class="course-row" style="margin-bottom:10px; padding:12px 14px;">
                <span class="course-code">${c.code}</span>
                <div style="flex:1; min-width:0;">
                  <div class="course-row__title" style="font-size:13.5px;">${c.title}</div>
                  <div class="course-row__meta"><span>${c.credits} cr</span><span>${professorsForCourse(c.id).map(p => p.name).join(", ")}</span></div>
                </div>
                <button class="btn-icon" data-remove-plan="${c.id}" title="Remove course"><i data-lucide="trash-2"></i></button>
              </div>`).join("") : emptyState("calendar-plus", "No courses staged yet. Add courses from the catalog.")}
            <button class="btn btn-primary mt-16" id="savePlanBtn"><i data-lucide="save" style="width:16px;height:16px"></i> Save Semester Plan</button>
          </div>
        </div>

        <div class="grid grid-2 mt-24">
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Target GPA Calculator</h3></div>
            ${gpaCalculator()}
          </div>
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>AI Recommended Electives</h3></div>
            ${electiveList(s)}
          </div>
        </div>
      `,
      mount(root) {
        root.querySelectorAll("[data-remove-plan]").forEach(b => b.addEventListener("click", () => {
          s.plan = s.plan.filter(id => id !== b.dataset.removePlan); Router.render();
        }));
        const saveBtn = root.querySelector("#savePlanBtn");
        if (saveBtn) saveBtn.addEventListener("click", () => {
          if (overLimit) { toast("Reduce credits before saving your plan.", "danger"); return; }
          s.savedPlans.push({ term: "Fall 2026", courses: [...s.plan], savedAt: new Date().toISOString() });
          toast("Semester plan successfully saved", "success");
        });
        root.querySelectorAll("[data-add-elective]").forEach(b => b.addEventListener("click", () => { addToPlan(b.dataset.addElective); Router.render(); }));
        wireGpaCalculator(root);
      }
    };
  },

  reviews(state) {
    const dept = state.reviewDept || "all";
    const profs = DB.professors.filter(p => dept === "all" || p.dept === dept);
    return {
      title: "Student Reviews & NLP Sentiment",
      sub: "Real student evaluations parsed through AI sentiment and aspect extraction",
      html: `
        <div class="flex justify-between items-center" style="margin-bottom:18px; flex-wrap:wrap; gap:10px;">
          <div class="filter-row">
            ${["all", ...DB.departments.map(d => d.id)].map(id => `<button class="pill-btn ${dept === id ? "active" : ""}" data-review-dept="${id}">${id === "all" ? "All Faculty" : findDept(id).name}</button>`).join("")}
          </div>
          <button class="btn btn-primary btn-sm" id="writeReviewBtn"><i data-lucide="pen-line" style="width:14px;height:14px"></i> Write a Review</button>
        </div>
        <div class="grid grid-2">
          ${profs.map(p => `
            <div class="card">
              <div class="flex items-center gap-12">
                <div class="avatar" style="width:44px;height:44px;">${p.photoInitials}</div>
                <div style="flex:1;">
                  <div class="prof-card__name">${p.name}</div>
                  <div class="flex items-center gap-8 mt-4">${starRow(avgRating(p.id))}<span class="small text-muted">${avgRating(p.id).toFixed(1)} · ${p.ratingCount} ratings</span></div>
                </div>
              </div>
              <div class="mt-16">
                ${reviewsForProfessor(p.id).slice(0, 2).map(r => reviewCard(r)).join("") || `<p class="small text-muted">No written reviews yet.</p>`}
              </div>
            </div>
          `).join("")}
        </div>
      `,
      mount(root) {
        root.querySelectorAll("[data-review-dept]").forEach(b => b.addEventListener("click", () => { Router.state.reviewDept = b.dataset.reviewDept; Router.render(); }));
        root.querySelector("#writeReviewBtn").addEventListener("click", openReviewModal);
        root.querySelectorAll("[data-upvote]").forEach(b => b.addEventListener("click", () => {
          const r = DB.reviews.find(rv => rv.id === b.dataset.upvote); if (r) { r.upvotes++; Router.render(); }
        }));
      }
    };
  },

  notifications() {
    return {
      title: "Notifications & System Alerts",
      sub: `${DB.notifications.filter(n => n.unread).length} unread updates`,
      html: `
        <div class="card-solid">
          ${DB.notifications.map(notifRow).join("")}
        </div>
      `,
      mount(root) {
        root.querySelectorAll("[data-mark-read]").forEach(b => b.addEventListener("click", () => {
          const n = DB.notifications.find(n => n.id === b.dataset.markRead); if (n) { n.unread = false; Router.render(); refreshNotifDot(); }
        }));
      }
    };
  },
};

/* ---------------------------------------------------------
   PROFESSOR VIEWS
--------------------------------------------------------- */

const ProfessorViews = {
  overview() {
    const p = DB.currentProfessor;
    const myCourses = DB.courses.filter(c => c.profIds.includes(p.id));
    const totalStudents = myCourses.reduce((a, c) => a + c.enrolled, 0);
    const reviews = reviewsForProfessor(p.id);

    return {
      title: `Welcome, ${p.name}`,
      sub: `${p.title} · ${findDept(p.dept).name}`,
      html: `
        <div class="grid grid-4">
          ${statCard("star", "Average Rating", avgRating(p.id).toFixed(1), "var(--accent-amber)")}
          ${statCard("users", "Students Enrolled", totalStudents, "var(--primary-500)")}
          ${statCard("book-open", "Active Courses", myCourses.length, "var(--ok-500)")}
          ${statCard("message-circle", "Written Reviews", reviews.length, "var(--accent-cyan)")}
        </div>
        <div class="grid grid-2 mt-24">
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Instructional Trait Matrix</h3></div>
            <div class="chart-box"><canvas id="profRadar"></canvas></div>
          </div>
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Trait Breakdown</h3></div>
            ${Object.entries(p.traits).map(([k, v]) => traitBar(traitLabel(k), v)).join("")}
          </div>
        </div>
        <div class="section-head"><h3>Recent Student Feedback</h3><span class="link-btn" data-nav="feedback">View all feedback <i data-lucide="arrow-right" style="width:13px;height:13px;"></i></span></div>
        <div class="grid grid-2">
          ${reviews.slice(0, 2).map(r => reviewCard(r)).join("") || emptyState("message-square", "No feedback submitted yet this term.")}
        </div>
      `,
      mount() { renderProfTraitRadar("profRadar", p); }
    };
  },

  profile() {
    const p = DB.currentProfessor;
    return {
      title: "Faculty Profile",
      sub: "Update your bio, office hours, and student syllabus resources",
      html: `
        <div class="grid grid-2">
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Public Information</h3></div>
            <div class="field"><label>Full Name</label><input id="pfName" value="${p.name}"/></div>
            <div class="field"><label>Title</label><input id="pfTitle" value="${p.title}"/></div>
            <div class="field"><label>Bio & Research Focus</label><textarea id="pfBio" rows="4">${p.bio}</textarea></div>
            <div class="field"><label>Office Hours Location & Schedule</label><input id="pfOffice" value="${p.officeHours}"/></div>
            <button class="btn btn-primary" id="saveProfileBtn"><i data-lucide="check" style="width:16px;height:16px"></i> Save Profile</button>
          </div>
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Course Materials & Resources</h3></div>
            <p class="small text-muted mb-16">Upload your latest syllabi, lecture rubrics, and project guidelines for students.</p>
            <div class="field mt-16"><label>Course Syllabus (PDF)</label><input type="file"/></div>
            <div class="field"><label>Grading Policy Document</label><input type="file"/></div>
            <button class="btn btn-ghost" id="uploadDocsBtn"><i data-lucide="upload" style="width:16px;height:16px"></i> Upload Files</button>
          </div>
        </div>
      `,
      mount(root) {
        root.querySelector("#saveProfileBtn").addEventListener("click", () => {
          p.name = root.querySelector("#pfName").value;
          p.title = root.querySelector("#pfTitle").value;
          p.bio = root.querySelector("#pfBio").value;
          p.officeHours = root.querySelector("#pfOffice").value;
          toast("Faculty profile updated", "success"); Router.render();
        });
        root.querySelector("#uploadDocsBtn").addEventListener("click", () => toast("Course materials uploaded successfully", "success"));
      }
    };
  },

  courses() {
    const p = DB.currentProfessor;
    const myCourses = DB.courses.filter(c => c.profIds.includes(p.id));
    return {
      title: "Assigned Courses",
      sub: `${myCourses.length} active courses under your instruction`,
      html: `<div class="grid" style="grid-template-columns:1fr; gap:12px;">${myCourses.map(c => courseRow(c)).join("")}</div>`,
      mount() {}
    };
  },

  feedback() {
    const p = DB.currentProfessor;
    const reviews = reviewsForProfessor(p.id);
    return {
      title: "Student Feedback Analysis",
      sub: `${reviews.length} student reviews · ${avgRating(p.id).toFixed(1)} average score`,
      html: `<div class="grid grid-2">${reviews.map(r => reviewCard(r)).join("") || emptyState("message-square", "No feedback submitted yet.")}</div>`,
      mount(root) {
        root.querySelectorAll("[data-upvote]").forEach(b => b.addEventListener("click", () => {
          const r = DB.reviews.find(rv => rv.id === b.dataset.upvote); if (r) { r.upvotes++; Router.render(); }
        }));
      }
    };
  },
};

/* ---------------------------------------------------------
   ADMIN VIEWS
--------------------------------------------------------- */

const AdminViews = {
  overview() {
    return {
      title: "Administrative Command Center",
      sub: "Institutional analytics, faculty performance, and student enrollment snapshot",
      html: `
        <div class="grid grid-4">
          ${statCard("users", "Total Students", DB.students.length + 1240, "var(--primary-500)", "+3.2%", "up")}
          ${statCard("graduation-cap", "Faculty Members", DB.professors.length + 118, "var(--accent-purple)")}
          ${statCard("book-open", "Active Courses", DB.courses.length + 96, "var(--ok-500)")}
          ${statCard("star", "Average Institution Rating", "4.4", "var(--accent-amber)", "+0.1", "up")}
        </div>
        <div class="grid grid-2 mt-24">
          <div class="card"><div class="section-head" style="margin-top:0"><h3>Department Performance Rating</h3></div><div class="chart-box"><canvas id="chartDeptRatings"></canvas></div></div>
          <div class="card"><div class="section-head" style="margin-top:0"><h3>Enrollment Trajectory</h3></div><div class="chart-box"><canvas id="chartEnrollment"></canvas></div></div>
        </div>
        <div class="section-head"><h3>Recent Moderated Reviews</h3><span class="link-btn" data-nav="adminReviews">Review moderation <i data-lucide="arrow-right" style="width:13px;height:13px;"></i></span></div>
        <div class="card-solid">
          ${DB.reviews.slice(0, 2).map(r => reviewCard(r, true)).join("")}
        </div>
      `,
      mount() { renderDeptRatingsChart("chartDeptRatings"); renderEnrollmentChart("chartEnrollment"); }
    };
  },

  students(state) {
    const q = (state.query || "").toLowerCase();
    const list = DB.students.filter(s => s.name.toLowerCase().includes(q) || s.major.toLowerCase().includes(q));
    return {
      title: "Student Roster Management",
      sub: `${DB.students.length} active students in database`,
      html: `
        <div class="card-solid table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Major</th><th>Class Year</th><th>GPA</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${list.map(s => `
                <tr>
                  <td><div class="row-avatar"><div class="avatar" style="width:32px;height:32px;font-size:11px;">${initials(s.name)}</div><div><div style="font-weight:700;">${s.name}</div><div class="small text-muted">${s.email}</div></div></div></td>
                  <td>${s.major}</td>
                  <td>${s.year}</td>
                  <td class="mono font-bold">${s.gpa.toFixed(2)}</td>
                  <td><span class="tag ${s.status === "active" ? "tag-ok" : "tag-warn"}">${s.status}</span></td>
                  <td><div class="table-actions"><button class="btn-icon" data-remove-student="${s.id}" title="Remove Student"><i data-lucide="trash-2"></i></button></div></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      `,
      mount(root) {
        root.querySelectorAll("[data-remove-student]").forEach(b => b.addEventListener("click", () => {
          DB.students = DB.students.filter(s => s.id !== b.dataset.removeStudent); toast("Student removed from database", "success"); Router.render();
        }));
      }
    };
  },

  professors(state) {
    const q = (state.query || "").toLowerCase();
    const list = DB.professors.filter(p => p.name.toLowerCase().includes(q));
    return {
      title: "Faculty Directory Management",
      sub: `${DB.professors.length} professors registered`,
      html: `
        <div class="card-solid table-wrap">
          <table>
            <thead><tr><th>Professor</th><th>Department</th><th>Evaluation</th><th>Courses</th><th>Actions</th></tr></thead>
            <tbody>
              ${list.map(p => `
                <tr>
                  <td><div class="row-avatar"><div class="avatar" style="width:32px;height:32px;font-size:11px;">${p.photoInitials}</div><div><div style="font-weight:700;">${p.name}</div><div class="small text-muted">${p.title}</div></div></div></td>
                  <td><span class="tag tag-navy">${findDept(p.dept)?.name || p.dept}</span></td>
                  <td>${starRow(avgRating(p.id))}</td>
                  <td class="mono">${p.courses.map(findCourse).filter(Boolean).map(c => c.code).join(", ")}</td>
                  <td><div class="table-actions"><button class="btn-icon" data-view-prof="${p.id}" title="View Details"><i data-lucide="eye"></i></button><button class="btn-icon" data-remove-prof="${p.id}" title="Remove Professor"><i data-lucide="trash-2"></i></button></div></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      `,
      mount(root) {
        root.querySelectorAll("[data-view-prof]").forEach(b => b.addEventListener("click", () => openProfessorModal(b.dataset.viewProf)));
        root.querySelectorAll("[data-remove-prof]").forEach(b => b.addEventListener("click", () => {
          DB.professors = DB.professors.filter(p => p.id !== b.dataset.removeProf); toast("Professor removed", "success"); Router.render();
        }));
      }
    };
  },

  courses(state) {
    const q = (state.query || "").toLowerCase();
    const list = DB.courses.filter(c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    return {
      title: "Course Catalog Management",
      sub: `${DB.courses.length} courses across ${DB.departments.length} departments`,
      html: `
        <div class="card-solid table-wrap">
          <table>
            <thead><tr><th>Course Code</th><th>Title</th><th>Department</th><th>Credits</th><th>Enrollment</th><th>Instructors</th><th>Actions</th></tr></thead>
            <tbody>
              ${list.map(c => `
                <tr>
                  <td><span class="course-code">${c.code}</span></td>
                  <td style="font-weight:600;">${c.title}</td>
                  <td><span class="tag tag-navy">${findDept(c.dept).name}</span></td>
                  <td class="mono font-bold">${c.credits}</td>
                  <td class="mono">${c.enrolled}/${c.seats}</td>
                  <td>${c.profIds.map(id => findProfessor(id)?.name || "").filter(Boolean).join(", ")}</td>
                  <td><div class="table-actions"><button class="btn-icon" data-remove-course="${c.id}" title="Delete Course"><i data-lucide="trash-2"></i></button></div></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      `,
      mount(root) {
        root.querySelectorAll("[data-remove-course]").forEach(b => b.addEventListener("click", () => {
          DB.courses = DB.courses.filter(c => c.id !== b.dataset.removeCourse); toast("Course deleted from catalog", "success"); Router.render();
        }));
      }
    };
  },

  analytics() {
    return {
      title: "Institutional AI Analytics",
      sub: "Deep metrics on enrollment distribution, student success projections, and rating benchmarks",
      html: `
        <div class="grid grid-2">
          <div class="card"><div class="section-head" style="margin-top:0"><h3>High-Demand Courses</h3></div><div class="chart-box"><canvas id="chartPopular"></canvas></div></div>
          <div class="card"><div class="section-head" style="margin-top:0"><h3>Predicted Completion Rates</h3></div><div class="chart-box"><canvas id="chartSuccess"></canvas></div></div>
          <div class="card"><div class="section-head" style="margin-top:0"><h3>Faculty Sentiment Benchmark</h3></div><div class="chart-box"><canvas id="chartDeptRatings2"></canvas></div></div>
          <div class="card"><div class="section-head" style="margin-top:0"><h3>Semester Registration Trends</h3></div><div class="chart-box"><canvas id="chartEnrollment2"></canvas></div></div>
        </div>
      `,
      mount() {
        renderPopularCoursesChart("chartPopular");
        renderSuccessRateChart("chartSuccess");
        renderDeptRatingsChart("chartDeptRatings2");
        renderEnrollmentChart("chartEnrollment2");
      }
    };
  },

  adminReviews() {
    return {
      title: "Review Moderation Queue",
      sub: `${DB.reviews.length} reviews monitored by NLP Sentiment Filters`,
      html: `<div class="grid grid-2">${DB.reviews.map(r => reviewCard(r, true)).join("") || emptyState("message-square", "No reviews pending moderation.")}</div>`,
      mount(root) {
        root.querySelectorAll("[data-remove-review]").forEach(b => b.addEventListener("click", () => {
          DB.reviews = DB.reviews.filter(r => r.id !== b.dataset.removeReview); toast("Review removed", "success"); Router.render();
        }));
      }
    };
  },
};

/* ---------------------------------------------------------
   Shared Render Helpers
--------------------------------------------------------- */

function statCard(icon, label, value, color, delta, dir) {
  return `
    <div class="card stat-card">
      ${delta ? `<span class="stat-delta ${dir === 'up' ? 'up' : dir === 'down' ? 'down' : ''}" style="${!dir ? 'background:color-mix(in srgb, var(--accent) 12%, transparent); color:var(--accent);' : ''}">${delta}</span>` : ""}
      <div class="stat-icon" style="background:color-mix(in srgb, ${color} 14%, transparent); color:${color};"><i data-lucide="${icon}"></i></div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
}

function traitLabel(key) {
  const map = { teaching: "Teaching Quality", difficulty: "Difficulty", grading: "Grading Fairness", attendance: "Attendance Strictness", friendliness: "Friendliness", knowledge: "Knowledge", responsiveness: "Responsiveness", labQuality: "Lab Quality", assignmentLoad: "Assignment Load", examDifficulty: "Exam Difficulty" };
  return map[key] || key;
}

function miniProfCard(r) {
  const p = r.prof;
  return `
    <div class="card" data-open-prof="${p.id}" style="cursor:pointer;">
      <div class="flex items-center gap-12">
        <div class="seal-medal" style="--pct:${r.compatibility}; width:54px; height:54px;">
          <div class="seal-medal__inner"><b style="font-size:13px;">${r.compatibility}%</b></div>
        </div>
        <div style="min-width:0;">
          <div class="prof-card__name" style="font-size:14.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
          <div class="flex items-center gap-6 mt-4">${starRow(avgRating(p.id))} <span class="tag tag-ai" style="font-size:9.5px; padding:2px 6px;">${r.confidence * 100}% Conf</span></div>
        </div>
      </div>
    </div>`;
}

function profRecCard(r, i, courseId) {
  const p = r.prof;
  return `
    <div class="card prof-card">
      <div class="seal-medal" style="--pct:${r.compatibility};">
        <div class="seal-medal__inner"><b>${r.compatibility}%</b><span>MATCH</span></div>
      </div>
      <div class="prof-card__body">
        <div class="prof-card__top">
          <div>
            <div class="flex items-center gap-8 flex-wrap">
              ${i === 0 ? `<span class="tag tag-gold"><i data-lucide="trophy" style="width:11px;height:11px;"></i> Top AI Match</span>` : ""}
              <span class="tag tag-ai"><i data-lucide="cpu" style="width:11px;height:11px;"></i> Neural Score</span>
              <span class="prof-card__name">${p.name}</span>
            </div>
            <div class="prof-card__meta">${p.title} · ${findDept(p.dept).name} · ${p.ratingCount} ratings</div>
          </div>
          <div class="flex gap-8 mt-8">
            <button class="btn-sm btn-ghost" data-open-prof="${p.id}">Profile</button>
            <button class="btn-sm btn-primary" data-add-plan="${courseId}">Add to Plan</button>
          </div>
        </div>
        <div class="flex items-center gap-8 mt-8">
          ${starRow(avgRating(p.id))}
          <span class="small text-muted">${avgRating(p.id).toFixed(1)}/5.0</span>
        </div>
        <ul class="reasons">
          ${r.insights ? r.insights.map(item => `<li><i data-lucide="${item.positive ? 'check-circle-2' : 'alert-circle'}" style="color:${item.positive ? 'var(--ok-500)' : 'var(--warn-500)'}"></i>${item.label} <b style="color:${item.positive ? 'var(--ok-500)' : 'var(--warn-500)'}">${item.impact}</b></li>`).join("") : r.reasons.map(reason => `<li><i data-lucide="check-circle-2"></i>${reason}</li>`).join("")}
        </ul>
        <div class="prof-card__traits">
          ${traitBar("Teaching", p.traits.teaching)}
          ${traitBar("Grading", p.traits.grading)}
          ${traitBar("Difficulty", p.traits.difficulty)}
        </div>
      </div>
    </div>`;
}

function courseRow(c, student) {
  const seatPct = Math.round((c.enrolled / c.seats) * 100);
  const seatColor = seatPct > 90 ? "var(--danger-500)" : seatPct > 70 ? "var(--warn-500)" : "var(--ok-500)";
  const dept = findDept(c.dept);
  const staged = student && student.plan.includes(c.id);

  return `
    <div class="course-row">
      <span class="course-code">${c.code}</span>
      <div style="flex:1; min-width:0;">
        <div class="course-row__title">${c.title}</div>
        <div class="course-row__meta">
          <span class="tag tag-navy">${dept?.name || c.dept}</span>
          <span><b>${c.credits}</b> credits</span>
          <span>${professorsForCourse(c.id).map(p => p?.name || "").filter(Boolean).join(", ")}</span>
          ${c.prereqs.length ? `<span><i data-lucide="link" style="width:11px;height:11px;vertical-align:-2px;"></i> Prereqs: ${c.prereqs.map(p => findCourse(p)?.code || p).join(", ")}</span>` : ""}
        </div>
      </div>
      <div style="text-align:right;">
        <div class="small text-muted mono">${c.enrolled}/${c.seats} seats</div>
        <div class="seat-bar mt-8"><div style="width:${seatPct}%; background:${seatColor};"></div></div>
      </div>
      ${student ? `
        <div class="flex gap-8">
          <button class="btn-sm btn-ghost" data-view-recs="${c.id}"><i data-lucide="sparkles" style="width:13px;height:13px;"></i> Match</button>
          <button class="btn-sm ${staged ? "btn-ghost" : "btn-primary"}" data-add-plan="${c.id}" ${staged ? "disabled" : ""}>${staged ? "In Plan" : "Add"}</button>
        </div>
      ` : ""}
    </div>`;
}

function reviewCard(r, moderation = false) {
  const sentiment = MLEngine.analyzeSentiment(`${r.pros} ${r.cons}`);

  return `
    <div class="review">
      <div class="review__head">
        <div>
          <div class="flex items-center gap-8">
            <span class="review__author">${r.anonymous ? "Anonymous Student" : r.author}</span>
            <span class="tag tag-${sentiment.badge}"><i data-lucide="sparkles" style="width:10px;height:10px;"></i> ${sentiment.label}</span>
          </div>
          <div class="flex items-center gap-8 mt-4">${starRow(r.rating)}<span class="review__date">${r.date}</span></div>
        </div>
        ${moderation ? `<button class="btn-icon" data-remove-review="${r.id}"><i data-lucide="trash-2"></i></button>` : ""}
      </div>
      <div class="review__body">
        <div class="pro"><span class="lbl">Pros</span>${r.pros}</div>
        <div class="con"><span class="lbl">Cons</span>${r.cons}</div>
      </div>
      <div class="review__foot">
        <div class="flex gap-6">
          ${sentiment.tags.map(t => `<span class="tag tag-ai" style="font-size:10px;">${t}</span>`).join("")}
        </div>
        <div class="review__upvote" data-upvote="${r.id}">
          <i data-lucide="thumbs-up" style="width:13px;height:13px;"></i> Helpful (${r.upvotes})
        </div>
      </div>
    </div>`;
}

function notifRow(n) {
  const iconMap = {
    info: ["info", "var(--primary-500)", "var(--primary-100)"],
    warning: ["alert-triangle", "var(--warn-500)", "var(--warn-100)"]
  };
  const [icon, color, bg] = iconMap[n.type] || iconMap.info;

  return `
    <div class="notif ${n.unread ? "unread" : ""}">
      <div class="notif__icon" style="background:${bg}; color:${color};"><i data-lucide="${icon}"></i></div>
      <div style="flex:1;">
        <h4>${n.title}</h4>
        <p>${n.body}</p>
        <time>${n.time}</time>
      </div>
      ${n.unread ? `<button class="btn-sm btn-ghost" data-mark-read="${n.id}">Mark read</button>` : ""}
    </div>`;
}

function warnBanner(icon, title, body) {
  return `<div class="warn-banner"><i data-lucide="${icon}"></i><div><strong>${title}</strong><p>${body}</p></div></div>`;
}

function emptyState(icon, text) {
  return `<div class="empty"><i data-lucide="${icon}"></i><p>${text}</p></div>`;
}

function planCredits() {
  return DB.currentStudent.plan.reduce((a, id) => a + (findCourse(id)?.credits || 0), 0);
}

function addToPlan(courseId) {
  if (!courseId) return;
  const s = DB.currentStudent;
  if (s.plan.includes(courseId)) { toast("Already in your plan", "info"); return; }
  s.plan.push(courseId);
  toast(`${findCourse(courseId)?.code || courseId} added to your plan`, "success");
}

function renderTimetable(courseIds, conflicts) {
  const hours = [9, 10.5, 11, 13, 14];
  let grid = `<div class="timetable-wrap"><div class="timetable">`;
  grid += `<div></div>` + DAY_LABELS.map(d => `<div class="tt-head">${d}</div>`).join("");
  hours.forEach(h => {
    grid += `<div class="tt-time">${h % 1 === 0 ? h + ":00" : (Math.floor(h)) + ":30"}</div>`;
    DAY_LABELS.forEach((_, dayIdx) => {
      const blocks = courseIds.flatMap(id => {
        const c = findCourse(id);
        return c && c.schedule ? c.schedule.map(s => ({ ...s, courseId: id })) : [];
      }).filter(b => b.day === dayIdx && b.start === h);
      if (blocks.length) {
        const inner = blocks.map(block => {
          const course = findCourse(block.courseId);
          if (!course) return "";
          const isConflict = conflicts.has(block.courseId);
          const color = DEPT_COLORS[course.dept] || "#6366f1";
          return `<div class="tt-block ${isConflict ? "conflict" : ""}" style="background:${color};">${course.code}<span>${professorsForCourse(course.id)[0]?.name.split(" ").pop() || ""}</span></div>`;
        }).filter(Boolean).join("");
        grid += `<div class="tt-cell" style="display:flex; flex-direction:column; gap:2px; padding:2px;">${inner}</div>`;
      } else {
        grid += `<div class="tt-cell"></div>`;
      }
    });
  });
  grid += `</div></div>`;
  return grid;
}

function gpaCalculator() {
  const grades = ["A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"];
  const s = DB.currentStudent;
  return `
    <div id="gpaRows">
      ${s.completedCourses.map((id, i) => {
        const c = findCourse(id);
        return `
        <div class="flex items-center gap-8" style="margin-bottom:10px;">
          <span class="course-code" style="min-width:64px; text-align:center;">${c?.code || id}</span>
          <span class="small text-muted" style="flex:1;">${c?.credits || 3} credits</span>
          <select class="gpa-grade" data-credits="${c?.credits || 3}" style="width:80px; padding:8px; border-radius:8px; border:1.5px solid var(--surface-border); background:var(--surface-solid); color:var(--text-1);">
            ${grades.map(g => `<option ${i === 0 ? (g === "A-" ? "selected" : "") : (g === "B+" ? "selected" : "")}>${g}</option>`).join("")}
          </select>
        </div>`;
      }).join("")}
    </div>
    <div class="flex justify-between items-center mt-16" style="border-top:1px solid var(--surface-border); padding-top:14px;">
      <span class="small text-muted">Projected Cumulative GPA</span>
      <span class="mono" style="font-size:22px; font-weight:800; color:var(--accent);" id="gpaResult">${s.gpa.toFixed(2)}</span>
    </div>`;
}

const GRADE_POINTS = { "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "D": 1.0, "F": 0 };

function wireGpaCalculator(root) {
  const selects = root.querySelectorAll(".gpa-grade");
  const result = root.querySelector("#gpaResult");
  if (!selects.length || !result) return;
  const recalc = () => {
    let totalPts = 0, totalCr = 0;
    selects.forEach(sel => {
      const cr = +sel.dataset.credits;
      totalPts += GRADE_POINTS[sel.value] * cr;
      totalCr += cr;
    });
    result.textContent = (totalPts / totalCr).toFixed(2);
  };
  selects.forEach(sel => sel.addEventListener("change", recalc));
}

function electiveList(s) {
  const electives = DB.courses.filter(c => !s.completedCourses.includes(c.id) && !s.plan.includes(c.id)).slice(0, 3);
  return electives.map(c => `
    <div class="flex items-center gap-12" style="padding:10px 0; border-bottom:1px solid var(--surface-border);">
      <span class="course-code">${c.code}</span>
      <div style="flex:1;">
        <div style="font-weight:700; font-size:13.5px;">${c.title}</div>
        <div class="small text-muted">${c.credits} credits · ${findDept(c.dept).name}</div>
      </div>
      <button class="btn-sm btn-ghost" data-add-elective="${c.id}"><i data-lucide="plus" style="width:12px;height:12px;"></i> Add</button>
    </div>`).join("") || `<p class="small text-muted">You're all caught up on core requirements.</p>`;
}
