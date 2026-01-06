import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService';
import { getAllZones } from '../services/zoneService';
import ZoneDetailModal from '../components/ZoneDetailModal';
import CampusMap from '../components/CampusMap';
import NotificationBell from '../components/NotificationBell';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

function MapPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const isOnline = useOnlineStatus();

  // Debug: Log when selectedZone changes
  useEffect(() => {
    console.log('Selected zone changed:', selectedZone);
  }, [selectedZone]);

  useEffect(() => {
    // Map is now public - no login required for Triton Theft Map
    const currentUser = getCurrentUser();
    setUser(currentUser); // Can be null for public access
    fetchZones();
    requestUserLocation();
  }, [navigate]);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Enable location services to see your position.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const fetchZones = async () => {
    try {
      const data = await getAllZones();
      setZones(data.zones || []);
    } catch (err) {
      console.error('Error fetching zones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRiskRatingColor = (rating) => {
    // Triton Theft Map color scheme
    switch (rating) {
      case 'HIGH':
      case 'red':
        return 'bg-red-500'; // High theft risk
      case 'MEDIUM':
      case 'orange':
      case 'yellow':
        return 'bg-orange-500'; // Medium theft risk
      case 'LOW':
      case 'SAFE':
      case 'green':
        return 'bg-gray-400'; // Safe / No recent data
      default:
        return 'bg-gray-400';
    }
  };

  const getCongestionIcon = (level) => {
    switch (level) {
      case 'full':
        return '🚫';
      case 'filling':
        return '⚠️';
      case 'available':
        return '✅';
      default:
        return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
          <svg className="inline-block h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          You're offline. Showing cached data.
        </div>
      )}
      <div className="container mx-auto px-4 py-6">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-red-600">
              🚨 Triton Theft Map
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-700 font-medium">
              Know where NOT to park your bike at UCSD
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user && <NotificationBell onZoneClick={setSelectedZone} />}
            {user ? (
              <>
                <button
                  onClick={() => navigate('/profile')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Profile & Settings"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        <main>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Is Your Bike Safe Here?
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Real theft incidents reported by UCSD students
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => navigate('/report-theft')}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="mr-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  🚨 Report Theft
                </button>
                {user && (
                  <button
                    onClick={() => navigate('/report-parking')}
                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                  >
                    <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Share Parking Photo
                  </button>
                )}
              </div>
            </div>
            
            {/* Triton Theft Map Legend */}
            <div className="mb-4 p-4 bg-gradient-to-r from-red-100 via-orange-50 to-gray-50 rounded-lg border-2 border-red-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-900 mb-3">⚠️ Theft Risk Zones - Last 6 Months</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-7 h-7 bg-red-500 rounded-full mr-2 flex items-center justify-center text-white font-bold shadow-md">
                        🚨
                      </div>
                      <div>
                        <span className="font-bold text-red-700">HIGH RISK</span>
                        <span className="text-gray-700 ml-1 font-medium">(3+ thefts)</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-7 h-7 bg-orange-500 rounded-full mr-2 flex items-center justify-center text-white font-bold shadow-md">
                        ⚠️
                      </div>
                      <div>
                        <span className="font-bold text-orange-700">MEDIUM RISK</span>
                        <span className="text-gray-700 ml-1 font-medium">(1-2 thefts)</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-7 h-7 bg-green-500 rounded-full mr-2 flex items-center justify-center text-white font-bold shadow-md">
                        ✓
                      </div>
                      <div>
                        <span className="font-bold text-green-700">SAFE</span>
                        <span className="text-gray-700 ml-1 font-medium">(0 thefts)</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {locationLoading && (
                    <span className="text-xs text-gray-600 flex items-center">
                      <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting location...
                    </span>
                  )}
                  {locationError && (
                    <span className="text-xs text-red-600 flex items-center">
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {locationError}
                    </span>
                  )}
                  {userLocation && !locationLoading && (
                    <span className="text-xs text-green-600 flex items-center">
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Location enabled
                    </span>
                  )}
                  <button
                    onClick={requestUserLocation}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {userLocation ? 'Refresh location' : 'Enable location'}
                  </button>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* View Toggle */}
                <div className="mb-4 flex justify-end">
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                      type="button"
                      onClick={() => setViewMode('map')}
                      className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                        viewMode === 'map'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Map View
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      List View
                    </button>
                  </div>
                </div>

                {viewMode === 'map' ? (
                  <div className={`h-96 sm:h-[500px] lg:h-[600px] transition-all duration-300 ${
                    selectedZone ? 'md:ml-[45%] lg:ml-[40%]' : ''
                  }`}>
                    <CampusMap
                      zones={zones}
                      onZoneClick={setSelectedZone}
                      userLocation={userLocation}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-sm text-red-700 font-medium mb-4">
                      ⚠️ Click any zone to see theft incidents and safety details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {zones.map((zone) => (
                        <button
                          key={zone.id}
                          onClick={() => setSelectedZone(zone)}
                          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-left"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{zone.name}</h3>
                            <div className={`w-3 h-3 rounded-full ${getRiskRatingColor(zone.risk_rating)}`}></div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>{getCongestionIcon(zone.congestion_level)} {zone.congestion_level}</span>
                            <span className="text-gray-400">Click for details →</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      
      {/* Zone Detail Modal - Only render if zone is selected */}
      {selectedZone !== null && selectedZone !== undefined && (
        <ZoneDetailModal
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  );
}

export default MapPage;
