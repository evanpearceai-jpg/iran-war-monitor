/* ============================================================
   map.js — Leaflet interactive map
   ============================================================ */

let _map = null;
let _layerGroups = {};
let _pipelineLayer = null;   // L.LayerGroup for pipeline polylines
let _mapData = { assets: null, firms: null, opensky: null };

// Pipeline style by subtype
const PIPELINE_STYLES = {
  oil:          { color: '#f6ad55', weight: 3, opacity: 0.85, dashArray: null },
  gas:          { color: '#63b3ed', weight: 2.5, opacity: 0.85, dashArray: null },
  oil_historical: { color: '#718096', weight: 2, opacity: 0.5, dashArray: '6 4' },
};

function pipelineStyle(subtype) {
  return PIPELINE_STYLES[subtype] || PIPELINE_STYLES.oil;
}

// ---- Icon definitions ----
const ICON_DEFS = {
  military:    { symbol: '⚔', color: '#e53e3e' },
  strategic:   { symbol: '☢', color: '#805ad5' },
  energy:      { symbol: '⬡', color: '#d69e2e' },
  maritime:    { symbol: '⚓', color: '#3182ce' },
  lifesupport: { symbol: '✚', color: '#38a169' },
  damage:      { symbol: '✕', color: '#718096' },
  firms:       { symbol: '🔥', color: '#dd6b20' },
  opensky:     { symbol: '✈', color: '#e2e8f0' },
};

function makeIcon(type) {
  const def = ICON_DEFS[type] || ICON_DEFS.military;
  return L.divIcon({
    className: '',
    html: `<span class="map-icon" style="color:${def.color}; font-size:1.2rem; text-shadow:0 0 6px rgba(0,0,0,0.9)">${def.symbol}</span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

function makePopup(props) {
  const p = props || {};
  let html = `<div class="popup-name">${p.name || 'Unknown'}</div>`;
  if (p.country) html += `<div class="popup-row"><span class="popup-label">Country</span><span class="popup-val">${p.country}</span></div>`;
  if (p.subtype) html += `<div class="popup-row"><span class="popup-label">Subtype</span><span class="popup-val">${p.subtype}</span></div>`;
  if (p.status)  html += `<div class="popup-row"><span class="popup-label">Status</span><span class="popup-val">${p.status}</span></div>`;
  if (p.last_updated) html += `<div class="popup-row"><span class="popup-label">Updated</span><span class="popup-val">${p.last_updated}</span></div>`;
  if (p.notes)   html += `<div class="popup-notes">${p.notes}</div>`;
  return html;
}

// ---- Init map ----
function initMap() {
  if (_map) return;

  _map = L.map('map', {
    center: [28, 55],
    zoom: 5,
    zoomControl: true,
    preferCanvas: true,
  });

  // Dark tile layer (CartoDB Dark)
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }
  ).addTo(_map);

  // Pipeline layer group (plain LayerGroup — lines don't cluster)
  _pipelineLayer = L.layerGroup().addTo(_map);

  // Create marker cluster layer groups
  const types = ['military', 'strategic', 'energy', 'maritime', 'lifesupport', 'damage', 'firms', 'opensky'];
  types.forEach(t => {
    _layerGroups[t] = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      iconCreateFunction: (cluster) => {
        const def = ICON_DEFS[t] || ICON_DEFS.military;
        return L.divIcon({
          className: '',
          html: `<div style="background:${def.color}22;border:1px solid ${def.color};border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:${def.color};font-weight:700">${cluster.getChildCount()}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
      },
    });
    _layerGroups[t].addTo(_map);
  });

  // ---- Legend control ----
  const Legend = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd() {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <div class="legend-title">LEGEND</div>
        <div class="legend-section">MARKERS</div>
        <div class="legend-row"><span class="legend-sym" style="color:#e53e3e">⚔</span> Military asset</div>
        <div class="legend-row"><span class="legend-sym" style="color:#805ad5">☢</span> Nuclear / strategic</div>
        <div class="legend-row"><span class="legend-sym" style="color:#d69e2e">⬡</span> Energy infrastructure</div>
        <div class="legend-row"><span class="legend-sym" style="color:#3182ce">⚓</span> Port / chokepoint</div>
        <div class="legend-row"><span class="legend-sym" style="color:#38a169">✚</span> Life support</div>
        <div class="legend-row"><span class="legend-sym" style="color:#718096">✕</span> Damage / strike</div>
        <div class="legend-row"><span class="legend-sym" style="color:#dd6b20">🔥</span> Thermal anomaly</div>
        <div class="legend-row"><span class="legend-sym" style="color:#e2e8f0">✈</span> Live aircraft</div>
        <div class="legend-section" style="margin-top:6px">PIPELINES</div>
        <div class="legend-row"><span class="legend-line" style="background:#f6ad55"></span> Oil pipeline (active)</div>
        <div class="legend-row"><span class="legend-line" style="background:#63b3ed"></span> Gas pipeline (active)</div>
        <div class="legend-row"><span class="legend-line legend-dashed" style="border-color:#718096"></span> Historical / defunct</div>
      `;
      L.DomEvent.disableClickPropagation(div);
      return div;
    }
  });
  new Legend().addTo(_map);

  // Layer toggle checkboxes
  document.querySelectorAll('#layerControls input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', function () {
      const type = this.id.replace('lyr-', '');
      if (type === 'pipeline') {
        this.checked ? _map.addLayer(_pipelineLayer) : _map.removeLayer(_pipelineLayer);
      } else {
        _layerGroups[type] && (this.checked ? _map.addLayer(_layerGroups[type]) : _map.removeLayer(_layerGroups[type]));
      }
    });
  });
}

// ---- Populate asset markers + pipeline lines ----
function renderAssets(geojson) {
  ['military', 'strategic', 'energy', 'maritime', 'lifesupport', 'damage'].forEach(t => {
    _layerGroups[t] && _layerGroups[t].clearLayers();
  });
  _pipelineLayer && _pipelineLayer.clearLayers();

  if (!geojson || !geojson.features) return;

  let pointCount = 0, pipelineCount = 0;

  geojson.features.forEach(feature => {
    const props = feature.properties || {};
    const type = props.type || 'military';
    const geomType = feature.geometry && feature.geometry.type;
    const coords = feature.geometry && feature.geometry.coordinates;
    if (!coords) return;

    // ---- Pipeline LineStrings ----
    if (type === 'pipeline' && geomType === 'LineString') {
      const style = pipelineStyle(props.subtype);
      const latlngs = coords.map(c => [c[1], c[0]]);
      const line = L.polyline(latlngs, {
        color: style.color,
        weight: style.weight,
        opacity: style.opacity,
        dashArray: style.dashArray,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Popup
      let popHtml = `<div class="popup-name">🛢 ${props.name}</div>`;
      if (props.country)   popHtml += `<div class="popup-row"><span class="popup-label">Route</span><span class="popup-val">${props.country}</span></div>`;
      if (props.capacity)  popHtml += `<div class="popup-row"><span class="popup-label">Capacity</span><span class="popup-val">${props.capacity}</span></div>`;
      if (props.length_km) popHtml += `<div class="popup-row"><span class="popup-label">Length</span><span class="popup-val">${props.length_km} km</span></div>`;
      if (props.status)    popHtml += `<div class="popup-row"><span class="popup-label">Status</span><span class="popup-val">${props.status}</span></div>`;
      if (props.notes)     popHtml += `<div class="popup-notes">${props.notes}</div>`;
      line.bindPopup(popHtml, { maxWidth: 320 });

      // Highlight on hover
      line.on('mouseover', function () { this.setStyle({ weight: style.weight + 2, opacity: 1 }); });
      line.on('mouseout',  function () { this.setStyle({ weight: style.weight, opacity: style.opacity }); });

      _pipelineLayer.addLayer(line);
      pipelineCount++;
      return;
    }

    // ---- Point markers ----
    const group = _layerGroups[type];
    if (!group) return;

    let marker;
    if (geomType === 'Point') {
      marker = L.marker([coords[1], coords[0]], { icon: makeIcon(type) });
    } else {
      // Fallback: use midpoint of line as marker
      const mid = coords[Math.floor(coords.length / 2)];
      if (!mid) return;
      marker = L.marker([mid[1], mid[0]], { icon: makeIcon(type) });
    }
    marker.bindPopup(makePopup(props));
    group.addLayer(marker);
    pointCount++;
  });

  document.getElementById('statusAssets').textContent = `${pointCount} assets · ${pipelineCount} pipelines`;
}

// ---- Populate FIRMS thermal anomalies ----
function renderFirms(data) {
  _layerGroups.firms && _layerGroups.firms.clearLayers();
  const features = (data && data.features) || [];

  if (data && data.error) {
    document.getElementById('statusFirms').textContent = 'No API key';
    return;
  }

  features.forEach(f => {
    if (f.lat == null || f.lon == null) return;
    const marker = L.marker([f.lat, f.lon], { icon: makeIcon('firms') });
    let popHtml = `<div class="popup-name">Thermal Anomaly</div>`;
    popHtml += `<div class="popup-row"><span class="popup-label">Coords</span><span class="popup-val">${f.lat.toFixed(3)}, ${f.lon.toFixed(3)}</span></div>`;
    if (f.brightness) popHtml += `<div class="popup-row"><span class="popup-label">Brightness</span><span class="popup-val">${f.brightness}K</span></div>`;
    if (f.confidence) popHtml += `<div class="popup-row"><span class="popup-label">Confidence</span><span class="popup-val">${f.confidence}</span></div>`;
    if (f.acq_date)   popHtml += `<div class="popup-row"><span class="popup-label">Date</span><span class="popup-val">${f.acq_date} ${f.acq_time || ''}</span></div>`;
    if (f.satellite)  popHtml += `<div class="popup-row"><span class="popup-label">Satellite</span><span class="popup-val">${f.satellite}</span></div>`;
    marker.bindPopup(popHtml);
    _layerGroups.firms.addLayer(marker);
  });

  document.getElementById('statusFirms').textContent = `${features.length} detections`;
}

// ---- Populate OpenSky aircraft ----
function renderOpenSky(data) {
  _layerGroups.opensky && _layerGroups.opensky.clearLayers();
  const aircraft = (data && data.aircraft) || [];

  if (data && data.error) {
    document.getElementById('statusOpensky').textContent = 'Fetch error';
    return;
  }

  aircraft.forEach(ac => {
    if (ac.on_ground) return; // skip ground traffic
    const marker = L.marker([ac.lat, ac.lon], { icon: makeIcon('opensky') });

    let popHtml = `<div class="popup-name">✈ ${ac.callsign || ac.icao24 || 'Unknown'}</div>`;
    if (ac.country)   popHtml += `<div class="popup-row"><span class="popup-label">Country</span><span class="popup-val">${ac.country}</span></div>`;
    if (ac.altitude != null) popHtml += `<div class="popup-row"><span class="popup-label">Altitude</span><span class="popup-val">${Math.round(ac.altitude)}m</span></div>`;
    if (ac.velocity != null) popHtml += `<div class="popup-row"><span class="popup-label">Speed</span><span class="popup-val">${Math.round(ac.velocity)} m/s</span></div>`;
    if (ac.heading != null)  popHtml += `<div class="popup-row"><span class="popup-label">Heading</span><span class="popup-val">${Math.round(ac.heading)}°</span></div>`;

    marker.bindPopup(popHtml);
    _layerGroups.opensky.addLayer(marker);
  });

  document.getElementById('statusOpensky').textContent = `${aircraft.length} aircraft`;
}

// ---- Load all map data ----
async function loadMapData() {
  const btn = document.getElementById('btnRefreshMap');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-small"></span> Loading…';

  try {
    const [assetsRes, firmsRes, openskyRes] = await Promise.allSettled([
      fetch('/api/assets').then(r => r.json()),
      fetch('/api/firms').then(r => r.json()),
      fetch('/api/opensky').then(r => r.json()),
    ]);

    if (assetsRes.status === 'fulfilled') {
      _mapData.assets = assetsRes.value;
      renderAssets(assetsRes.value);
    }
    if (firmsRes.status === 'fulfilled') {
      _mapData.firms = firmsRes.value;
      renderFirms(firmsRes.value);
    }
    if (openskyRes.status === 'fulfilled') {
      _mapData.opensky = openskyRes.value;
      renderOpenSky(openskyRes.value);
    }

    const now = new Date().toUTCString().replace(' GMT', ' UTC');
    document.getElementById('mapUpdatedAt').textContent = 'Updated: ' + now;

    // Expose firms/assets for analysis tab cross-reference
    window._firmsData = _mapData.firms;
    window._assetsData = _mapData.assets;

  } catch (err) {
    console.error('Map data load error:', err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>REFRESH MAP DATA';
  }
}

document.getElementById('btnRefreshMap').addEventListener('click', loadMapData);
