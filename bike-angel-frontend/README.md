# Bike Angel Frontend

A mobile-first React application for the Bike Angel campus bicycle safety platform.

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS v4** - Mobile-first utility CSS framework
- **Axios** - HTTP client for API requests

## Project Structure

```
src/
├── components/     # Reusable React components
├── pages/          # Page-level components for routing
├── services/       # API services and business logic
│   └── api.js      # Axios instance with interceptors
├── utils/          # Utility functions and helpers
├── assets/         # Static assets (images, icons)
├── App.jsx         # Main app component
├── main.jsx        # Application entry point
└── index.css       # Global styles with Tailwind directives
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

## Mobile-First Design

This application is built with a mobile-first approach:

- Touch targets are minimum 44px for accessibility
- Responsive breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)
- Safe area insets for notched devices
- Optimized for touch interactions

## Custom Tailwind Colors

- `risk-red` - #EF4444 (High theft risk)
- `risk-yellow` - #F59E0B (Medium theft risk)
- `risk-green` - #10B981 (Low theft risk)

## API Configuration

The API client is pre-configured in `src/services/api.js` with:

- Automatic JWT token injection from localStorage
- 401 error handling (auto-logout)
- Base URL configuration via environment variables

## Next Steps

Refer to the implementation tasks in `.kiro/specs/bike-angel/tasks.md` for the development roadmap.
