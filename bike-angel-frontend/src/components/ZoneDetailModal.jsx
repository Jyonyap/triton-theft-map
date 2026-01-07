import { useEffect, useState, useRef } from 'react';
import { getTheftIncidentsByZone } from '../services/incidentService';
import { getParkingReportsByZone } from '../services/reportService';
import { addFavoriteZone, removeFavoriteZone, isZoneFavorited } from '../services/favoriteService';

function ZoneDetailModal({ zone, onClose }) {
  const [incidents, setIncidents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents' or 'reports'
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // Swipe gesture support for mobile
  const sheetRef = useRef(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  
  useEffect(() => {
    if (zone) {
      fetchZoneData();
      checkFavoriteStatus();
    }
  }, [zone]);
  
  // Handle swipe down to close on mobile
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
  };
  
  const handleTouchEnd = () => {
    const swipeDistance = touchEndY.current - touchStartY.current;
    // If swiped down more than 100px, close sheet
    if (swipeDistance > 100) {
      onClose();
    }
  };
  
  const checkFavoriteStatus = async () => {
    try {
      const favorited = await isZoneFavorited(zone.id);
      setIsFavorited(favorited);
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };
  
  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFavoriteZone(zone.id);
        setIsFavorited(false);
      } else {
        await addFavoriteZone(zone.id);
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };
  
  const fetchZoneData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch theft incidents (past 90 days)
      const incidentsData = await getTheftIncidentsByZone(zone.id, 90);
      setIncidents(incidentsData.incidents || []);
      
      // Fetch recent parking reports
      const reportsData = await getParkingReportsByZone(zone.id, 5);
      setReports(reportsData.reports || []);
      
    } catch (err) {
      setError('Failed to load zone details');
      console.error('Error fetching zone data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const getRiskRatingColor = (rating) => {
    switch (rating) {
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getCongestionColor = (level) => {
    switch (level) {
      case 'full':
        return 'text-red-600';
      case 'filling':
        return 'text-yellow-600';
      case 'available':
        return 'text-green-600';
      default:
        return 'text-gray-600';
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
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };
  
  // Safety check - don't render if no zone
  if (!zone || !zone.id) {
    console.warn('ZoneDetailModal: No zone provided, not rendering');
    return null;
  }
  
  return (
    <>
      {/* Backdrop - lighter on desktop, slightly darker on mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-10 md:bg-opacity-20 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Responsive Panel: Bottom sheet on mobile, Side panel on desktop */}
      <div 
        ref={sheetRef}
        className="fixed z-50 bg-white shadow-2xl
                   bottom-0 left-0 right-0 rounded-t-2xl h-[70vh]
                   md:top-0 md:left-0 md:bottom-0 md:right-auto md:w-[45%] lg:w-[40%] md:rounded-none md:h-full
                   transition-all duration-300"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle - Mobile only */}
        <div className="flex justify-center pt-3 pb-2 md:hidden">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer" onClick={onClose}></div>
        </div>
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{zone.name}</h2>
              <div className="mt-2 flex items-center space-x-2 sm:space-x-4 flex-wrap gap-y-2">
                {/* Risk Rating */}
                <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getRiskRatingColor(zone.risk_rating)}`}>
                  Risk: {zone.risk_rating.toUpperCase()}
                </span>
                {/* Congestion Level */}
                <span className={`inline-flex items-center text-xs sm:text-sm font-medium ${getCongestionColor(zone.congestion_level)}`}>
                  {getCongestionIcon(zone.congestion_level)} {zone.congestion_level.charAt(0).toUpperCase() + zone.congestion_level.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-2">
              {/* Favorite Button */}
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className={`inline-flex items-center px-2 sm:px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-touch min-w-touch ${
                  isFavorited
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                {favoriteLoading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill={isFavorited ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                )}
              </button>
              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none min-h-touch min-w-touch flex items-center justify-center"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap min-h-touch ${
                activeTab === 'incidents'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Theft Incidents ({incidents.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap min-h-touch ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent Photos ({reports.length})
            </button>
          </nav>
        </div>
        
        {/* Content - Scrollable */}
        <div className="overflow-y-auto smooth-scroll" style={{ height: 'calc(100% - 180px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              {error}
            </div>
          ) : (
            <>
              {/* Theft Incidents Tab */}
              {activeTab === 'incidents' && (
                <div className="p-4 sm:p-6">
                  {incidents.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        No theft incidents reported in the past 90 days
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {incidents.map((incident) => (
                        <div
                          key={incident.id}
                          className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs sm:text-sm font-medium text-gray-900">
                                  {formatDate(incident.date_time)}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-500">
                                  at {formatTime(incident.date_time)}
                                </span>
                              </div>
                              {incident.user_name && (
                                <div className="flex items-center text-xs text-gray-600">
                                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                  Reported by {incident.user_name}
                                </div>
                              )}
                            </div>
                            {incident.verified && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2 break-words">
                            {incident.description}
                          </p>
                          {incident.police_report_number && (
                            <p className="text-xs text-gray-500 break-all">
                              Police Report: {incident.police_report_number}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Recent Photos Tab */}
              {activeTab === 'reports' && (
                <div className="p-4 sm:p-6">
                  {reports.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        No recent parking photos
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {reports.map((report) => (
                        <div key={report.id} className="relative group">
                          <img
                            src={report.thumbnail_url}
                            alt="Parking report"
                            className="w-full h-40 sm:h-48 object-cover rounded-lg"
                            loading="lazy"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent text-white p-3 rounded-b-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs sm:text-sm font-medium">
                                  {report.bike_name || report.user_name}
                                </span>
                              </div>
                              <span className="text-xs sm:text-sm text-gray-300">
                                {getTimeAgo(report.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ZoneDetailModal;
