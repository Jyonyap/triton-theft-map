import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createZone } from '../services/adminZoneService';
import { compressImage } from '../utils/imageOptimization';

function AddSpotPage() {
  const navigate = useNavigate();
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState(null);
  const [dayPhoto, setDayPhoto] = useState(null);
  const [nightPhoto, setNightPhoto] = useState(null);
  const [zoneName, setZoneName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    captureGPS();
  }, []);

  const captureGPS = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('GPS not supported on this device');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGpsLoading(false);
      },
      (error) => {
        setGpsError(error.message);
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handlePhotoCapture = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Compress image before storing
      const compressed = await compressImage(file, 500);
      
      if (type === 'day') {
        setDayPhoto(compressed);
      } else {
        setNightPhoto(compressed);
      }
    } catch (err) {
      setError(`Failed to process ${type} photo`);
      console.error(err);
    }
  };

  const handleSaveSpot = async () => {
    if (!gpsData) {
      setError('GPS data is required');
      return;
    }

    if (!dayPhoto && !nightPhoto) {
      setError('At least one photo is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();
      formData.append('latitude', gpsData.latitude);
      formData.append('longitude', gpsData.longitude);
      formData.append('gps_accuracy', gpsData.accuracy);
      
      if (zoneName.trim()) {
        formData.append('name', zoneName.trim());
      }
      
      if (dayPhoto) {
        formData.append('photo_day', dayPhoto);
      }
      
      if (nightPhoto) {
        formData.append('photo_night', nightPhoto);
      }

      const result = await createZone(formData);
      
      // Success - navigate to admin dashboard
      navigate('/admin/dashboard', {
        state: { 
          message: `Spot "${result.zone.name}" created successfully!`,
          zoneId: result.zone.id 
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create spot');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getAccuracyColor = () => {
    if (!gpsData) return 'text-gray-500';
    if (gpsData.accuracy < 10) return 'text-green-600';
    if (gpsData.accuracy < 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyLabel = () => {
    if (!gpsData) return 'Unknown';
    if (gpsData.accuracy < 10) return 'High Accuracy';
    if (gpsData.accuracy < 20) return 'Medium Accuracy';
    return 'Low Accuracy';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Add New Spot
          </h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* GPS Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📍 GPS Location
          </h2>
          
          {gpsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Capturing GPS...</span>
            </div>
          )}

          {gpsError && (
            <div className="text-center py-4">
              <p className="text-red-600 mb-4">{gpsError}</p>
              <button
                onClick={captureGPS}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry GPS Capture
              </button>
            </div>
          )}

          {gpsData && !gpsLoading && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Accuracy:</span>
                <span className={`text-sm font-semibold ${getAccuracyColor()}`}>
                  {getAccuracyLabel()} ({gpsData.accuracy.toFixed(1)}m)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Latitude:</span>
                <span className="text-sm text-gray-900">{gpsData.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Longitude:</span>
                <span className="text-sm text-gray-900">{gpsData.longitude.toFixed(6)}</span>
              </div>
              {gpsData.accuracy > 20 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Low GPS accuracy detected. Consider moving to an open area for better signal.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Photos Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📸 Reference Photos
          </h2>
          
          {/* Day Photo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Day Photo
            </label>
            {dayPhoto ? (
              <div className="relative">
                <img
                  src={URL.createObjectURL(dayPhoto)}
                  alt="Day preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => setDayPhoto(null)}
                  className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700">Take Day Photo</p>
                  <p className="text-sm text-gray-500">Tap to open camera</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoCapture(e, 'day')}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Night Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Night Photo (Optional)
            </label>
            {nightPhoto ? (
              <div className="relative">
                <img
                  src={URL.createObjectURL(nightPhoto)}
                  alt="Night preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => setNightPhoto(null)}
                  className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700">Take Night Photo</p>
                  <p className="text-sm text-gray-500">Tap to open camera</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoCapture(e, 'night')}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Zone Name (Optional) */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🏷️ Zone Name (Optional)
          </h2>
          <input
            type="text"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            placeholder="Leave empty for auto-generated name (e.g., Spot #47)"
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
          />
          <p className="mt-2 text-sm text-gray-600">
            You can edit the name and add more details later from the admin dashboard.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveSpot}
          disabled={saving || !gpsData || (!dayPhoto && !nightPhoto)}
          className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving Spot...' : 'Save Spot'}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          The spot will be saved as a draft. You can complete the details later.
        </p>
      </div>
    </div>
  );
}

export default AddSpotPage;
