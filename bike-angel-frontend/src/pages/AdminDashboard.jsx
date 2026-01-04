import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAdminZones, getZoneStats, deleteZone, changeZoneStatus } from '../services/adminZoneService';

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [zones, setZones] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZones, setSelectedZones] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const [zonesData, statsData] = await Promise.all([
        getAdminZones(filters),
        getZoneStats(),
      ]);

      setZones(zonesData.zones || []);
      setStats(statsData.stats || {});
    } catch (err) {
      setError('Failed to load zones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      await deleteZone(zoneId);
      setSuccessMessage('Zone deleted successfully');
      loadData();
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete zone');
      console.error(err);
    }
  };

  const handleStatusChange = async (zoneId, newStatus) => {
    try {
      await changeZoneStatus(zoneId, newStatus);
      setSuccessMessage(`Zone status changed to ${newStatus}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change status');
      console.error(err);
    }
  };

  const handleSelectZone = (zoneId) => {
    setSelectedZones(prev =>
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  const handleSelectAll = () => {
    if (selectedZones.length === filteredZones.length) {
      setSelectedZones([]);
    } else {
      setSelectedZones(filteredZones.map(z => z.id));
    }
  };

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !zones.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage parking zones and reference photos
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/map')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Back to Map
            </button>
            <button
              onClick={() => navigate('/admin/add-spot')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              + Add New Spot
            </button>
          </div>
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

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Total Zones</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.draft || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive || 0}</p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'draft', 'active', 'inactive'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search zones by name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Batch Actions */}
          {selectedZones.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedZones.length} zone(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedZones([])}
                  className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Zone List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredZones.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No zones found</p>
              <button
                onClick={() => navigate('/admin/add-spot')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Your First Spot
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Select All Header */}
              <div className="p-4 bg-gray-50 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedZones.length === filteredZones.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Select All
                </span>
              </div>

              {/* Zone Items */}
              {filteredZones.map(zone => (
                <ZoneItem
                  key={zone.id}
                  zone={zone}
                  selected={selectedZones.includes(zone.id)}
                  onSelect={handleSelectZone}
                  onDelete={handleDeleteZone}
                  onStatusChange={handleStatusChange}
                  getStatusBadgeColor={getStatusBadgeColor}
                />
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Deletion
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete {selectedZones.length} zone(s)? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    selectedZones.forEach(id => handleDeleteZone(id));
                    setSelectedZones([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Zone Item Component
function ZoneItem({ zone, selected, onSelect, onDelete, onStatusChange, getStatusBadgeColor }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(zone.id)}
          className="mt-1 h-4 w-4 text-blue-600 rounded"
        />

        {/* Thumbnail */}
        <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
          {zone.reference_photo_day_url ? (
            <img
              src={zone.reference_photo_day_url}
              alt={zone.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Zone Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {zone.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                GPS: {zone.latitude.toFixed(6)}, {zone.longitude.toFixed(6)}
                {zone.gps_accuracy && ` (±${zone.gps_accuracy.toFixed(1)}m)`}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(zone.status)}`}>
                  {zone.status}
                </span>
                {zone.reference_photo_day_url && (
                  <span className="text-xs text-gray-500">☀️ Day</span>
                )}
                {zone.reference_photo_night_url && (
                  <span className="text-xs text-gray-500">🌙 Night</span>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    {zone.status !== 'active' && (
                      <button
                        onClick={() => {
                          onStatusChange(zone.id, 'active');
                          setShowActions(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Activate
                      </button>
                    )}
                    {zone.status !== 'inactive' && (
                      <button
                        onClick={() => {
                          onStatusChange(zone.id, 'inactive');
                          setShowActions(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Deactivate
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDelete(zone.id);
                        setShowActions(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Created {new Date(zone.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
