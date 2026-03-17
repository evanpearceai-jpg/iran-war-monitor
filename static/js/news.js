/* ============================================================
   news.js — News feed with source filtering
   ============================================================ */

let _allArticles = [];
let _activeSource = 'all';

// ---- Render news cards ----
function renderNews() {
  const list = document.getElementById('newsList');
  const emptyEl = document.getElementById('newsEmpty');

  const filtered = _activeSource === 'all'
    ? _allArticles
    : _allArticles.filter(a => a.source_id === _activeSource);

  if (!filtered.length) {
    list.innerHTML = '';
    emptyEl.classList.remove('d-none');
    return;
  }

  emptyEl.classList.add('d-none');

  list.innerHTML = filtered.map(a => {
    const timeStr = formatDate(a.published);
    const tierChip = `<span class="tier-chip ${escHtml(a.tier)}">${escHtml(a.tier_label)}</span>`;
    const pinnedClass = a.pinned ? ' news-card-pinned' : '';

    return `
      <div class="news-card${pinnedClass}">
        <div class="news-card-header">
          <span class="news-source-name">${escHtml(a.source_name)}</span>
          ${tierChip}
          ${a.pinned ? '<span class="pin-badge">📌 LIVE FEED</span>' : ''}
          <span class="news-time">${timeStr}</span>
        </div>
        <div class="news-title">
          ${a.link
            ? `<a href="${escHtml(a.link)}" target="_blank" rel="noopener">${escHtml(a.title)}</a>`
            : escHtml(a.title)}
        </div>
        ${a.summary ? `<div class="news-snippet">${escHtml(a.summary)}</div>` : ''}
        ${a.link ? `<a href="${escHtml(a.link)}" target="_blank" rel="noopener" class="news-read-more">→ Open live feed</a>` : ''}
      </div>`;
  }).join('');
}

// ---- Load news from API ----
async function loadNews() {
  const btn = document.getElementById('btnRefreshNews');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-small"></span> Loading…';
  document.getElementById('newsList').innerHTML = '<div class="text-center text-muted py-5">Fetching feeds…</div>';

  try {
    const data = await fetch('/api/news').then(r => r.json());
    _allArticles = data.articles || [];
    renderNews();

    const now = new Date().toUTCString().replace(' GMT', ' UTC');
    document.getElementById('newsUpdatedAt').textContent =
      `Updated: ${now} · ${_allArticles.length} articles`;

  } catch (err) {
    console.error('News load error:', err);
    document.getElementById('newsList').innerHTML =
      `<div class="alert-monitor">Failed to load news: ${escHtml(err.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>REFRESH FEED';
  }
}

// ---- Source filter pill clicks ----
document.querySelectorAll('#sourceFilters .pill').forEach(pill => {
  pill.addEventListener('click', function () {
    document.querySelectorAll('#sourceFilters .pill').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    _activeSource = this.dataset.source;
    renderNews();
  });
});

document.getElementById('btnRefreshNews').addEventListener('click', () => {
  window._newsLoaded = false;
  loadNews();
  window._newsLoaded = true;
});

// ---- Helpers ----
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = n => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ` +
           `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
  } catch {
    return dateStr;
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
