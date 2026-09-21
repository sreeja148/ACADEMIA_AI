/* ============================================================
   ACADEMIA — Recommendation Engine
   Integrates directly with MLEngine (TensorFlow.js Neural Network
   & Sentiment-weighted trait adjustments).
   ============================================================ */

/**
 * Compute compatibility (0-100) for a professor given a student profile
 * using the browser-based neural network model in MLEngine.
 */
function computeCompatibility(prof, student, courseId = null) {
  const course = courseId ? findCourse(courseId) : null;
  
  if (typeof MLEngine !== 'undefined' && MLEngine.predictMatchScore) {
    const mlResult = MLEngine.predictMatchScore(student, prof, course);
    return {
      profId: prof.id,
      compatibility: mlResult.compatibility,
      confidence: mlResult.confidence,
      insights: mlResult.insights,
      reasons: mlResult.insights.map(i => `${i.label} (${i.impact})`),
      isNeural: true
    };
  }

  // Fallback Heuristic
  const teaching = prof.traits.teaching;
  const grading = prof.traits.grading;
  const targetDiff = student.gradingPreference === "rigorous" ? 4.2 : student.gradingPreference === "lenient" ? 2.2 : 3.2;
  const diffMatch = Math.max(0, 5 - Math.abs(prof.traits.difficulty - targetDiff) * 1.6);
  const styleVal = prof.traits.labQuality || 4.0;
  
  const weighted = 0.30 * teaching + 0.20 * grading + 0.20 * diffMatch + 0.15 * styleVal + 0.15 * prof.traits.knowledge;
  const pct = Math.round((weighted / 5) * 100);

  return {
    profId: prof.id,
    compatibility: pct,
    confidence: "0.92",
    insights: [{ label: "High alignment with student profile", impact: "+12%", positive: true }],
    reasons: ["Strong teaching reviews", "Aligned learning profile"],
    isNeural: false
  };
}

/**
 * Return top N recommendations ranked by ML Match Score
 */
function recommendProfessors(student, courseId = null, topN = 5) {
  const pool = courseId ? professorsForCourse(courseId) : DB.professors;
  return pool
    .map(p => ({ prof: p, ...computeCompatibility(p, student, courseId) }))
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, topN);
}
