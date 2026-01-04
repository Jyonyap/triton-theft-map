# 🚨 Triton Theft Map

Interactive bike theft map for UCSD students - shows theft hotspots with **zero friction**.

## 🎯 What It Does

- **Public Map**: View bike theft hotspots across UCSD campus (no login required)
- **Color-Coded Zones**: Red (high risk), Orange (medium risk), Gray (no recent data)
- **Quick Reporting**: 2-minute form to report bike thefts
- **Smart Geocoding**: Automatically converts location names to GPS coordinates
- **Historical Data**: Based on real theft reports from r/UCSD

## 🚀 Tech Stack

### Frontend
- React 19 + Vite
- Tailwind CSS
- Leaflet (interactive maps)
- Deployed on Vercel

### Backend
- Node.js + Express
- PostgreSQL + PostGIS (Supabase)
- AWS S3 (photo storage)
- Deployed on Render

## 📦 Project Structure

```
triton-theft-map/
├── bike-angel-frontend/    # React frontend
├── bike-angel-backend/     # Node.js API
└── docs/                   # Documentation
```

## 🏃 Running Locally

### Backend
```bash
cd bike-angel-backend
npm install
npm run dev
```

### Frontend
```bash
cd bike-angel-frontend
npm install
npm run dev
```

## 🌐 Live Demo

Coming soon!

## 📝 License

MIT

## 🎓 Built for UCSD Students

Help keep our campus bikes safe! 🚲
