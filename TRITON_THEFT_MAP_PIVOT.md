# Triton Theft Map - Pivot Plan

## 🎯 New Vision

**Name**: Triton Theft Map  
**Tagline**: "Know where NOT to park your bike at UCSD"

**Core Value**: Show students bike theft hotspots with ZERO friction
- No login to view map
- Red/Orange/Gray zones based on theft frequency
- Click incident → see what happened
- Quick theft reporting (optional, when it happens to you)

---

## 🎨 Map Color Scheme

### Zone Colors
- 🔴 **Red**: High risk (3+ thefts in last 6 months)
- 🟠 **Orange**: Medium risk (1-2 thefts in last 6 months)
- ⚪ **Gray/Ghost**: No recent data (safe or unknown)

### Incident Markers
- 🔴 Red pin: Recent theft (< 3 months)
- 🟠 Orange pin: Older theft (3-6 months)
- ⚫ Gray pin: Historical (> 6 months)

---

## 🗺️ Location Geocoding Strategy

### The Challenge
Reddit posts say: "Stolen at Geisel Library"  
We need: `{ lat: 32.8810, lng: -117.2375 }`

### Solution: UCSD Location Database

**Step 1**: Create a hardcoded mapping of common UCSD locations

```javascript
const UCSD_LOCATIONS = {
  // Libraries
  "geisel": { lat: 32.8810, lng: -117.2375, name: "Geisel Library" },
  "geisel library": { lat: 32.8810, lng: -117.2375, name: "Geisel Library" },
  "biomedical library": { lat: 32.8752, lng: -117.2364, name: "Biomedical Library" },
  
  // Colleges
  "warren": { lat: 32.8818, lng: -117.2335, name: "Warren College" },
  "revelle": { lat: 32.8732, lng: -117.2407, name: "Revelle College" },
  "muir": { lat: 32.8778, lng: -117.2425, name: "Muir College" },
  "marshall": { lat: 32.8798, lng: -117.2382, name: "Marshall College" },
  "erc": { lat: 32.8828, lng: -117.2408, name: "Eleanor Roosevelt College" },
  "sixth": { lat: 32.8858, lng: -117.2428, name: "Sixth College" },
  "seventh": { lat: 32.8888, lng: -117.2398, name: "Seventh College" },
  
  // Academic Buildings
  "cse": { lat: 32.8818, lng: -117.2335, name: "CSE Building" },
  "price center": { lat: 32.8799, lng: -117.2364, name: "Price Center" },
  "rimac": { lat: 32.8868, lng: -117.2398, name: "RIMAC" },
  "pepper canyon": { lat: 32.8808, lng: -117.2348, name: "Pepper Canyon Hall" },
  
  // Parking Structures
  "gilman parking": { lat: 32.8788, lng: -117.2368, name: "Gilman Parking Structure" },
  "hopkins parking": { lat: 32.8818, lng: -117.2428, name: "Hopkins Parking Structure" },
  "pangea parking": { lat: 32.8858, lng: -117.2368, name: "Pangea Parking Structure" },
  
  // Add more as we find them in Reddit posts...
};
```

**Step 2**: Fuzzy matching function

```javascript
function geocodeUCSDLocation(text) {
  const normalized = text.toLowerCase().trim();
  
  // Direct match
  if (UCSD_LOCATIONS[normalized]) {
    return UCSD_LOCATIONS[normalized];
  }
  
  // Fuzzy match (contains)
  for (const [key, location] of Object.entries(UCSD_LOCATIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return location;
    }
  }
  
  // Fallback: UCSD center
  return {
    lat: 32.8801,
    lng: -117.2340,
    name: "UCSD Campus (approximate)",
    approximate: true
  };
}
```

**Step 3**: Manual review for Reddit scraping
- Scrape posts
- Extract location text
- Run through geocoder
- **Flag for manual review** if `approximate: true`
- You manually fix the ~10-20 ambiguous ones

---

## 📊 Data Sources

### Phase 1: Manual Seeding (Day 1)
1. Search r/UCSD for "bike stolen" (last 2 years)
2. Extract ~20-30 posts manually
3. Use geocoder + manual fixes
4. Seed database

### Phase 2: User Reports (Day 3+)
- Users report new thefts
- GPS coordinates from their phone
- No geocoding needed!

### Phase 3: Automated Scraping (Future)
- Reddit API + geocoder
- Run weekly
- Auto-flag for review

---

## 🔧 Technical Changes

### Backend Changes

**1. Update Zone Risk Calculation**
```javascript
// OLD: Based on parking congestion
// NEW: Based on theft frequency

function calculateZoneRisk(incidents, timeWindow = 6) {
  const recentIncidents = incidents.filter(i => 
    isWithinMonths(i.occurred_at, timeWindow)
  );
  
  if (recentIncidents.length >= 3) return 'HIGH';
  if (recentIncidents.length >= 1) return 'MEDIUM';
  return 'SAFE';
}
```

**2. Simplify Incident Schema**
```sql
-- Keep it simple
CREATE TABLE theft_incidents (
  id UUID PRIMARY KEY,
  location GEOMETRY(POINT, 4326),
  location_name TEXT,
  occurred_at TIMESTAMP,
  description TEXT,
  photo_url TEXT,
  source TEXT, -- 'user_report' or 'reddit_scrape'
  created_at TIMESTAMP
);
```

**3. Add Geocoding Service**
```javascript
// bike-angel-backend/src/services/geocodingService.js
export function geocodeUCSDLocation(locationText) {
  // Implementation from above
}
```

### Frontend Changes

**1. Remove Login Wall**
```jsx
// OLD: LoginPage → MapPage
// NEW: MapPage directly (no auth required)

// App.jsx
<Routes>
  <Route path="/" element={<MapPage />} />
  <Route path="/report" element={<QuickReportPage />} />
</Routes>
```

**2. Update Map Colors**
```javascript
// CampusMap.jsx
const ZONE_COLORS = {
  HIGH: '#EF4444',    // Red
  MEDIUM: '#F97316', // Orange
  SAFE: '#9CA3AF'    // Gray
};
```

**3. Simplify Report Form**
```jsx
// QuickReportPage.jsx
<form>
  <h2>Report a Bike Theft</h2>
  <MapPicker /> {/* Click to set location */}
  <DatePicker label="When did it happen?" />
  <TextArea label="What happened? (optional)" />
  <PhotoUpload label="Evidence photo? (optional)" />
  <Input label="Email for updates? (optional)" />
  <Button>Submit Report</Button>
</form>
```

---

## 📅 Implementation Timeline

### Day 1: Data Foundation
- [ ] Create UCSD location database
- [ ] Build geocoding service
- [ ] Manually scrape 20-30 Reddit posts
- [ ] Seed database with historical thefts
- [ ] Update zone risk calculation

### Day 2: Frontend Pivot
- [ ] Remove login requirement
- [ ] Update map colors (Red/Orange/Gray)
- [ ] Simplify report form
- [ ] Update incident markers
- [ ] Test on localhost

### Day 3: Polish & Deploy
- [ ] Add incident detail modal
- [ ] Test geocoding accuracy
- [ ] Deploy to Vercel + Render
- [ ] Test on phone

### Day 4: Launch
- [ ] Post on r/UCSD
- [ ] Share in UCSD Discord/Slack
- [ ] Monitor usage

---

## 🎯 Success Metrics

**Week 1**:
- 100+ unique visitors
- 5+ user-submitted theft reports
- Positive comments on Reddit

**Week 2**:
- Students reference it when choosing parking
- Other UC schools ask for similar maps

**Month 1**:
- UCSD Transportation notices and shares it
- Local news picks it up

---

## 🚀 Launch Strategy

### Reddit Post Template
```
Title: I made a map of bike thefts at UCSD so you know where NOT to park

Body:
Got tired of hearing about bike thefts, so I mapped them all out.

🔴 Red zones = high theft risk
🟠 Orange zones = medium risk
⚪ Gray zones = no recent thefts

Check it before you lock up: [URL]

If your bike got stolen, add it to the map so others can avoid that spot.

Stay safe Tritons! 🔱
```

---

## 💡 Future Features (Post-Launch)

**If it gets traction**:
1. Email alerts when theft happens near your usual parking spot
2. "Safe parking" recommendations based on data
3. Lock type statistics (U-lock vs cable survival rates)
4. Time-of-day heatmap (when do thefts happen?)
5. Bike registration (optional, for recovery)

**But for now**: Keep it dead simple. Map + quick reporting.

---

## 🔥 Let's Build This!

Starting with Day 1: Location database + Reddit scraping.

Ready?
