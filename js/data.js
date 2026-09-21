/* ============================================================
   ACADEMIA — Dummy Data Layer
   Enriched with ML-ready feature traits, NLP sentiment metadata,
   and detailed course workloads.
   ============================================================ */

const DB = {
  departments: [
    { id: "cs", name: "Computer Science", color: "#6366f1" },
    { id: "ee", name: "Electrical Engineering", color: "#06b6d4" },
    { id: "ma", name: "Mathematics", color: "#10b981" },
    { id: "bi", name: "Biology", color: "#f59e0b" },
  ],

  professors: [
    {
      id: "p1", name: "Dr. Elena Vasquez", dept: "cs",
      title: "Associate Professor", photoInitials: "EV",
      traits: { teaching: 4.8, difficulty: 3.1, grading: 4.2, attendance: 2.4, friendliness: 4.6, knowledge: 4.9, responsiveness: 4.4, labQuality: 4.5, assignmentLoad: 3.0, examDifficulty: 3.2 },
      officeHours: "Tue & Thu, 2:00–4:00 PM · Turing Hall 214",
      bio: "Distributed systems and databases. Believes the best lectures raise more questions than they answer.",
      courses: ["cs301", "cs410"],
      ratingCount: 214,
      aiSummary: "Outstanding instructor for distributed systems. Highly praised for clear real-world examples and accessible office hours."
    },
    {
      id: "p2", name: "Dr. Marcus Chen", dept: "cs",
      title: "Professor", photoInitials: "MC",
      traits: { teaching: 4.1, difficulty: 4.6, grading: 3.0, attendance: 4.5, friendliness: 3.4, knowledge: 4.9, responsiveness: 3.2, labQuality: 3.8, assignmentLoad: 4.7, examDifficulty: 4.6 },
      officeHours: "Mon & Wed, 10:00–11:30 AM · Turing Hall 301",
      bio: "Algorithms purist. Office hours run long because he can't stop drawing on the whiteboard.",
      courses: ["cs201", "cs410"],
      ratingCount: 341,
      aiSummary: "Rigorous theoretical depth with rigorous problem sets. Recommended for students aiming for competitive programming or system research."
    },
    {
      id: "p3", name: "Dr. Priya Raman", dept: "cs",
      title: "Assistant Professor", photoInitials: "PR",
      traits: { teaching: 4.6, difficulty: 2.6, grading: 4.7, attendance: 2.0, friendliness: 4.8, knowledge: 4.3, responsiveness: 4.7, labQuality: 4.2, assignmentLoad: 2.5, examDifficulty: 2.4 },
      officeHours: "Wed, 1:00–3:00 PM · Ada Building 118",
      bio: "First-generation faculty. Runs a low-stakes, high-support classroom on purpose.",
      courses: ["cs101", "cs201"],
      ratingCount: 178,
      aiSummary: "Top-tier empathy and welcoming classroom atmosphere. Excellent mentor for beginners and visual learners."
    },
    {
      id: "p4", name: "Dr. Idris Okafor", dept: "ee",
      title: "Professor", photoInitials: "IO",
      traits: { teaching: 3.8, difficulty: 4.3, grading: 3.3, attendance: 4.8, friendliness: 3.6, knowledge: 4.7, responsiveness: 3.5, labQuality: 4.6, assignmentLoad: 4.2, examDifficulty: 4.4 },
      officeHours: "Thu, 3:00–5:00 PM · Faraday Hall 022",
      bio: "Circuits and signals. Attendance is not optional, and he will notice.",
      courses: ["ee220"],
      ratingCount: 132,
      aiSummary: "Hands-on oscilloscope mastery with strict attendance protocols and challenging lab practicums."
    },
    {
      id: "p5", name: "Dr. Sofia Bianchi", dept: "ma",
      title: "Associate Professor", photoInitials: "SB",
      traits: { teaching: 4.4, difficulty: 3.8, grading: 3.9, attendance: 3.0, friendliness: 4.2, knowledge: 4.8, responsiveness: 4.0, labQuality: 4.0, assignmentLoad: 3.6, examDifficulty: 3.9 },
      officeHours: "Mon, 9:00–11:00 AM · Euler Hall 204",
      bio: "Linear algebra with a proof-first philosophy — and surprisingly good analogies.",
      courses: ["ma210"],
      ratingCount: 96,
      aiSummary: "Intuitive geometric breakdowns of vector spaces combined with structured, fair proof exams."
    },
    {
      id: "p6", name: "Dr. Grace Lin", dept: "bi",
      title: "Professor", photoInitials: "GL",
      traits: { teaching: 4.7, difficulty: 3.4, grading: 4.1, attendance: 3.5, friendliness: 4.9, knowledge: 4.6, responsiveness: 4.5, labQuality: 4.8, assignmentLoad: 3.3, examDifficulty: 3.4 },
      officeHours: "Fri, 11:00 AM–1:00 PM · Darwin Wing 3B",
      bio: "Molecular biology. Known for turning lab sections into the best part of students' week.",
      courses: ["bi150", "bi210"],
      ratingCount: 205,
      aiSummary: "Superb lab instruction and encouraging mentorship with high focus on biotechnology applications."
    },
    {
      id: "p7", name: "Dr. Sarah Jenkins", dept: "ee",
      title: "Assistant Professor", photoInitials: "SJ",
      traits: { teaching: 4.5, difficulty: 3.5, grading: 4.0, attendance: 3.2, friendliness: 4.7, knowledge: 4.8, responsiveness: 4.6, labQuality: 4.4, assignmentLoad: 3.2, examDifficulty: 3.4 },
      officeHours: "Mon & Wed, 2:00–4:00 PM · Faraday Hall 115",
      bio: "Embedded systems researcher. Believes hands-on lab experiments teach more than a blackboard ever could.",
      courses: ["ee110", "ee220", "ee310"],
      ratingCount: 89,
      aiSummary: "Project-driven syllabus focused on microcontrollers and embedded firmware design."
    },
    {
      id: "p8", name: "Dr. Alan Turing", dept: "ma",
      title: "Professor", photoInitials: "AT",
      traits: { teaching: 4.9, difficulty: 4.8, grading: 2.8, attendance: 3.8, friendliness: 3.8, knowledge: 5.0, responsiveness: 3.5, labQuality: 3.0, assignmentLoad: 4.9, examDifficulty: 4.8 },
      officeHours: "Tue & Thu, 10:00–12:00 PM · Turing Hall 101",
      bio: "Logician, mathematician. Passionate about computability theory and cryptanalysis.",
      courses: ["ma101", "ma310", "ma210"],
      ratingCount: 512,
      aiSummary: "World-class intellectual rigor and deep theoretical proofs. Grading is exceptionally demanding."
    },
    {
      id: "p9", name: "Dr. Rosalind Franklin", dept: "bi",
      title: "Associate Professor", photoInitials: "RF",
      traits: { teaching: 4.6, difficulty: 4.0, grading: 3.8, attendance: 4.0, friendliness: 4.2, knowledge: 4.9, responsiveness: 4.3, labQuality: 4.8, assignmentLoad: 3.9, examDifficulty: 4.0 },
      officeHours: "Wed, 3:00–5:00 PM · Darwin Wing 204",
      bio: "X-ray crystallographer and biophysicist. Focused on structural biology.",
      courses: ["bi150", "bi210", "bi310"],
      ratingCount: 147,
      aiSummary: "Rigorous laboratory protocols with profound insight into protein structure and genetics."
    },
  ],

  courses: [
    { id: "cs101", code: "CS 101", title: "Foundations of Programming", dept: "cs", credits: 3, prereqs: [], profIds: ["p3", "p1"], seats: 40, enrolled: 37, semester: "Fall 2026", schedule: [{ day: 0, start: 9, end: 10.5 }, { day: 2, start: 9, end: 10.5 }] },
    { id: "cs201", code: "CS 201", title: "Data Structures & Algorithms", dept: "cs", credits: 4, prereqs: ["cs101"], profIds: ["p2", "p3"], seats: 35, enrolled: 35, semester: "Fall 2026", schedule: [{ day: 1, start: 11, end: 12.5 }, { day: 3, start: 11, end: 12.5 }] },
    { id: "cs301", code: "CS 301", title: "Database Systems", dept: "cs", credits: 3, prereqs: ["cs201"], profIds: ["p1", "p2"], seats: 30, enrolled: 22, semester: "Fall 2026", schedule: [{ day: 0, start: 13, end: 14.5 }] },
    { id: "cs410", code: "CS 410", title: "Operating Systems", dept: "cs", credits: 4, prereqs: ["cs201"], profIds: ["p1", "p2"], seats: 28, enrolled: 26, semester: "Fall 2026", schedule: [{ day: 1, start: 14, end: 15.5 }, { day: 3, start: 14, end: 15.5 }] },
    { id: "ee220", code: "EE 220", title: "Circuits & Signals", dept: "ee", credits: 4, prereqs: [], profIds: ["p4", "p7"], seats: 32, enrolled: 19, semester: "Fall 2026", schedule: [{ day: 1, start: 14, end: 15.5 }, { day: 3, start: 14, end: 15.5 }] },
    { id: "ee110", code: "EE 110", title: "Introduction to Digital Systems", dept: "ee", credits: 3, prereqs: [], profIds: ["p7", "p4"], seats: 45, enrolled: 41, semester: "Fall 2026", schedule: [{ day: 0, start: 9, end: 10.5 }, { day: 2, start: 9, end: 10.5 }] },
    { id: "ee310", code: "EE 310", title: "Microcontroller Applications", dept: "ee", credits: 4, prereqs: ["ee110"], profIds: ["p4", "p7"], seats: 30, enrolled: 26, semester: "Fall 2026", schedule: [{ day: 1, start: 13, end: 14.5 }] },
    { id: "ma210", code: "MA 210", title: "Linear Algebra", dept: "ma", credits: 3, prereqs: [], profIds: ["p5", "p8"], seats: 45, enrolled: 30, semester: "Fall 2026", schedule: [{ day: 0, start: 10.5, end: 12 }] },
    { id: "ma101", code: "MA 101", title: "Calculus I", dept: "ma", credits: 4, prereqs: [], profIds: ["p5", "p8"], seats: 60, enrolled: 55, semester: "Fall 2026", schedule: [{ day: 1, start: 9, end: 10.5 }, { day: 3, start: 9, end: 10.5 }] },
    { id: "ma310", code: "MA 310", title: "Probability & Statistics", dept: "ma", credits: 3, prereqs: ["ma101"], profIds: ["p8", "p5"], seats: 40, enrolled: 32, semester: "Fall 2026", schedule: [{ day: 0, start: 14, end: 15.5 }] },
    { id: "bi150", code: "BI 150", title: "Molecular Biology", dept: "bi", credits: 4, prereqs: [], profIds: ["p6", "p9"], seats: 38, enrolled: 33, semester: "Fall 2026", schedule: [{ day: 4, start: 9, end: 10.5 }, { day: 2, start: 9, end: 10.5 }] },
    { id: "bi210", code: "BI 210", title: "Genetics & Inheritance", dept: "bi", credits: 4, prereqs: ["bi150"], profIds: ["p6", "p9"], seats: 35, enrolled: 31, semester: "Fall 2026", schedule: [{ day: 1, start: 10.5, end: 12 }, { day: 3, start: 10.5, end: 12 }] },
    { id: "bi310", code: "BI 310", title: "Cell & Developmental Biology", dept: "bi", credits: 4, prereqs: ["bi150"], profIds: ["p9", "p6"], seats: 25, enrolled: 18, semester: "Fall 2026", schedule: [{ day: 2, start: 13, end: 14.5 }] },
  ],

  reviews: [
    { id: "r1", profId: "p1", author: "S. Nakamura", anonymous: false, rating: 5, pros: "Explains query optimization better than any textbook! Very clear slides and supportive office hours.", cons: "Attendance is checked, easy to lose points if sick.", upvotes: 24, date: "2026-05-02" },
    { id: "r2", profId: "p1", author: "Anonymous", anonymous: true, rating: 4, pros: "Fair grading and responds to email same day with great feedback.", cons: "Lectures move fast in week 3–4 with heavy project workload.", upvotes: 11, date: "2026-04-18" },
    { id: "r3", profId: "p2", author: "Anonymous", anonymous: true, rating: 4, pros: "You will actually understand Big-O and advanced dynamic programming after this class. Brilliant professor.", cons: "Heavy problem sets every week and very tough exam grading.", upvotes: 31, date: "2026-05-10" },
    { id: "r4", profId: "p3", author: "J. Alvarado", anonymous: false, rating: 5, pros: "Best intro course on campus, zero judgment for questions and very forgiving grading.", cons: "Almost too gentle if you want to be pushed into difficult competitive programming.", upvotes: 19, date: "2026-03-29" },
    { id: "r5", profId: "p6", author: "Anonymous", anonymous: true, rating: 5, pros: "Lab sections are genuinely fun, hands-on, and extremely well organized.", cons: "Lab reports take time to write.", upvotes: 14, date: "2026-05-14" },
    { id: "r6", profId: "p7", author: "M. Patel", anonymous: false, rating: 4, pros: "Very practical hands-on labs with microcontrollers, great learning experience.", cons: "Quizzes can be tricky if you skip the reading.", upvotes: 8, date: "2026-04-20" },
    { id: "r7", profId: "p8", author: "Anonymous", anonymous: true, rating: 5, pros: "A true legend. Lectures are mind-blowing and mathematically elegant.", cons: "Extremely difficult grading and impossible theoretical exams.", upvotes: 45, date: "2026-05-18" },
    { id: "r8", profId: "p9", author: "Anonymous", anonymous: true, rating: 4, pros: "Very knowledgeable and organized structure for structural biology.", cons: "Strict on deadlines and attendance.", upvotes: 12, date: "2026-05-05" },
  ],

  notifications: [
    { id: "n1", title: "AI Recommendation Engine Updated", body: "Neural match weights recalibrated based on your latest semester GPA.", time: "10m ago", type: "info", unread: true },
    { id: "n2", title: "Timetable conflict detected", body: "CS 410 and EE 220 overlap on Tue/Thu 2:00 PM. High burnout potential.", time: "5h ago", type: "warning", unread: true },
    { id: "n3", title: "Registration opens soon", body: "Spring 2027 priority registration opens for juniors on Aug 3.", time: "1d ago", type: "info", unread: false },
    { id: "n4", title: "New reply on your review", body: "Dr. Vasquez replied to your review on CS 301.", time: "2d ago", type: "info", unread: false },
  ],

  students: [
    { id: "s1", name: "Amara Osei", email: "amara.osei@university.edu", major: "Computer Science", year: "Junior", gpa: 3.72, status: "active" },
    { id: "s2", name: "Leo Fontaine", email: "leo.fontaine@university.edu", major: "Electrical Engineering", year: "Sophomore", gpa: 3.31, status: "active" },
    { id: "s3", name: "Mei Tanaka", email: "mei.tanaka@university.edu", major: "Mathematics", year: "Senior", gpa: 3.91, status: "active" },
    { id: "s4", name: "Diego Ramos", email: "diego.ramos@university.edu", major: "Biology", year: "Freshman", gpa: 3.05, status: "active" },
    { id: "s5", name: "Hannah Kim", email: "hannah.kim@university.edu", major: "Computer Science", year: "Senior", gpa: 3.58, status: "on leave" },
    { id: "s6", name: "Tunde Bakare", email: "tunde.bakare@university.edu", major: "Electrical Engineering", year: "Junior", gpa: 2.94, status: "active" },
  ],

  // Current session student
  currentStudent: {
    id: "s1",
    name: "Amara Osei",
    email: "amara.osei@university.edu",
    year: "Junior",
    major: "Computer Science",
    gpa: 3.72,
    creditsCompleted: 78,
    creditsRequired: 120,
    learningStyle: "visual",       // visual | handson | theoretical | discussion
    gradingPreference: "lenient",  // lenient | balanced | rigorous
    completedCourses: ["cs101", "cs201", "ma210"],
    savedPlans: [],
    plan: ["cs301", "cs410", "ee220"], // staged selection
    maxCredits: 18,
  },

  currentProfessor: null,
};

// Look-up helpers
const findCourse = (id) => DB.courses.find(c => c.id === id);
const findProfessor = (id) => DB.professors.find(p => p.id === id);
const findDept = (id) => DB.departments.find(d => d.id === id);
const professorsForCourse = (courseId) => {
  const c = findCourse(courseId);
  return c ? c.profIds.map(findProfessor).filter(Boolean) : [];
};
const reviewsForProfessor = (profId) => DB.reviews.filter(r => r.profId === profId);
const avgRating = (profId) => {
  const prof = findProfessor(profId);
  if (!prof) return 4.0;
  const t = prof.traits;
  const vals = [t.teaching, t.grading, t.friendliness, t.knowledge, t.responsiveness];
  return (vals.reduce((a, b) => a + b, 0) / vals.length);
};
