/* ============================================================
   strikes.js — Strike Analytics tab
   Data source: ISW-CTP Iran Update Evening Special Report
   ============================================================ */

let _strikesChart = null;
let _interceptChart = null;

// ---- Render stat cards ----
function renderStatCards(data) {
  const deg = data.degradation || {};

  const launchers = deg.missile_launchers_destroyed_pct;
  document.getElementById('statLaunchers').textContent =
    launchers != null ? launchers + '%' : '—';

  const cas = deg.irgc_casualties_est;
  document.getElementById('statCasualties').textContent =
    cas != null ? '~' + cas.toLocaleString() : '—';

  const struck = deg.tehran_lec_stations_struck;
  const total  = deg.tehran_lec_stations_total;
  document.getElementById('statLec').textContent =
    (struck != null && total != null) ? struck + '/' + total : '—';

  const warStart = new Date(data.war_start || '2026-02-28');
  const now = new Date();
  const days = Math.floor((now - warStart) / 86400000) + 1;
  document.getElementById('statDaysOfWar').textContent = days > 0 ? days : '—';

  const hormuz = deg.hormuz_incidents_since_mar1;
  document.getElementById('statHormuz').textContent =
    hormuz != null ? hormuz : '—';
}

// ---- Render multi-line daily trends chart ----
function renderStrikesChart(daily) {
  const ctx = document.getElementById('strikesChart').getContext('2d');
  if (_strikesChart) { _strikesChart.destroy(); }

  const labels = daily.map(d => {
    const dt = new Date(d.date + 'T00:00:00Z');
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dt.getUTCDate()).padStart(2, '0');
    return m + '/' + day;
  });

  const commonOpts = { tension: 0.3, spanGaps: false, pointRadius: 3, borderWidth: 2 };
  const tooltipOpts = {
    backgroundColor: '#161b27',
    borderColor: '#1e2840',
    borderWidth: 1,
    titleColor: '#c8d4e8',
    bodyColor: '#5a6a84',
  };
  const scaleOpts = {
    x: { ticks: { color: '#5a6a84', font: { family: 'Courier New', size: 11 } }, grid: { color: '#1e2840' } },
    y: { ticks: { color: '#5a6a84', font: { family: 'Courier New', size: 11 } }, grid: { color: '#1e2840' }, beginAtZero: true },
  };

  _strikesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'US/Israel \u2192 Iran',
          data: daily.map(d => d.us_israel_on_iran),
          borderColor: '#3182ce',
          backgroundColor: 'rgba(49,130,206,0.08)',
          ...commonOpts,
        },
        {
          label: 'Iran \u2192 Israel',
          data: daily.map(d => d.iran_on_israel),
          borderColor: '#e53e3e',
          backgroundColor: 'rgba(229,62,62,0.08)',
          ...commonOpts,
        },
        {
          label: 'Iran \u2192 Gulf states',
          data: daily.map(d => d.iran_on_gulf),
          borderColor: '#dd6b20',
          backgroundColor: 'rgba(221,107,32,0.08)',
          ...commonOpts,
        },
        {
          label: 'Hezbollah \u2192 Israel',
          data: daily.map(d => d.hezbollah_on_israel),
          borderColor: '#805ad5',
          backgroundColor: 'rgba(128,90,213,0.08)',
          ...commonOpts,
        },
        {
          label: 'Iraqi militia \u2192 US/Gulf',
          data: daily.map(d => d.iraqi_militia_on_us),
          borderColor: '#38a169',
          backgroundColor: 'rgba(56,161,105,0.08)',
          ...commonOpts,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#c8d4e8', font: { family: 'Courier New', size: 10 }, boxWidth: 12, padding: 12 },
        },
        tooltip: tooltipOpts,
      },
      scales: scaleOpts,
    },
  });
}

// ---- Render stacked bar Gulf intercepts chart ----
function renderInterceptChart(gulf) {
  const ctx = document.getElementById('interceptChart').getContext('2d');
  if (_interceptChart) { _interceptChart.destroy(); }

  const labels = Object.keys(gulf);
  const drones   = labels.map(k => gulf[k].drones);
  const missiles = labels.map(k => gulf[k].missiles);

  const tooltipOpts = {
    backgroundColor: '#161b27',
    borderColor: '#1e2840',
    borderWidth: 1,
    titleColor: '#c8d4e8',
    bodyColor: '#5a6a84',
  };

  _interceptChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Drones intercepted',
          data: drones,
          backgroundColor: 'rgba(221,107,32,0.7)',
          borderColor: 'rgba(221,107,32,0.9)',
          borderWidth: 1,
        },
        {
          label: 'Missiles intercepted',
          data: missiles,
          backgroundColor: 'rgba(229,62,62,0.7)',
          borderColor: 'rgba(229,62,62,0.9)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#c8d4e8', font: { family: 'Courier New', size: 10 }, boxWidth: 12, padding: 12 },
        },
        tooltip: tooltipOpts,
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: '#5a6a84', font: { family: 'Courier New', size: 11 } },
          grid: { color: '#1e2840' },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { color: '#5a6a84', font: { family: 'Courier New', size: 11 } },
          grid: { color: '#1e2840' },
        },
      },
    },
  });
}

// ---- Render confirmed strike events list ----
function renderStrikeEvents(events) {
  const list = document.getElementById('strikeEventList');
  const countBadge = document.getElementById('strikeEventCount');
  countBadge.textContent = events.length;

  if (!events.length) {
    list.innerHTML = '<div class="dev-placeholder text-center py-4 text-muted">No confirmed events.</div>';
    return;
  }

  // Sort newest first
  const sorted = [...events].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  list.innerHTML = sorted.map(ev => {
    const dateStr = ev.date ? ev.date : '';
    const actor   = ev.actor   ? escHtml(ev.actor)   : '';
    const target  = ev.target  ? escHtml(ev.target)  : '';
    const type    = ev.type    ? escHtml(ev.type)     : '';
    const outcome = ev.outcome ? escHtml(ev.outcome)  : '';
    const notes   = ev.notes   ? escHtml(ev.notes)    : '';
    return `
      <div class="dev-item">
        <div class="dev-title">${actor} &rarr; ${target}</div>
        <div class="dev-meta">${escHtml(dateStr)} &nbsp;&bull;&nbsp; ${type} &nbsp;&bull;&nbsp; ${outcome}</div>
        ${notes ? `<div class="dev-meta" style="margin-top:2px;font-style:italic;">${notes}</div>` : ''}
      </div>`;
  }).join('');
}

// ---- Main load function ----
async function loadStrikes() {
  const btn = document.getElementById('btnRefreshStrikes');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-small"></span> Loading\u2026';

  try {
    const data = await fetch('/api/strikes').then(r => r.json());

    renderStatCards(data);

    if (data.daily && data.daily.length) {
      renderStrikesChart(data.daily);
    }

    if (data.gulf_intercepts_mar16) {
      renderInterceptChart(data.gulf_intercepts_mar16);
    }

    renderStrikeEvents(data.events || []);

    const src = data.last_updated ? ' · Source: ISW · Last report: ' + data.last_updated : '';
    const now = new Date().toUTCString().replace(' GMT', ' UTC');
    document.getElementById('strikesUpdatedAt').textContent = 'Updated: ' + now + src;

  } catch (err) {
    console.error('Strikes load error:', err);
    document.getElementById('strikeEventList').innerHTML =
      `<div class="alert-monitor m-3">Failed to load strike data: ${escHtml(err.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>REFRESH';
  }
}

document.getElementById('btnRefreshStrikes').addEventListener('click', loadStrikes);

// escHtml is defined in analysis.js (loaded before strikes.js)
