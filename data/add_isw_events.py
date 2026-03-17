import json

path = "H:/AI Projects/Iran War Monitor/data/assets.geojson"
with open(path, "r") as f:
    data = json.load(f)

isw_features = [
    # --- US/ISRAEL STRIKES ON IRAN ---
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [59.22, 32.36]},
        "properties": {
            "name": "Bijrand Drone Facility Strike (ISW Mar 16)",
            "type": "damage",
            "subtype": "airstrike",
            "country": "Iran",
            "status": "Struck",
            "actor": "US/Israel combined forces",
            "event_date": "2026-03-15",
            "notes": "ISW Mar 16 2026: US/Israeli combined strike on Iranian drone production facility near Bijrand, South Khorasan Province. Strike targeted drone assembly infrastructure. Part of coordinated multi-axis campaign against Iranian air/missile production.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [51.56, 35.69]},
        "properties": {
            "name": "Doshan Tappeh Air Base Strike (ISW Mar 16)",
            "type": "damage",
            "subtype": "airstrike",
            "country": "Iran",
            "status": "Struck",
            "actor": "US/Israel combined forces",
            "event_date": "2026-03-16",
            "notes": "ISW Mar 16 2026: US/Israel combined force strike on Doshan Tappeh Air Base, eastern Tehran. Targeted Iranian air defence assets. Doshan Tappeh is an IRIAF and IRGC-ASF base used for air defence coordination over Tehran. Strike degraded integrated air defence network.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [60.64, 25.29]},
        "properties": {
            "name": "Chabahar Engagement (ISW Mar 16)",
            "type": "damage",
            "subtype": "naval_strike",
            "country": "Iran",
            "status": "Struck",
            "actor": "US Navy (USS carrier-based F/A-18)",
            "event_date": "2026-03-16",
            "notes": "ISW Mar 16 2026: US Navy F/A-18 low-altitude engagement at Chabahar, Sistan-Baluchestan Province. Chabahar hosts IRIN (Iranian Navy) and IRGC-N bases. Strike reportedly targeted IRGC naval assets and missile launch infrastructure on the Arabian Sea coast. India-operated Shahid Beheshti port nearby — ISW notes potential escalation risk.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },

    # --- IRANIAN STRIKES ON GULF STATES ---
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [55.364, 25.253]},
        "properties": {
            "name": "Dubai International Airport — Iranian Drone Strike (ISW Mar 16)",
            "type": "damage",
            "subtype": "drone_strike",
            "country": "UAE",
            "status": "Struck",
            "actor": "Iran (IRGC)",
            "event_date": "2026-03-16",
            "notes": "ISW Mar 16 2026: Iranian IRGC drone strike on Dubai International Airport. Fuel tank fire reported. Airport operations disrupted. One of the world's busiest airports (~90M pax/yr). Strike represents major escalation against UAE civilian infrastructure. UAE government condemned attack.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [56.336, 25.118]},
        "properties": {
            "name": "Fujairah Oil Industrial Zone — Iranian Drone Strike (ISW Mar 16)",
            "type": "damage",
            "subtype": "drone_strike",
            "country": "UAE",
            "status": "Struck",
            "actor": "Iran (IRGC)",
            "event_date": "2026-03-16",
            "notes": "ISW Mar 16 2026: Iranian drone strike on Fujairah Oil Industrial Zone. Pipeline infrastructure and storage tanker hit; fire reported. Fujairah is a major oil bunkering and storage hub outside the Strait of Hormuz (~25M barrels storage capacity). Attack targeted Hormuz bypass infrastructure. FUJAIRAH's strategic importance as alternative to Hormuz makes it a high-value Iranian target.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [53.33, 25.11]},
        "properties": {
            "name": "Shah Oil Field, Abu Dhabi — Iranian Drone Strike (ISW Mar 16)",
            "type": "damage",
            "subtype": "drone_strike",
            "country": "UAE",
            "status": "Struck",
            "actor": "Iran (IRGC)",
            "event_date": "2026-03-16",
            "notes": "ISW Mar 16 2026: Iranian drone strike on Shah oil field, Abu Dhabi. Fire reported at production facility. Shah field operated by ADNOC/GASCO joint venture. Attack mirrors January 2022 Houthi-attributed Aramco drone strike pattern. Part of coordinated Iranian strike package against UAE energy infrastructure.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [54.35, 24.10]},
        "properties": {
            "name": "Al Bahyah, Abu Dhabi — Iranian Missile Strike (ISW Mar 16)",
            "type": "damage",
            "subtype": "missile_strike",
            "country": "UAE",
            "status": "Struck — 1 KIA",
            "actor": "Iran (IRGC)",
            "event_date": "2026-03-16",
            "notes": "ISW Mar 16 2026: Iranian ballistic or cruise missile strike on Al Bahyah area, Abu Dhabi. 1 civilian killed, multiple injured. Residential/industrial area south-west of Abu Dhabi city. UAE Patriot PAC-3 batteries attempted intercept. Confirms Iran targeting UAE civilian areas as escalation pressure.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },

    # --- IRANIAN STRIKES ON ISRAEL ---
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [34.80, 31.96]},
        "properties": {
            "name": "Rishon Lezion — Iranian Cluster Munition Strike (ISW Mar 16)",
            "type": "damage",
            "subtype": "missile_strike",
            "country": "Israel",
            "status": "Struck",
            "actor": "Iran (IRGC ballistic missile)",
            "event_date": "2026-03-16",
            "notes": "ISW Mar 16 2026: Iranian cluster munition impact at Rishon Lezion, major city south of Tel Aviv. Cluster munition sub-munition dispersal reported over urban area. Multiple casualties suspected. Use of cluster munitions against urban civilian areas notable escalation. Rishon Lezion population ~260,000.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [35.214, 31.769]},
        "properties": {
            "name": "Jerusalem — Iranian Projectile Fragments (ISW Mar 16)",
            "type": "damage",
            "subtype": "missile_strike",
            "country": "Israel",
            "status": "Struck (fragmentation)",
            "actor": "Iran",
            "event_date": "2026-03-16",
            "notes": "ISW Mar 16 2026: Iranian projectile fragments impacted near Boyan Hasidic Synagogue, Jerusalem. Intercepted or fragmented munition scatter. High symbolic and political sensitivity given location. IDF confirmed fragments recovered. Jerusalem strikes represent significant escalation threshold crossed by Iran.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [35.00, 31.72]},
        "properties": {
            "name": "Beit Shemesh — Iranian Projectile Fragments (ISW Mar 16)",
            "type": "damage",
            "subtype": "missile_strike",
            "country": "Israel",
            "status": "Struck (fragmentation)",
            "actor": "Iran",
            "event_date": "2026-03-16",
            "notes": "ISW Mar 16 2026: Iranian projectile fragments impacted in Beit Shemesh, city west of Jerusalem. Intercepted or fragmented munition scatter. No major structural damage reported but residents sheltering. Population ~130,000.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },

    # --- HEZBOLLAH STRIKES ON ISRAEL ---
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [35.098, 32.999]},
        "properties": {
            "name": "Nahariya — Hezbollah Rocket Direct Impact (ISW Mar 16)",
            "type": "damage",
            "subtype": "rocket_strike",
            "country": "Israel",
            "status": "Struck",
            "actor": "Hezbollah",
            "event_date": "2026-03-16",
            "notes": "ISW Mar 16 2026: Hezbollah rocket direct impact in Nahariya, coastal city in northern Israel. Building damage reported. Nahariya (pop. ~60,000) has been repeatedly targeted in previous Hezbollah escalations. Part of coordinated Hezbollah barrage supporting Iranian strikes. Western Galilee Hospital nearby.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },

    # --- IDF STRIKES ON HEZBOLLAH (LEBANON) ---
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [35.588, 33.280]},
        "properties": {
            "name": "Khiam — IDF Strike on Hezbollah Weapons Depot (ISW Mar 16)",
            "type": "damage",
            "subtype": "airstrike",
            "country": "Lebanon",
            "status": "Struck",
            "actor": "IDF (Israel Defense Forces)",
            "event_date": "2026-03-16",
            "notes": "ISW Mar 16 2026: IDF airstrike on Hezbollah weapons depot in Khiam, southern Lebanon. Large secondary explosions confirmed — indicative of significant munitions cache. Khiam has been a recurring IDF target due to Hezbollah's use of the area as a weapons storage and staging zone for rocket attacks on northern Israel. IDF continues ground operations in southern Lebanon buffer zone.",
            "source": "ISW Iran Update Evening Special Report, March 16, 2026",
            "last_updated": "2026-03-16"
        }
    },
]

data["features"].extend(isw_features)

with open(path, "w") as f:
    json.dump(data, f, indent=2)

from collections import Counter
types = Counter(f["properties"]["type"] for f in data["features"])
print(f"Total features: {len(data['features'])}")
for t, n in sorted(types.items()):
    print(f"  {t}: {n}")
print(f"\nAdded {len(isw_features)} ISW event markers.")
