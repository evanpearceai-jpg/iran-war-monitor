import os
import time
import json
import logging
from datetime import datetime, timezone

import feedparser
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Simple in-memory cache
# ---------------------------------------------------------------------------
_cache: dict = {}
CACHE_TTL = 300  # 5 minutes


def cache_get(key: str):
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < entry.get("ttl", CACHE_TTL):
        return entry["data"]
    return None


def cache_set(key: str, data, ttl: int = CACHE_TTL):
    _cache[key] = {"ts": time.time(), "data": data, "ttl": ttl}


# ---------------------------------------------------------------------------
# RSS feed sources
# ---------------------------------------------------------------------------
RSS_SOURCES = [
    {
        "id": "irna",
        "name": "IRNA English",
        "url": "https://en.irna.ir/rss",
        "tier": "regional",
        "tier_label": "Regional",
    },
    {
        "id": "iranintl",
        "name": "Iran International",
        "url": "https://www.iranintl.com/en/rss",
        "tier": "tier1",
        "tier_label": "Tier-1",
    },
    {
        "id": "isw",
        "name": "ISW",
        "url": "https://www.understandingwar.org/rss.xml",
        "tier": "analysis",
        "tier_label": "Analysis",
    },
    {
        "id": "aljazeera",
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "tier": "tier1",
        "tier_label": "Tier-1",
    },
    {
        "id": "csis",
        "name": "CSIS",
        "url": "https://www.csis.org/rss/programs",
        "tier": "analysis",
        "tier_label": "Analysis",
    },
]

CENTCOM_URL = "https://www.centcom.mil/NEWS/News-Releases/"

IRAN_KEYWORDS = [
    "iran", "tehran", "irgc", "persian gulf", "strait of hormuz", "hormuz",
    "iraq", "syria", "hamas", "hezbollah", "houthi", "yemen", "israel",
    "nuclear", "enrichment", "natanz", "fordow", "arak", "bushehr",
    "middle east", "gulf", "saudi", "uae", "qatar", "bahrain",
    "drone", "missile", "airstrike", "strike", "attack",
]


def _is_relevant(text: str) -> bool:
    low = text.lower()
    return any(kw in low for kw in IRAN_KEYWORDS)


def _fetch_rss(source: dict) -> list:
    try:
        feed = feedparser.parse(source["url"])
        articles = []
        for entry in feed.entries[:20]:
            title = entry.get("title", "")
            summary = entry.get("summary", entry.get("description", ""))
            link = entry.get("link", "")
            published = entry.get("published", entry.get("updated", ""))

            # Try to parse date
            pub_dt = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                pub_dt = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc).isoformat()
            elif published:
                pub_dt = published

            if not _is_relevant(title + " " + summary):
                continue

            articles.append(
                {
                    "source_id": source["id"],
                    "source_name": source["name"],
                    "tier": source["tier"],
                    "tier_label": source["tier_label"],
                    "title": title,
                    "summary": summary[:300] if summary else "",
                    "link": link,
                    "published": pub_dt or "",
                }
            )
        return articles
    except Exception as e:
        logger.warning("RSS fetch failed for %s: %s", source["name"], e)
        return []


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/news")
def api_news():
    cached = cache_get("news")
    if cached:
        return jsonify(cached)

    all_articles = []
    for source in RSS_SOURCES:
        all_articles.extend(_fetch_rss(source))

    # Fetch CENTCOM press releases (simple HTML scrape for headlines)
    try:
        r = requests.get(CENTCOM_URL, timeout=8, headers={"User-Agent": "IranWarMonitor/1.0"})
        if r.ok:
            # Minimal parse: find article links/titles in the HTML
            import re
            matches = re.findall(
                r'<a[^>]+href="(/NEWS/[^"]+)"[^>]*>([^<]{10,})</a>', r.text
            )
            for path, title in matches[:10]:
                if _is_relevant(title):
                    all_articles.append(
                        {
                            "source_id": "centcom",
                            "source_name": "CENTCOM",
                            "tier": "official",
                            "tier_label": "Official",
                            "title": title.strip(),
                            "summary": "",
                            "link": "https://www.centcom.mil" + path,
                            "published": "",
                        }
                    )
    except Exception as e:
        logger.warning("CENTCOM scrape failed: %s", e)

    # UKMTO: incidents page requires browser JS — add as a static pinned card
    all_articles.append({
        "source_id": "ukmto",
        "source_name": "UKMTO",
        "tier": "official",
        "tier_label": "Official",
        "title": "UKMTO Recent Incidents — Live Maritime Security Reports",
        "summary": (
            "United Kingdom Maritime Trade Operations publishes live maritime incident "
            "reports covering the Red Sea, Gulf of Aden, Arabian Sea, Persian Gulf, and "
            "Indian Ocean. Incidents include drone/missile attacks, vessel boardings, "
            "suspicious approaches, and Houthi activity. Click to view the live feed."
        ),
        "link": "https://www.ukmto.org/recent-incidents",
        "published": "",
        "pinned": True,
    })

    # Sort by published desc (empty dates go last), pinned items stay at top
    all_articles.sort(key=lambda a: (not a.get("pinned", False), a.get("published") or ""), reverse=True)

    result = {
        "articles": all_articles,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "count": len(all_articles),
    }
    cache_set("news", result)
    return jsonify(result)


@app.route("/api/firms")
def api_firms():
    cached = cache_get("firms")
    if cached:
        return jsonify(cached)

    api_key = os.getenv("FIRMS_API_KEY", "")
    if not api_key or api_key == "your_firms_api_key_here":
        return jsonify(
            {
                "features": [],
                "error": "FIRMS_API_KEY not configured. Get a free key at https://firms.modaps.eosdis.nasa.gov/api/area/",
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    # Middle East bounding box: W=44, S=22, E=64, N=38
    bbox = "44,22,64,38"
    url = (
        f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{api_key}/VIIRS_SNPP_NRT/{bbox}/1"
    )

    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        features = []
        lines = r.text.strip().split("\n")
        if len(lines) > 1:
            headers = [h.strip() for h in lines[0].split(",")]
            for line in lines[1:]:
                values = [v.strip() for v in line.split(",")]
                if len(values) < len(headers):
                    continue
                row = dict(zip(headers, values))
                try:
                    lat = float(row.get("latitude", 0))
                    lon = float(row.get("longitude", 0))
                except ValueError:
                    continue
                features.append(
                    {
                        "lat": lat,
                        "lon": lon,
                        "brightness": row.get("bright_ti4", row.get("brightness", "")),
                        "confidence": row.get("confidence", ""),
                        "acq_date": row.get("acq_date", ""),
                        "acq_time": row.get("acq_time", ""),
                        "satellite": row.get("satellite", "VIIRS"),
                    }
                )
        result = {
            "features": features,
            "count": len(features),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("FIRMS fetch error: %s", e)
        result = {
            "features": [],
            "error": str(e),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

    cache_set("firms", result)
    return jsonify(result)


@app.route("/api/gdelt")
def api_gdelt():
    cached = cache_get("gdelt")
    if cached:
        return jsonify(cached)

    # GDELT Doc API — OR terms must be wrapped in parentheses
    gdelt_url = (
        "https://api.gdeltproject.org/api/v2/doc/doc"
        "?query=%28Iran%20OR%20IRGC%20OR%20Hormuz%29"
        "%20sourcelang:English"
        "&mode=artlist&maxrecords=50&format=json"
        "&timespan=48h"
        "&sort=DateDesc"
    )

    try:
        r = requests.get(gdelt_url, timeout=15, headers={"User-Agent": "IranWarMonitor/1.0"})
        if r.status_code == 429:
            # Rate limited — back off and retry once after 6 seconds
            logger.warning("GDELT rate limited (429), retrying in 6s…")
            time.sleep(6)
            r = requests.get(gdelt_url, timeout=15, headers={"User-Agent": "IranWarMonitor/1.0"})
        r.raise_for_status()
        # GDELT returns plain-text error messages instead of JSON in some cases
        if "application/json" not in r.headers.get("Content-Type", ""):
            raise ValueError(f"GDELT returned non-JSON response: {r.text[:200]}")
        data = r.json()
        articles = data.get("articles", [])

        events = []
        tone_sum = 0.0
        tone_count = 0

        for art in articles:
            tone_raw = art.get("tone", "")
            tone_val = None
            if tone_raw:
                try:
                    tone_val = float(str(tone_raw).split(",")[0])
                    tone_sum += tone_val
                    tone_count += 1
                except ValueError:
                    pass

            events.append(
                {
                    "title": art.get("title", ""),
                    "url": art.get("url", ""),
                    "domain": art.get("domain", ""),
                    "date": art.get("seendate", ""),
                    "tone": tone_val,
                    "country": art.get("sourcecountry", ""),
                    "language": art.get("language", ""),
                }
            )

        avg_tone = round(tone_sum / tone_count, 2) if tone_count else None

        # Map tone to threat level
        if avg_tone is None:
            threat = "UNKNOWN"
        elif avg_tone < -5:
            threat = "HIGH"
        elif avg_tone < -2:
            threat = "ELEVATED"
        elif avg_tone < 1:
            threat = "GUARDED"
        else:
            threat = "LOW"

        # Build daily event counts (last 7 days) from the articles
        from collections import defaultdict
        daily_counts: dict = defaultdict(int)
        for ev in events:
            d = str(ev.get("date", ""))[:8]  # YYYYMMDD
            if d:
                daily_counts[d] += 1

        sorted_days = sorted(daily_counts.keys())[-7:]
        chart_labels = [f"{d[4:6]}/{d[6:8]}" for d in sorted_days]
        chart_data = [daily_counts[d] for d in sorted_days]

        result = {
            "events": events[:10],
            "avg_tone": avg_tone,
            "threat_level": threat,
            "chart": {"labels": chart_labels, "data": chart_data},
            "total_articles": len(articles),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("GDELT fetch error: %s", e)
        result = {
            "events": [],
            "avg_tone": None,
            "threat_level": "UNKNOWN",
            "chart": {"labels": [], "data": []},
            "total_articles": 0,
            "error": str(e),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        # Cache errors briefly (30s) to avoid hammering GDELT on rapid retries
        cache_set("gdelt", result, ttl=30)
        return jsonify(result)

    cache_set("gdelt", result)
    return jsonify(result)


@app.route("/api/opensky")
def api_opensky():
    cached = cache_get("opensky")
    if cached:
        return jsonify(cached)

    # Middle East bbox: lamin=22, lomin=44, lamax=38, lomax=64
    url = (
        "https://opensky-network.org/api/states/all"
        "?lamin=22&lomin=44&lamax=38&lomax=64"
    )

    try:
        r = requests.get(url, timeout=15, headers={"User-Agent": "IranWarMonitor/1.0"})
        r.raise_for_status()
        data = r.json()
        states = data.get("states", []) or []

        aircraft = []
        for s in states:
            # OpenSky state vector columns:
            # 0:icao24, 1:callsign, 2:origin_country, 3:time_position,
            # 4:last_contact, 5:longitude, 6:latitude, 7:baro_altitude,
            # 8:on_ground, 9:velocity, 10:true_track, ...
            if len(s) < 9:
                continue
            lon = s[5]
            lat = s[6]
            if lon is None or lat is None:
                continue
            aircraft.append(
                {
                    "icao24": s[0],
                    "callsign": (s[1] or "").strip(),
                    "country": s[2],
                    "lat": lat,
                    "lon": lon,
                    "altitude": s[7],
                    "on_ground": s[8],
                    "velocity": s[9],
                    "heading": s[10] if len(s) > 10 else None,
                }
            )

        result = {
            "aircraft": aircraft,
            "count": len(aircraft),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("OpenSky fetch error: %s", e)
        result = {
            "aircraft": [],
            "count": 0,
            "error": str(e),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

    cache_set("opensky", result)
    return jsonify(result)


@app.route("/api/assets")
def api_assets():
    cached = cache_get("assets")
    if cached:
        return jsonify(cached)

    geojson_path = os.path.join(os.path.dirname(__file__), "data", "assets.geojson")
    try:
        with open(geojson_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        result = data
    except Exception as e:
        logger.error("Assets load error: %s", e)
        result = {"type": "FeatureCollection", "features": [], "error": str(e)}

    cache_set("assets", result)
    return jsonify(result)


@app.route("/api/strikes")
def api_strikes():
    cached = cache_get("strikes")
    if cached:
        return jsonify(cached)

    strikes_path = os.path.join(os.path.dirname(__file__), "data", "strikes.json")
    try:
        with open(strikes_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        logger.error("Strikes load error: %s", e)
        data = {"daily": [], "error": str(e)}

    cache_set("strikes", data)
    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
