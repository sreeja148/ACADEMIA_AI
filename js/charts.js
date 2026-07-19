/* ============================================================
   ACADEMIA — Charts
   Thin wrappers around Chart.js, themed to the design tokens.
   ============================================================ */

const chartRegistry = {};

function themeColor(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function destroyChart(id) {
  if (chartRegistry[id]) { chartRegistry[id].destroy(); delete chartRegistry[id]; }
}

function baseChartOptions(extra = {}) {
  const grid = themeColor('--surface-border');
  const text = themeColor('--text-3');
  return Object.assign({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: text, font: { family: 'Inter', size: 11 } } },
      y: { grid: { color: grid }, ticks: { color: text, font: { family: 'Inter', size: 11 } } },
    },
  }, extra);
}

function renderGpaTrendChart(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Fall 24', 'Spr 25', 'Fall 25', 'Spr 26', 'Fall 26'],
      datasets: [{
        data: [3.4, 3.55, 3.6, 3.68, 3.72],
        borderColor: themeColor('--gold-500'),
        backgroundColor: (c) => {
          const g = c.chart.ctx.createLinearGradient(0, 0, 0, 200);
          g.addColorStop(0, 'rgba(201,162,39,0.35)');
          g.addColorStop(1, 'rgba(201,162,39,0)');
          return g;
        },
        fill: true, tension: 0.4, borderWidth: 3, pointRadius: 4,
        pointBackgroundColor: themeColor('--gold-500'),
      }],
    },
    options: baseChartOptions({ scales: { x: baseChartOptions().scales.x, y: Object.assign(baseChartOptions().scales.y, { min: 3, max: 4 }) } }),
  });
}

function renderDeptRatingsChart(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const labels = DB.departments.map(d => d.name.split(' ')[0]);
  const data = DB.departments.map(d => {
    const profs = DB.professors.filter(p => p.dept === d.id);
    const avg = profs.reduce((a, p) => a + avgRating(p.id), 0) / (profs.length || 1);
    return +avg.toFixed(2);
  });
  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: themeColor('--gold-500'), borderRadius: 8, maxBarThickness: 42 }] },
    options: baseChartOptions({ scales: { x: baseChartOptions().scales.x, y: Object.assign(baseChartOptions().scales.y, { min: 0, max: 5 }) } }),
  });
}

function renderEnrollmentChart(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'],
      datasets: [
        { label: 'CS', data: [120, 134, 150, 162, 171, 180], borderColor: themeColor('--gold-500'), tension: .4, borderWidth: 3, pointRadius: 0 },
        { label: 'EE', data: [60, 62, 65, 70, 74, 76], borderColor: themeColor('--info-500'), tension: .4, borderWidth: 3, pointRadius: 0 },
        { label: 'MA', data: [80, 85, 88, 90, 95, 98], borderColor: themeColor('--ok-500'), tension: .4, borderWidth: 3, pointRadius: 0 },
      ],
    },
    options: baseChartOptions({ plugins: { legend: { display: true, position: 'bottom', labels: { color: themeColor('--text-2'), boxWidth: 10, font: { family: 'Inter', size: 11 } } } } }),
  });
}

function renderPopularCoursesChart(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const sorted = [...DB.courses].sort((a, b) => b.enrolled - a.enrolled).slice(0, 5);
  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(c => c.code),
      datasets: [{ data: sorted.map(c => c.enrolled), backgroundColor: themeColor('--navy-500'), borderRadius: 8 }],
    },
    options: Object.assign(baseChartOptions(), { indexAxis: 'y' }),
  });
}

function renderSuccessRateChart(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pass', 'Withdraw', 'Fail'],
      datasets: [{ data: [82, 12, 6], backgroundColor: [themeColor('--ok-500'), themeColor('--warn-500'), themeColor('--danger-500')], borderWidth: 0 }],
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: themeColor('--text-2'), boxWidth: 10, font: { family: 'Inter', size: 11 } } } } },
  });
}

function renderProfTraitRadar(canvasId, prof) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const t = prof.traits;
  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Teaching', 'Grading', 'Knowledge', 'Friendliness', 'Responsiveness', 'Lab Quality'],
      datasets: [{
        data: [t.teaching, t.grading, t.knowledge, t.friendliness, t.responsiveness, t.labQuality],
        backgroundColor: 'rgba(201,162,39,0.22)', borderColor: themeColor('--gold-500'), borderWidth: 2,
        pointBackgroundColor: themeColor('--gold-500'), pointRadius: 3,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { r: { min: 0, max: 5, grid: { color: themeColor('--surface-border') }, angleLines: { color: themeColor('--surface-border') }, pointLabels: { color: themeColor('--text-2'), font: { size: 10.5, family: 'Inter' } }, ticks: { display: false } } },
    },
  });
}
