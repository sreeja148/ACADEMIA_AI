/* ============================================================
   ACADEMIA — Charts
   Themed to the vibrant Electric Indigo & Cyan palette.
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
      x: { grid: { display: false }, ticks: { color: text, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } } },
      y: { grid: { color: grid }, ticks: { color: text, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } } },
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
      labels: ['Fall 24', 'Spr 25', 'Fall 25', 'Spr 26', 'Fall 26', 'Spr 27 (ML Est.)'],
      datasets: [
        {
          label: 'Historical GPA',
          data: [3.4, 3.55, 3.6, 3.68, 3.72, null],
          borderColor: '#6366f1',
          backgroundColor: (c) => {
            const g = c.chart.ctx.createLinearGradient(0, 0, 0, 200);
            g.addColorStop(0, 'rgba(99,102,241,0.35)');
            g.addColorStop(1, 'rgba(99,102,241,0)');
            return g;
          },
          fill: true, tension: 0.35, borderWidth: 3, pointRadius: 5,
          pointBackgroundColor: '#6366f1',
        },
        {
          label: 'Neural Projection',
          data: [null, null, null, null, 3.72, 3.78],
          borderColor: '#06b6d4',
          borderDash: [5, 5],
          tension: 0.35, borderWidth: 3, pointRadius: 5,
          pointBackgroundColor: '#06b6d4',
        }
      ],
    },
    options: baseChartOptions({
      scales: {
        x: baseChartOptions().scales.x,
        y: Object.assign(baseChartOptions().scales.y, { min: 3.0, max: 4.0 })
      }
    }),
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
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
        borderRadius: 8,
        maxBarThickness: 38
      }]
    },
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
        { label: 'CS', data: [120, 134, 150, 162, 171, 180], borderColor: '#6366f1', tension: .4, borderWidth: 3, pointRadius: 2 },
        { label: 'EE', data: [60, 62, 65, 70, 74, 76], borderColor: '#06b6d4', tension: .4, borderWidth: 3, pointRadius: 2 },
        { label: 'MA', data: [80, 85, 88, 90, 95, 98], borderColor: '#10b981', tension: .4, borderWidth: 3, pointRadius: 2 },
      ],
    },
    options: baseChartOptions({ plugins: { legend: { display: true, position: 'bottom', labels: { color: themeColor('--text-2'), boxWidth: 10, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } } } } }),
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
      datasets: [{ data: sorted.map(c => c.enrolled), backgroundColor: '#6366f1', borderRadius: 8 }],
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
      labels: ['Pass (ML Forecast 86%)', 'Withdrawal Risk', 'Remedial Review'],
      datasets: [{ data: [86, 10, 4], backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'], borderWidth: 0 }],
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: themeColor('--text-2'), boxWidth: 10, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } } } } },
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
        backgroundColor: 'rgba(99,102,241,0.22)', borderColor: '#6366f1', borderWidth: 2.5,
        pointBackgroundColor: '#06b6d4', pointRadius: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { r: { min: 0, max: 5, grid: { color: themeColor('--surface-border') }, angleLines: { color: themeColor('--surface-border') }, pointLabels: { color: themeColor('--text-2'), font: { size: 11, family: 'Plus Jakarta Sans', weight: '600' } }, ticks: { display: false } } },
    },
  });
}
