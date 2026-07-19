/* ============================================================
   ACADEMIA — Views
   Each view returns { title, sub, html, mount(root) }.
   `mount` runs after the HTML is inserted (wires charts/listeners).
   ============================================================ */

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DEPT_COLORS = { cs: "#6366f1", ee: "#0ea5e9", ma: "#10b981", bi: "#f59e0b" };

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
  return findCourse(courseId).prereqs.filter(p => !completed.includes(p));
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
    return {
      title: `Welcome back, ${s.name.split(" ")[0]}`,
      sub: `${s.major} · ${s.year} · Fall 2026`,
      html: `
        <div class="grid grid-4">
          ${statCard("gauge", "Current GPA", s.gpa.toFixed(2), "var(--gold-500)", "+0.06 vs last term", "up")}
          ${statCard("book-open", "Credits Completed", `${s.creditsCompleted}/${s.creditsRequired}`, "var(--info-500)")}
          ${statCard("calendar-check", "Planned This Term", `${planCredits()} cr`, "var(--ok-500)")}
          ${statCard("bell", "Unread Alerts", unread, "var(--danger-500)")}
        </div>

        <div class="grid grid-3 mt-24" style="grid-template-columns: 1.3fr 1fr;">
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>GPA Trend</h3><span class="tag tag-gold">Trending up</span></div>
            <div class="chart-box"><canvas id="chartGpaTrend"></canvas></div>
          </div>
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Graduation Progress</h3></div>
            <div class="ring-wrap">
              <div class="ring" style="--pct:${pct}"><b>${pct}%</b></div>
              <div>
                <p class="text-muted small">${s.creditsCompleted} of ${s.creditsRequired} credits complete</p>
                <p class="text-muted small mt-8">Est. graduation: <b class="mono">Spring 2028</b></p>
                <a class="link-btn" data-nav="planner">Open planner <i data-lucide="arrow-right" style="width:13px;height:13px;vertical-align:-2px;"></i></a>
              </div>
            </div>
          </div>
        </div>

        <div class="section-head"><h3>Top Professor Matches</h3><span class="link-btn" data-nav="recommendations">See all <i data-lucide="arrow-right" style="width:13px;height:13px;vertical-align:-2px;"></i></span></div>
        <div class="grid grid-3">
          ${top3.map(r => miniProfCard(r)).join("")}
        </div>

        <div class="section-head"><h3>Recent Notifications</h3><span class="link-btn" data-nav="notifications">View all <i data-lucide="arrow-right" style="width:13px;height:13px;vertical-align:-2px;"></i></span></div>
        <div class="card-solid">
          ${DB.notifications.slice(0, 3).map(notifRow).join("")}
        </div>
      `,
      mount() { renderGpaTrendChart("chartGpaTrend"); }
    };
  },

  courses(state) {
    const s = DB.currentStudent;
    const q = (state.query || "").toLowerCase();
    const dept = state.filterDept || "all";
    let list = DB.courses.filter(c =>
      (dept === "all" || c.dept === dept) &&
      (c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
    );
    return {
      title: "Course Catalog",
      sub: `${DB.courses.length} courses offered this term`,
      html: `
        <div class="filter-row" style="margin-bottom:18px;">
          ${["all", ...DB.departments.map(d => d.id)].map(id => {
            const label = id === "all" ? "All Departments" : findDept(id).name;
            return `<button class="pill-btn ${dept === id ? "active" : ""}" data-filter-dept="${id}">${label}</button>`;
          }).join("")}
        </div>
        <div class="grid" style="grid-template-columns:1fr; gap:12px;">
          ${list.length ? list.map(c => courseRow(c, s)).join("") : emptyState("search-x", "No courses match your search.")}
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
      title: "Professor Recommendations",
      sub: "Weighted match score based on your learning profile & past preferences",
      html: `
        <div class="card mb-none" style="margin-bottom:18px;">
          <div class="grid grid-3" style="align-items:end;">
            <div class="field" style="margin:0;">
              <label>Course</label>
              <select id="recCourseSelect">
                ${DB.courses.map(c => `<option value="${c.id}" ${c.id === courseId ? "selected" : ""}>${c.code} — ${c.title}</option>`).join("")}
              </select>
            </div>
            <div class="field" style="margin:0;">
              <label>Learning style</label>
              <select id="recLearningStyle">
                ${["visual", "handson", "theoretical", "discussion"].map(v => `<option value="${v}" ${s.learningStyle === v ? "selected" : ""}>${v[0].toUpperCase() + v.slice(1)}</option>`).join("")}
              </select>
            </div>
            <div class="field" style="margin:0;">
              <label>Grading preference</label>
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
        root.querySelector("#recLearningStyle").addEventListener("change", (e) => { DB.currentStudent.learningStyle = e.target.value; Router.render(); toast("Learning style updated", "success"); });
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
    const pct = Math.round((s.creditsCompleted / s.creditsRequired) * 100);
    const prereqIssues = s.plan.map(id => ({ id, missing: missingPrereqs(id, s.completedCourses) })).filter(x => x.missing.length && findCourse(x.id));

    return {
      title: "Semester Planner",
      sub: `Fall 2026 · ${credits}/${s.maxCredits} credits staged`,
      html: `
        ${overLimit ? warnBanner("alert-triangle", "Over the credit limit", `Your plan totals ${credits} credits, above the ${s.maxCredits}-credit maximum. Remove a course before saving.`) : ""}
        ${conflicts.size ? warnBanner("calendar-x", "Timetable conflict detected", `${[...conflicts].map(id => findCourse(id)?.code || id).join(" and ")} overlap on the schedule below.`) : ""}
        ${prereqIssues.map(pi => warnBanner("lock", "Missing prerequisite", `${findCourse(pi.id)?.title || pi.id} requires ${pi.missing.map(m => findCourse(m)?.title || m).join(", ")}.`)).join("")}

        <div class="grid grid-3" style="grid-template-columns:1.4fr 1fr;">
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Weekly Timetable</h3></div>
            ${renderTimetable(s.plan, conflicts)}
          </div>
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Staged Courses</h3></div>
            ${plan.length ? plan.map(c => `
              <div class="course-row" style="margin-bottom:10px;">
                <span class="course-code">${c.code}</span>
                <div style="flex:1;">
                  <div class="course-row__title">${c.title}</div>
                  <div class="course-row__meta"><span>${c.credits} credits</span><span>${professorsForCourse(c.id).map(p => p.name).join(", ")}</span></div>
                </div>
                <button class="btn-icon" data-remove-plan="${c.id}"><i data-lucide="x"></i></button>
              </div>`).join("") : emptyState("calendar-plus", "No courses staged yet. Add some from the catalog.")}
            <button class="btn btn-primary mt-16" id="savePlanBtn"><i data-lucide="save" style="width:16px;height:16px"></i> Save Semester Plan</button>
          </div>
        </div>

        <div class="grid grid-2 mt-24">
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>GPA Calculator</h3></div>
            ${gpaCalculator()}
          </div>
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Recommended Electives</h3></div>
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
          toast("Semester plan saved", "success");
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
      title: "Professor Reviews",
      sub: "Real feedback from students who completed the course",
      html: `
        <div class="flex justify-between items-center" style="margin-bottom:16px;">
          <div class="filter-row">
            ${["all", ...DB.departments.map(d => d.id)].map(id => `<button class="pill-btn ${dept === id ? "active" : ""}" data-review-dept="${id}">${id === "all" ? "All" : findDept(id).name}</button>`).join("")}
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
                  <div class="flex items-center gap-8">${starRow(avgRating(p.id))}<span class="small text-muted">${avgRating(p.id).toFixed(1)} · ${p.ratingCount} ratings</span></div>
                </div>
              </div>
              <div class="mt-16">
                ${reviewsForProfessor(p.id).slice(0, 2).map(reviewCard).join("") || `<p class="small text-muted">No written reviews yet.</p>`}
              </div>
            </div>
          `).join("")}
        </div>
      `,
      mount(root) {
        root.querySelectorAll("[data-review-dept]").forEach(b => b.addEventListener("click", () => { Router.state.reviewDept = b.dataset.reviewDept; Router.render(); }));
        root.querySelector("#writeReviewBtn").addEventListener("click", openReviewModal);
        root.querySelectorAll("[data-upvote]").forEach(b => b.addEventListener("click", () => {
          const r = DB.reviews.find(rv => rv.id === b.dataset.upvote); r.upvotes++; Router.render();
        }));
      }
    };
  },

  notifications() {
    return {
      title: "Notifications",
      sub: `${DB.notifications.filter(n => n.unread).length} unread`,
      html: `
        <div class="card-solid">
          ${DB.notifications.map(notifRow).join("")}
        </div>
      `,
      mount(root) {
        root.querySelectorAll("[data-mark-read]").forEach(b => b.addEventListener("click", () => {
          const n = DB.notifications.find(n => n.id === b.dataset.markRead); n.unread = false; Router.render(); refreshNotifDot();
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
    return {
      title: `Welcome, ${p.name}`,
      sub: `${p.title} · ${findDept(p.dept).name}`,
      html: `
        <div class="grid grid-4">
          ${statCard("star", "Average Rating", avgRating(p.id).toFixed(1), "var(--gold-500)")}
          ${statCard("users", "Students Taught", totalStudents, "var(--info-500)")}
          ${statCard("book-open", "Active Courses", myCourses.length, "var(--ok-500)")}
          ${statCard("message-circle", "Written Reviews", reviewsForProfessor(p.id).length, "var(--navy-500)")}
        </div>
        <div class="grid grid-2 mt-24">
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Your Trait Profile</h3></div>
            <div class="chart-box"><canvas id="profRadar"></canvas></div>
          </div>
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Rating Breakdown</h3></div>
            ${Object.entries(p.traits).map(([k, v]) => traitBar(traitLabel(k), v)).join("")}
          </div>
        </div>
        <div class="section-head"><h3>Recent Feedback</h3><span class="link-btn" data-nav="feedback">See all <i data-lucide="arrow-right" style="width:13px;height:13px;vertical-align:-2px;"></i></span></div>
        <div class="grid grid-2">
          ${reviewsForProfessor(p.id).slice(0, 2).map(reviewCard).join("") || emptyState("message-square", "No feedback yet this term.")}
        </div>
      `,
      mount() { renderProfTraitRadar("profRadar", p); }
    };
  },

  profile() {
    const p = DB.currentProfessor;
    return {
      title: "Edit Profile",
      sub: "Keep your office hours and bio current for students",
      html: `
        <div class="grid grid-2">
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Basic Info</h3></div>
            <div class="field"><label>Full name</label><input id="pfName" value="${p.name}"/></div>
            <div class="field"><label>Title</label><input id="pfTitle" value="${p.title}"/></div>
            <div class="field"><label>Bio</label><textarea id="pfBio" rows="4">${p.bio}</textarea></div>
            <div class="field"><label>Office hours</label><input id="pfOffice" value="${p.officeHours}"/></div>
            <button class="btn btn-primary" id="saveProfileBtn"><i data-lucide="check" style="width:16px;height:16px"></i> Save Changes</button>
          </div>
          <div class="card">
            <div class="section-head" style="margin-top:0"><h3>Course Materials</h3></div>
            <p class="small text-muted">Upload files for the courses you teach. Students see these on the course page.</p>
            <div class="field mt-16"><label>Syllabus</label><input type="file"/></div>
            <div class="field"><label>Grading Policy</label><input type="file"/></div>
            <button class="btn btn-ghost" id="uploadDocsBtn"><i data-lucide="upload" style="width:16px;height:16px"></i> Upload Documents</button>
          </div>
        </div>
      `,
      mount(root) {
        root.querySelector("#saveProfileBtn").addEventListener("click", () => {
          p.name = root.querySelector("#pfName").value;
          p.title = root.querySelector("#pfTitle").value;
          p.bio = root.querySelector("#pfBio").value;
          p.officeHours = root.querySelector("#pfOffice").value;
          toast("Profile updated", "success"); Router.render();
        });
        root.querySelector("#uploadDocsBtn").addEventListener("click", () => toast("Documents uploaded", "success"));
      }
    };
  },

  courses() {
    const p = DB.currentProfessor;
    const myCourses = DB.courses.filter(c => c.profIds.includes(p.id));
    return {
      title: "My Courses",
      sub: `${myCourses.length} courses this term`,
      html: `<div class="grid" style="grid-template-columns:1fr; gap:12px;">${myCourses.map(c => courseRow(c)).join("")}</div>`,
      mount() {}
    };
  },

  feedback() {
    const p = DB.currentProfessor;
    const reviews = reviewsForProfessor(p.id);
    return {
      title: "Student Feedback",
      sub: `${reviews.length} written reviews · ${avgRating(p.id).toFixed(1)} average`,
      html: `<div class="grid grid-2">${reviews.map(reviewCard).join("") || emptyState("message-square", "No feedback submitted yet.")}</div>`,
      mount(root) {
        root.querySelectorAll("[data-upvote]").forEach(b => b.addEventListener("click", () => {
          const r = DB.reviews.find(rv => rv.id === b.dataset.upvote); r.upvotes++; Router.render();
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
      title: "Admin Overview",
      sub: "Institution-wide snapshot for Fall 2026",
      html: `
        <div class="grid grid-4">
          ${statCard("users", "Total Students", DB.students.length + 1240, "var(--info-500)", "+3.2%", "up")}
          ${statCard("graduation-cap", "Professors", DB.professors.length + 118, "var(--gold-500)")}
          ${statCard("book-open", "Active Courses", DB.courses.length + 96, "var(--ok-500)")}
          ${statCard("star", "Avg. Rating", "4.4", "var(--navy-500)", "+0.1", "up")}
        </div>
        <div class="grid grid-2 mt-24">
          <div class="card"><div class="section-head" style="margin-top:0"><h3>Department Ratings</h3></div><div class="chart-box"><canvas id="chartDeptRatings"></canvas></div></div>
          <div class="card"><div class="section-head" style="margin-top:0"><h3>Enrollment Trend</h3></div><div class="chart-box"><canvas id="chartEnrollment"></canvas></div></div>
        </div>
        <div class="section-head"><h3>Flagged Reviews</h3><span class="link-btn" data-nav="adminReviews">Moderate <i data-lucide="arrow-right" style="width:13px;height:13px;vertical-align:-2px;"></i></span></div>
        <div class="card-solid">
          ${DB.reviews.slice(0, 2).map(reviewCard).join("")}
        </div>
      `,
      mount() { renderDeptRatingsChart("chartDeptRatings"); renderEnrollmentChart("chartEnrollment"); }
    };
  },

  students(state) {
    const q = (state.query || "").toLowerCase();
    const list = DB.students.filter(s => s.name.toLowerCase().includes(q) || s.major.toLowerCase().includes(q));
    return {
      title: "Manage Students",
      sub: `${DB.students.length} students on record`,
      html: `
        <div class="card-solid table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Major</th><th>Year</th><th>GPA</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${list.map(s => `
                <tr>
                  <td><div class="row-avatar"><div class="avatar" style="width:32px;height:32px;font-size:11px;">${initials(s.name)}</div><div><div style="font-weight:600;">${s.name}</div><div class="small text-muted">${s.email}</div></div></div></td>
                  <td>${s.major}</td>
                  <td>${s.year}</td>
                  <td class="mono">${s.gpa.toFixed(2)}</td>
                  <td><span class="tag ${s.status === "active" ? "tag-ok" : "tag-warn"}">${s.status}</span></td>
                  <td><div class="table-actions"><button class="btn-icon" data-remove-student="${s.id}"><i data-lucide="trash-2"></i></button></div></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      `,
      mount(root) {
        root.querySelectorAll("[data-remove-student]").forEach(b => b.addEventListener("click", () => {
          DB.students = DB.students.filter(s => s.id !== b.dataset.removeStudent); toast("Student removed", "success"); Router.render();
        }));
      }
    };
  },

  professors(state) {
    const q = (state.query || "").toLowerCase();
    const list = DB.professors.filter(p => p.name.toLowerCase().includes(q));
    return {
      title: "Manage Professors",
      sub: `${DB.professors.length} faculty members`,
      html: `
        <div class="card-solid table-wrap">
          <table>
            <thead><tr><th>Professor</th><th>Department</th><th>Rating</th><th>Courses</th><th></th></tr></thead>
            <tbody>
              ${list.map(p => `
                <tr>
                  <td><div class="row-avatar"><div class="avatar" style="width:32px;height:32px;font-size:11px;">${p.photoInitials}</div><div><div style="font-weight:600;">${p.name}</div><div class="small text-muted">${p.title}</div></div></div></td>
                  <td><span class="tag tag-navy">${findDept(p.dept)?.name || p.dept}</span></td>
                  <td>${starRow(avgRating(p.id))}</td>
                  <td class="mono">${p.courses.map(findCourse).filter(Boolean).map(c => c.code).join(", ")}</td>
                  <td><div class="table-actions"><button class="btn-icon" data-view-prof="${p.id}"><i data-lucide="eye"></i></button><button class="btn-icon" data-remove-prof="${p.id}"><i data-lucide="trash-2"></i></button></div></td>
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
      title: "Manage Courses",
      sub: `${DB.courses.length} courses across ${DB.departments.length} departments`,
      html: `
        <div class="card-solid table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Title</th><th>Dept</th><th>Credits</th><th>Enrollment</th><th>Assigned To</th><th></th></tr></thead>
            <tbody>
              ${list.map(c => `
                <tr>
                  <td><span class="course-code">${c.code}</span></td>
                  <td>${c.title}</td>
                  <td><span class="tag tag-navy">${findDept(c.dept).name}</span></td>
                  <td class="mono">${c.credits}</td>
                  <td class="mono">${c.enrolled}/${c.seats}</td>
                  <td>${c.profIds.map(id => findProfessor(id).name).join(", ")}</td>
                  <td><div class="table-actions"><button class="btn-icon" data-remove-course="${c.id}"><i data-lucide="trash-2"></i></button></div></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      `,
      mount(root) {
        root.querySelectorAll("[data-remove-course]").forEach(b => b.addEventListener("click", () => {
          DB.courses = DB.courses.filter(c => c.id !== b.dataset.removeCourse); toast("Course removed", "success"); Router.render();
        }));
      }
    };
  },

  analytics() {
    return {
      title: "Analytics",
      sub: "Institution performance across departments and courses",
      html: `
        <div class="grid grid-2">
          <div class="card"><div class="section-head" style="margin-top:0"><h3>Popular Courses</h3></div><div class="chart-box"><canvas id="chartPopular"></canvas></div></div>
          <div class="card"><div class="section-head" style="margin-top:0"><h3>Course Success Rate</h3></div><div class="chart-box"><canvas id="chartSuccess"></canvas></div></div>
          <div class="card"><div class="section-head" style="margin-top:0"><h3>Department Ratings</h3></div><div class="chart-box"><canvas id="chartDeptRatings2"></canvas></div></div>
          <div class="card"><div class="section-head" style="margin-top:0"><h3>Enrollment Trend</h3></div><div class="chart-box"><canvas id="chartEnrollment2"></canvas></div></div>
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
      title: "Moderate Reviews",
      sub: `${DB.reviews.length} reviews on file`,
      html: `<div class="grid grid-2">${DB.reviews.map(r => reviewCard(r, true)).join("") || emptyState("message-square", "No reviews yet.")}</div>`,
      mount(root) {
        root.querySelectorAll("[data-remove-review]").forEach(b => b.addEventListener("click", () => {
          DB.reviews = DB.reviews.filter(r => r.id !== b.dataset.removeReview); toast("Review removed", "success"); Router.render();
        }));
      }
    };
  },
};

/* ---------------------------------------------------------
   Shared render helpers
--------------------------------------------------------- */

function statCard(icon, label, value, color, delta, dir) {
  return `
    <div class="card stat-card">
      ${delta ? `<span class="stat-delta ${dir}">${delta}</span>` : ""}
      <div class="stat-icon" style="background:color-mix(in srgb, ${color} 16%, transparent); color:${color};"><i data-lucide="${icon}"></i></div>
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
        <div class="seal-medal" style="--pct:${r.compatibility}; width:52px; height:52px;">
          <div class="seal-medal__inner"><b style="font-size:13px;">${r.compatibility}%</b></div>
        </div>
        <div>
          <div class="prof-card__name" style="font-size:14.5px;">${p.name}</div>
          ${starRow(avgRating(p.id))}
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
            <div class="flex items-center gap-8">
              ${i === 0 ? `<span class="tag tag-gold">Top pick</span>` : ""}
              <span class="prof-card__name">${p.name}</span>
            </div>
            <div class="prof-card__meta">${p.title} · ${findDept(p.dept).name} · ${p.ratingCount} ratings</div>
          </div>
          <div class="flex gap-8">
            <button class="btn-sm btn-ghost" data-open-prof="${p.id}">View Profile</button>
            <button class="btn-sm btn-primary" data-add-plan="${courseId}">Add to Plan</button>
          </div>
        </div>
        ${starRow(avgRating(p.id))}
        <ul class="reasons">${r.reasons.map(reason => `<li><i data-lucide="check-circle-2"></i>${reason}</li>`).join("")}</ul>
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
          <span>${c.credits} credits</span>
          <span>${professorsForCourse(c.id).map(p => p?.name || "").filter(Boolean).join(", ")}</span>
          ${c.prereqs.length ? `<span><i data-lucide="link" style="width:11px;height:11px;vertical-align:-2px;"></i> Requires ${c.prereqs.map(p => findCourse(p)?.code || p).join(", ")}</span>` : ""}
        </div>
      </div>
      <div style="text-align:right;">
        <div class="small text-muted mono">${c.enrolled}/${c.seats}</div>
        <div class="seat-bar mt-8"><div style="width:${seatPct}%; background:${seatColor};"></div></div>
      </div>
      ${student ? `
        <button class="btn-sm btn-ghost" data-view-recs="${c.id}">Match Me</button>
        <button class="btn-sm ${staged ? "btn-ghost" : "btn-primary"}" data-add-plan="${c.id}" ${staged ? "disabled" : ""}>${staged ? "In Plan" : "Add"}</button>
      ` : ""}
    </div>`;
}

function reviewCard(r, moderation = false) {
  return `
    <div class="review">
      <div class="review__head">
        <div>
          <div class="review__author">${r.anonymous ? "Anonymous Student" : r.author}</div>
          <div class="flex items-center gap-8">${starRow(r.rating)}<span class="review__date">${r.date}</span></div>
        </div>
        ${moderation ? `<button class="btn-icon" data-remove-review="${r.id}"><i data-lucide="trash-2"></i></button>` : ""}
      </div>
      <div class="review__body">
        <div class="pro"><span class="lbl">Pros</span>${r.pros}</div>
        <div class="con"><span class="lbl">Cons</span>${r.cons}</div>
      </div>
      <div class="review__foot" data-upvote="${r.id}"><i data-lucide="thumbs-up" style="width:13px;height:13px;"></i> Helpful (${r.upvotes})</div>
    </div>`;
}

function notifRow(n) {
  const iconMap = { info: ["info", "var(--info-500)", "var(--info-100)"], warning: ["alert-triangle", "var(--warn-500)", "var(--warn-100)"] };
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
  let grid = `<div class="timetable">`;
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
          return `<div class="tt-block ${isConflict ? "conflict" : ""}" style="position:relative; inset:auto; flex:1; background:${color};">${course.code}<span>${professorsForCourse(course.id)[0]?.name.split(" ").pop() || ""}</span></div>`;
        }).filter(Boolean).join("");
        grid += `<div class="tt-cell" style="display:flex; gap:2px; padding:2px;">${inner}</div>`;
      } else {
        grid += `<div class="tt-cell"></div>`;
      }
    });
  });
  grid += `</div>`;
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
          <span class="course-code" style="min-width:64px; text-align:center;">${c.code}</span>
          <span class="small text-muted" style="flex:1;">${c.credits} cr</span>
          <select class="gpa-grade" data-credits="${c.credits}" style="width:80px; padding:8px; border-radius:8px; border:1.5px solid var(--surface-border); background:var(--surface-solid); color:var(--text-1);">
            ${grades.map(g => `<option ${i === 0 ? (g === "A-" ? "selected" : "") : (g === "B+" ? "selected" : "")}>${g}</option>`).join("")}
          </select>
        </div>`;
      }).join("")}
    </div>
    <div class="flex justify-between items-center mt-16" style="border-top:1px solid var(--surface-border); padding-top:14px;">
      <span class="small text-muted">Projected GPA</span>
      <span class="mono" style="font-size:22px; font-weight:700; color:var(--accent);" id="gpaResult">${s.gpa.toFixed(2)}</span>
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
        <div style="font-weight:600; font-size:13.5px;">${c.title}</div>
        <div class="small text-muted">${c.credits} credits · ${findDept(c.dept).name}</div>
      </div>
      <button class="btn-sm btn-ghost" data-add-elective="${c.id}">Add</button>
    </div>`).join("") || `<p class="small text-muted">You're all caught up on core requirements.</p>`;
}
