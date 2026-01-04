import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// UCSD campus coordinates (approximately center of campus)
const UCSD_CENTER = [32.8801, -117.2340];
const DEFAULT_ZOOM = 15;

// Component to handle map centering
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || DEFAULT_ZOOM);
    }
  }, [center, zoom, map]);
  
  return null;
}

// Create custom marker icons based on theft risk rating
const createMarkerIcon = (riskRating, incidentCount = 0) => {
  let color;
  let icon;
  
  // Triton Theft Map color scheme
  switch (riskRating) {
    case 'HIGH':
    case 'red':
      color = '#EF4444'; // Red - High theft risk
      icon = '🚨';
      break;
    case 'MEDIUM':
    case 'orange':
      color = '#F97316'; // Orange - Medium theft risk
      icon = '⚠️';
      break;
    case 'LOW':
    case 'SAFE':
    case 'green':
      color = '#9CA3AF'; // Gray - No recent data / Safe
      icon = '✓';
      break;
    default:
      color = '#9CA3AF'; // Gray - Unknown
      icon = '?';
  }
  
  // Show incident count if available
  const displayText = incidentCount > 0 ? incidentCount : icon;
  
  const html = `
    <div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="
        transform: rotate(45deg);
        font-size: 14px;
        font-weight: bold;
        color: white;
      ">${displayText}</span>
    </div>
  `;
  
  return L.divIcon({
    html: html,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

function CampusMap({ zones = [], onZoneClick, userLocation = null, center = null }) {
  const mapRef = useRef(null);
  
  // Use provided center or user location or default to UCSD center
  const mapCenter = center || userLocation || UCSD_CENTER;
  
  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={mapCenter} zoom={DEFAULT_ZOOM} />
        
        {/* Render parking zone markers */}
        {zones.map((zone) => {
          const position = [zone.latitude, zone.longitude];
          const icon = createMarkerIcon(zone.risk_rating, zone.congestion_level);
          
          return (
            <Marker
              key={zone.id}
              position={position}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onZoneClick) {
                    onZoneClick(zone);
                  }
                },
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-semibold text-gray-900 mb-1">{zone.name}</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Risk:</span>
                      <span className={`
                        px-2 py-0.5 rounded-full text-white
                        ${zone.risk_rating === 'red' ? 'bg-red-500' : ''}
                        ${zone.risk_rating === 'yellow' ? 'bg-yellow-500' : ''}
                        ${zone.risk_rating === 'green' ? 'bg-green-500' : ''}
                      `}>
                        {zone.risk_rating}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Status:</span>
                      <span>{zone.congestion_level}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onZoneClick && onZoneClick(zone)}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Render user location marker if available */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              html: `
                <div style="
                  background-color: #3b82f6;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>
              `,
              className: 'user-location-marker',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default CampusMap;
