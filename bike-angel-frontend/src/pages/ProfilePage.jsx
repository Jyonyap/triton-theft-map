// ProfilePage component
// User profile and settings page

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, deleteAccount } from '../services/userService';
import { getFavoriteZones, removeFavoriteZone } from '../services/favoriteService';
import { logout, getCurrentUser } from '../services/authService';

function ProfilePage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadProfile();
    loadFavorites();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data.user);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const data = await getFavoriteZones();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  const handleNotificationToggle = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const newValue = !profile.notifications_enabled;
      const data = await updateProfile({
        notifications_enabled: newValue
      });

      setProfile(data.user);
      setSuccessMessage(
        newValue
          ? 'Notifications enabled. You will receive theft alerts for your favorite zones.'
          : 'Notifications disabled. You will not receive theft alerts.'
      );

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update notification preferences');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBikeNameSave = async (newBikeName) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const data = await updateProfile({
        bike_name: newBikeName
      });

      setProfile(data.user);
      setSuccessMessage(newBikeName ? `Bike name updated to "${newBikeName}"!` : 'Bike name cleared');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update bike name');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFavorite = async (zoneId) => {
    try {
      await removeFavoriteZone(zoneId);
      setFavorites(prev => prev.filter(fav => fav.id !== zoneId));
      setSuccessMessage('Zone removed from favorites');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to remove favorite zone');
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      logout();
      navigate('/register');
    } catch (err) {
      setError('Failed to delete account');
      console.error(err);
    }
  };

  const getRiskRatingColor = (rating) => {
    switch (rating) {
      case 'red':
        return 'bg-red-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'green':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load profile</p>
          <button
            onClick={() => navigate('/map')}
            className="text-blue-600 hover:text-blue-800"
          >
            Return to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Profile & Settings
          </h1>
          <button
            onClick={() => navigate('/map')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back to Map
          </button>
        </header>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Profile Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-gray-900">{profile.name}</p>
            </div>
            {isAdmin && (
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    👑 Administrator
                  </span>
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Bike Name</label>
              <BikeNameEditor 
                currentName={profile.bike_name} 
                onSave={handleBikeNameSave}
                saving={saving}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{profile.email}</p>
              {profile.email_verified && (
                <span className="inline-flex items-center mt-1 text-xs text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1 text-gray-900">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Tools Section */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-sm p-6 mb-6 border-2 border-purple-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">👑</span>
              Admin Tools
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              Manage parking zones and reference photos
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1 px-4 py-3 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
              >
                📊 Admin Dashboard
              </button>
              <button
                onClick={() => navigate('/admin/add-spot')}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                📍 Add New Spot
              </button>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Notification Settings
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Theft Alerts</p>
              <p className="text-sm text-gray-600 mt-1">
                Receive notifications when thefts are reported in your favorite zones
              </p>
            </div>
            <button
              onClick={handleNotificationToggle}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                profile.notifications_enabled ? 'bg-blue-600' : 'bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  profile.notifications_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Favorite Zones */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Favorite Zones ({favorites.length})
          </h2>
          {favorites.length === 0 ? (
            <p className="text-gray-600 text-sm">
              You haven't added any favorite zones yet. Add favorites from the map to receive theft alerts.
            </p>
          ) : (
            <div className="space-y-2">
              {favorites.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getRiskRatingColor(zone.risk_rating)}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{zone.name}</p>
                      <p className="text-xs text-gray-600">
                        {zone.congestion_level} • {zone.risk_rating} risk
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(zone.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Danger Zone
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-700 mb-2">
                Deleting your account will permanently remove all your data, including parking reports and theft incidents. This action cannot be undone.
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600">
                    Are you sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      Yes, Delete My Account
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// BikeNameEditor component - inline editor for bike name
function BikeNameEditor({ currentName, onSave, saving }) {
  const [isEditing, setIsEditing] = useState(false);
  const [bikeName, setBikeName] = useState(currentName || '');

  const handleSave = () => {
    onSave(bikeName.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setBikeName(currentName || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="mt-1 flex items-center space-x-2">
        <input
          type="text"
          value={bikeName}
          onChange={(e) => setBikeName(e.target.value)}
          placeholder="e.g., BatmanComing"
          maxLength={100}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center justify-between">
      <p className="text-gray-900">
        {currentName ? (
          <span>
            🚲 <span className="font-medium">{currentName}</span>
          </span>
        ) : (
          <span className="text-gray-500 italic">No bike name set</span>
        )}
      </p>
      <button
        onClick={() => setIsEditing(true)}
        className="ml-2 text-sm text-blue-600 hover:text-blue-800"
      >
        {currentName ? 'Edit' : 'Add Name'}
      </button>
    </div>
  );
}

export default ProfilePage;
