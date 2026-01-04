import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveSession, endParkingSession, getPhotoTimeline } from '../services/reportService';

function ParkingDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [ending, setEnding] = useState(false);
  
  useEffect(() => {
    fetchSessionAndPhotos();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSessionAndPhotos, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchSessionAndPhotos = async () => {
    try {
      const sessionData = await getActiveSession();
      
      if (!sessionData.hasActiveSession) {
        // No active session, redirect to map
        navigate('/map');
        return;
      }
      
      setSession(sessionData.session);
      
      // Fetch photos for this zone
      const timelineData = await getPhotoTimeline(sessionData.session.zone_id, 10);
      setPhotos(timelineData.photos || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to load parking session');
      setLoading(false);
    }
  };
  
  const handleEndParking = async () => {
    setEnding(true);
    setError('');
    
    try {
      await endParkingSession(session.zone_id);
      // Redirect to map
      navigate('/map');
    } catch (err) {
      console.error('Error ending parking:', err);
      setError('Failed to end parking session');
      setEnding(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!session) {
    return null;
  }
  
  const durationHours = Math.floor(session.durationMinutes / 60);
  const durationMins = session.durationMinutes % 60;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/map')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Map
            </button>
            <h1 className="text-xl font-bold text-gray-900">Parking Dashboard</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {/* Current Parking Info */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{session.zone_name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Parked for {durationHours}h {durationMins}m
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowEndModal(true)}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 font-medium"
          >
            End Parking
          </button>
        </div>
        
        {/* Photo Timeline */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Photos ({photos.length})
          </h3>
          
          {photos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2">No photos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.canViewHighRes ? photo.photoUrl : photo.thumbnailUrl}
                    alt="Parking photo"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-2 rounded-b-lg text-xs">
                    <p className="font-medium">{photo.uploaderName}</p>
                    <p className="text-gray-300">{new Date(photo.timestamp).toLocaleTimeString()}</p>
                  </div>
                  {!photo.canViewHighRes && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Preview
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* End Parking Modal */}
      {showEndModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => !ending && setShowEndModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-4">End Parking Session?</h3>
              <p className="text-sm text-gray-600 mb-6">
                You've been parked for {durationHours}h {durationMins}m. 
                Ending your session will revoke access to high-resolution photos.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEndModal(false)}
                  disabled={ending}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndParking}
                  disabled={ending}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {ending ? 'Ending...' : 'End Parking'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ParkingDashboard;
