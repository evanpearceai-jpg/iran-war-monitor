/* ============================================================
   analysis.js — GDELT analysis panel + Chart.js
   ============================================================ */

let _trendChart = null;

// ---- Threat level → CSS class ----
function threatClass(level) {
  const map = { HIGH: 'high', ELEVATED: 'elevated', GUARDED: 'guarded', LOW: 'low' };
  return map[level] || '';
}

// ---- Update header threat indicator ----
function updateHeaderThreat(level) {
  const dot = document.getElementById('headerThreatDot');
  const badge = document.getElementById('headerThreatBadge');
  const cls = threatClass(level);
  dot.className = `threat-dot ${cls}`;
  badge.textContent = level || 'UNKNOWN';
  badge.className = 'badge ms-2';
  const colorMap = {
    HIGH: 'bg-danger', ELEVATED: 'bg-warning text-dark',
    GUARDED: 'bg-warning text-dark', LOW: 'bg-success', UNKNOWN: 'bg-secondary',
  };
  badge.classList.add(colorMap[level] || 'bg-secondary');
}

// ---- Render threat banner ----
function renderThreat(gdelt) {
  const banner = document.getElementById('threatBanner');
  const levelEl = document.getElementById('threatLevelText');
  const detailEl = document.getElementById('threatDetail');

  const level = gdelt.threat_level || 'UNKNOWN';
  const cls = threatClass(level);

  banner.className = `threat-banner ${cls}`;
  levelEl.textContent = level;

  const tone = gdelt.avg_tone;
  if (tone != null) {
    detailEl.textContent =
      `GDELT avg tone: ${tone.toFixed(2)} (${gdelt.total_articles || 0} articles, 48h) — ` +
      (tone < -5 ? 'Highly negative media environment' :
       tone < -2 ? 'Negative media environment' :
       tone < 1  ? 'Neutral-negative media environment' :
                   'Neutral-positive media environment');
  } else {
    detailEl.textContent = gdelt.error || 'GDELT data unavailable';
  }

  updateHeaderThreat(level);
}

// ---- Render recent developments ----
function renderDevelopments(events) {
  const list = document.getElementById('devList');
  const countBadge = document.getElementById('devCount');
  countBadge.textContent = events.length;

  if (!events.length) {
    list.innerHTML = '<div class="dev-placeholder text-center py-4">No events returned from GDELT.</div>';
    return;
  }

  list.innerHTML = events.map(ev => {
    const dateStr = ev.date
      ? ev.date.toString().replace(/(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})?.*/, '$2/$3 $4:$5 UTC')
      : '';
    const domain = ev.domain || '';
    const toneStr = ev.tone != null ? ` · Tone: ${ev.tone.toFixed(1)}` : '';
    return `
      <div class="dev-item">
        <div class="dev-title">
          ${ev.url
            ? `<a href="${escHtml(ev.url)}" target="_blank" rel="noopener">${escHtml(ev.title || 'Untitled')}</a>`
            : escHtml(ev.title || 'Untitled')}
        </div>
        <div class="dev-meta">${escHtml(dateStr)} · ${escHtml(domain)}${toneStr}</div>
      </div>`;
  }).join('');
}

// ---- Render hotspots (FIRMS detections near known assets) ----
function renderHotspots() {
  const list = document.getElementById('hotspotList');
  const firms = window._firmsData;
  const assets = window._assetsData;

  if (!firms || firms.error) {
    list.innerHTML = `<div class="dev-placeholder text-center py-4 text-muted">
      FIRMS API key required. <a href="https://firms.modaps.eosdis.nasa.gov/api/area/" target="_blank" rel="noopener" class="news-read-more">Get free key →</a>
    </div>`;
    return;
  }

  const detections = firms.features || [];
  if (!detections.length) {
    list.innerHTML = '<div class="dev-placeholder text-center py-4 text-muted">No thermal anomalies in the region.</div>';
    return;
  }

  if (!assets || !assets.features) {
    list.innerHTML = '<div class="dev-placeholder text-center py-4 text-muted">Asset data not loaded yet.</div>';
    return;
  }

  const RADIUS_KM = 20;
  const results = [];

  assets.features.forEach(feature => {
    const props = feature.properties || {};
    const coords = feature.geometry && feature.geometry.type === 'Point' && feature.geometry.coordinates;
    if (!coords) return;
    const [assetLon, assetLat] = coords;

    let count = 0;
    detections.forEach(d => {
      if (haversineKm(assetLat, assetLon, d.lat, d.lon) <= RADIUS_KM) count++;
    });

    if (count > 0) {
      results.push({ name: props.name, type: props.type, count });
    }
  });

  results.sort((a, b) => b.count - a.count);

  if (!results.length) {
    list.innerHTML = '<div class="dev-placeholder text-center py-4 text-muted">No thermal detections within 20km of known assets.</div>';
    return;
  }

  list.innerHTML = results.map(r =>
    `<div class="hotspot-item">
      <div>
        <div class="hotspot-name">${escHtml(r.name)}</div>
        <div class="dev-meta">${escHtml(r.type)}</div>
      </div>
      <span class="hotspot-count">${r.count} detections</span>
    </div>`
  ).join('');
}

// ---- Render trend chart ----
function renderChart(chartData) {
  const ctx = document.getElementById('trendChart').getContext('2d');
  if (_trendChart) { _trendChart.destroy(); }

  const labels = chartData.labels || [];
  const data = chartData.data || [];

  _trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'GDELT Articles',
        data,
        backgroundColor: 'rgba(0,181,216,0.25)',
        borderColor: 'rgba(0,181,216,0.8)',
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161b27',
          borderColor: '#1e2840',
          borderWidth: 1,
          titleColor: '#c8d4e8',
          bodyColor: '#5a6a84',
        },
      },
      scales: {
        x: {
          ticks: { color: '#5a6a84', font: { family: 'Courier New', size: 11 } },
          grid: { color: '#1e2840' },
        },
        y: {
          ticks: { color: '#5a6a84', font: { family: 'Courier New', size: 11 } },
          grid: { color: '#1e2840' },
          beginAtZero: true,
        },
      },
    },
  });
}

// ---- Main load function ----
async function loadAnalysis() {
  const btn = document.getElementById('btnRefreshAnalysis');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-small"></span> Loading…';

  try {
    const gdelt = await fetch('/api/gdelt').then(r => r.json());
    renderThreat(gdelt);
    renderDevelopments(gdelt.events || []);
    renderChart(gdelt.chart || { labels: [], data: [] });

    // Hotspots depend on FIRMS + assets (may have been loaded by map tab)
    // If not yet loaded, fetch them
    if (!window._firmsData || !window._assetsData) {
      const [firmsRes, assetsRes] = await Promise.allSettled([
        fetch('/api/firms').then(r => r.json()),
        fetch('/api/assets').then(r => r.json()),
      ]);
      if (firmsRes.status === 'fulfilled')  window._firmsData  = firmsRes.value;
      if (assetsRes.status === 'fulfilled') window._assetsData = assetsRes.value;
    }
    renderHotspots();

    const now = new Date().toUTCString().replace(' GMT', ' UTC');
    document.getElementById('analysisUpdatedAt').textContent = 'Updated: ' + now;

  } catch (err) {
    console.error('Analysis load error:', err);
    document.getElementById('threatDetail').textContent = 'Failed to load GDELT data: ' + err.message;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>REFRESH';
  }
}

document.getElementById('btnRefreshAnalysis').addEventListener('click', () => {
  window._analysisLoaded = false;
  loadAnalysis();
  window._analysisLoaded = true;
});

// ---- Helpers ----
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
