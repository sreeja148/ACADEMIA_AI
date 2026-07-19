/* ============================================================
   ACADEMIA — Recommendation Engine
   Weighted-average compatibility scoring, per the brief:

   Compatibility =
     0.30 × Teaching
   + 0.20 × Fair Grading
   + 0.15 × Difficulty Match
   + 0.15 × Learning Style
   + 0.10 × Reviews
   + 0.10 × Previous Preferences
   ============================================================ */

const LEARNING_STYLE_TRAIT = {
  visual: "labQuality",
  handson: "labQuality",
  theoretical: "knowledge",
  discussion: "friendliness",
};

function difficultyMatchScore(prof, student) {
  // Rigorous students want higher difficulty; lenient students want lower.
  const target = student.gradingPreference === "rigorous" ? 4.2
    : student.gradingPreference === "lenient" ? 2.2
    : 3.2;
  const diff = Math.abs(prof.traits.difficulty - target);
  return Math.max(0, 5 - diff * 1.6); // closer to target = higher score, out of 5
}

function learningStyleScore(prof, student) {
  const key = LEARNING_STYLE_TRAIT[student.learningStyle] || "knowledge";
  return prof.traits[key];
}

function reviewScore(profId) {
  const reviews = reviewsForProfessor(profId);
  if (!reviews.length) return 3.5; // neutral default
  return reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
}

function previousPreferenceScore(prof, student) {
  // Simulated "similar students liked this professor" signal,
  // nudged by grading-fairness alignment with student's stated preference.
  const gradingAligned = student.gradingPreference === "lenient" ? prof.traits.grading
    : student.gradingPreference === "rigorous" ? (5 - prof.traits.grading + prof.traits.difficulty) / 2
    : (prof.traits.grading + prof.traits.difficulty) / 2;
  return Math.min(5, gradingAligned);
}

/**
 * Compute compatibility (0-100) for a professor given a student profile.
 */
function computeCompatibility(prof, student) {
  const teaching = prof.traits.teaching;
  const grading = prof.traits.grading;
  const difficultyMatch = difficultyMatchScore(prof, student);
  const learningStyle = learningStyleScore(prof, student);
  const reviews = reviewScore(prof.id);
  const prevPref = previousPreferenceScore(prof, student);

  const weighted =
    0.30 * teaching +
    0.20 * grading +
    0.15 * difficultyMatch +
    0.15 * learningStyle +
    0.10 * reviews +
    0.10 * prevPref;

  // weighted is out of 5 -> convert to percentage
  const pct = Math.round((weighted / 5) * 100);

  const reasons = [];
  if (teaching >= 4.4) reasons.push("Consistently strong teaching reviews");
  if (student.learningStyle && learningStyle >= 4.3) reasons.push(`Strong fit for ${student.learningStyle} learners`);
  if (student.gradingPreference === "lenient" && grading >= 4.0) reasons.push("Easier, more forgiving grading");
  if (student.gradingPreference === "rigorous" && difficultyMatch >= 4.0) reasons.push("Matches your appetite for a challenge");
  if (reviews >= 4.3) reasons.push("High student satisfaction in recent reviews");
  if (prof.traits.responsiveness >= 4.3) reasons.push("Responsive to student questions");
  if (!reasons.length) reasons.push("Solid all-round fit based on your profile");

  return { profId: prof.id, compatibility: pct, reasons: reasons.slice(0, 3) };
}

/**
 * Return the top N professor recommendations for a course (or all professors
 * if no course given), ranked by compatibility with the given student.
 */
function recommendProfessors(student, courseId = null, topN = 5) {
  const pool = courseId ? professorsForCourse(courseId) : DB.professors;
  return pool
    .map(p => ({ prof: p, ...computeCompatibility(p, student) }))
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, topN);
}
