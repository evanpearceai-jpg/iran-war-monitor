# Iran War Monitor

A real-time conflict monitoring dashboard for the Iran-Israel war (began 28 Feb 2026). Aggregates open-source intelligence from NASA FIRMS, GDELT, OpenSky Network, ISW reports, and multiple RSS feeds into a single dark-themed interface.

![Dashboard](https://img.shields.io/badge/status-active-brightgreen) ![Python](https://img.shields.io/badge/python-3.8+-blue) ![Flask](https://img.shields.io/badge/flask-3.x-lightgrey)

---

## Tabs

| Tab | Data Source | Description |
|-----|-------------|-------------|
| **MAP** | NASA FIRMS · OpenSky · ISW assets | Leaflet map with military assets, thermal anomalies, live aircraft |
| **ANALYSIS** | GDELT Doc API | Threat level indicator, recent developments, FIRMS hotspot cross-reference |
| **NEWS FEED** | IRNA · Iran Intl · ISW · Al Jazeera · CSIS · CENTCOM · UKMTO | Aggregated RSS with source filter pills |
| **STRIKES** | ISW Evening Special Report (curated) | Daily strike trends, Gulf state intercepts, degradation stats, confirmed event log |

---

## Setup

```bash
git clone https://github.com/evanpearceai-jpg/iran-war-monitor.git
cd iran-war-monitor
pip install -r requirements.txt
cp .env.example .env
python app.py
```

Open **http://localhost:5000**

### NASA FIRMS API Key (optional)

The thermal anomalies layer requires a free NASA FIRMS key. Without it the layer shows a placeholder.

1. Register at https://firms.modaps.eosdis.nasa.gov/api/area/
2. Add to `.env`: `FIRMS_API_KEY=your_key_here`

---

## Architecture

```
app.py                  Flask backend — all API routes, 5-min in-memory cache
templates/index.html    Single-page Bootstrap 5 dashboard
static/css/style.css    Dark monitoring theme (Courier New monospace)
static/js/
  map.js                Leaflet map, layer groups, MarkerCluster
  analysis.js           GDELT threat level, hotspot cross-reference, Chart.js
  news.js               RSS feed aggregation, source filter pills
  strikes.js            Strike trend lines, Gulf intercept chart, event list
data/
  assets.geojson        35 curated regional military/strategic/energy locations
  strikes.json          ISW-curated daily strike data (update manually each day)
```

All external API calls are proxied through Flask to avoid CORS issues. Each route is cached for 5 minutes.

---

## Updating Strike Data

`data/strikes.json` is updated manually as new ISW Evening Special Reports are published. Add a new entry to the `daily` array and update `last_updated`. Use `null` for any actor/day combination without confirmed reporting.

```json
{ "date": "2026-03-17", "us_israel_on_iran": 12, "iran_on_israel": 4, "iran_on_gulf": null, "hezbollah_on_israel": 19, "iraqi_militia_on_us": 22 }
```

---

## Data Sources

| Source | Type | URL |
|--------|------|-----|
| NASA FIRMS | Thermal anomalies (VIIRS) | https://firms.modaps.eosdis.nasa.gov |
| GDELT Project | Media event analysis | https://gdeltproject.org |
| OpenSky Network | Live aircraft ADS-B | https://opensky-network.org |
| ISW / CTP | Daily conflict reports | https://understandingwar.org |
| Iran International | News RSS | https://iranintl.com |
| IRNA English | News RSS | https://en.irna.ir |
| Al Jazeera | News RSS | https://aljazeera.com |
| CSIS | Analysis RSS | https://csis.org |
| CENTCOM | Official press releases | https://centcom.mil |
| UKMTO | Maritime incidents | https://ukmto.org |

---

## Requirements

- Python 3.8+
- Flask, requests, feedparser, python-dotenv (see `requirements.txt`)
- No database — all data is fetched live or served from local JSON/GeoJSON files
