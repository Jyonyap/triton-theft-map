import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTheftIncident } from '../services/incidentService';
import { getAllZones } from '../services/zoneService';

function ReportTheftPage() {
  const navigate = useNavigate();
  
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [description, setDescription] = useState('');
  const [policeReportNumber, setPoliceReportNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Fetch zones on mount
  useEffect(() => {
    fetchZones();
    // Set default date/time to now
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDateTime(localDateTime);
  }, []);
  
  const fetchZones = async () => {
    try {
      const data = await getAllZones();
      setZones(data.zones || []);
    } catch (err) {
      setError('Failed to load parking zones');
      console.error('Error fetching zones:', err);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!selectedZone) {
      setError('Please select a parking zone');
      return;
    }
    
    if (!dateTime) {
      setError('Please enter the date and time of the theft');
      return;
    }
    
    if (!description.trim()) {
      setError('Please provide a description of the incident');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await createTheftIncident({
        zoneId: selectedZone,
        dateTime: new Date(dateTime).toISOString(),
        description: description.trim(),
        policeReportNumber: policeReportNumber.trim() || undefined
      });
      
      console.log('Theft incident created:', result);
      setSuccess(true);
      
      // Redirect to map after 2 seconds
      setTimeout(() => {
        navigate('/map');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to submit theft report');
      console.error('Error submitting theft report:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/map')}
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Map
            </button>
            <h1 className="text-xl font-bold text-gray-900">🚨 Report Theft</h1>
            <div className="w-28"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Notice */}
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Help protect the Triton community:</strong> Your report helps other students avoid high-risk areas. 
                No login required - just share what happened to keep everyone safe.
              </p>
            </div>
          </div>
        </div>
        
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  <strong>Success!</strong> Your theft report has been submitted. The zone's risk rating has been updated. Redirecting to map...
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          {/* Zone Selector */}
          <div className="mb-6">
            <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-2">
              Parking Zone *
            </label>
            <select
              id="zone"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              required
            >
              <option value="">Select where the theft occurred</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date/Time Picker */}
          <div className="mb-6">
            <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 mb-2">
              Date and Time of Theft *
            </label>
            <input
              type="datetime-local"
              id="dateTime"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              max={new Date().toISOString().slice(0, 16)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              When did you discover the theft?
            </p>
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what happened (e.g., bike type, lock condition, any witnesses...)"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Provide details that might help other students stay safe
            </p>
          </div>
          
          {/* Police Report Number (Optional) */}
          <div className="mb-6">
            <label htmlFor="policeReport" className="block text-sm font-medium text-gray-700 mb-2">
              Police Report Number (Optional)
              {policeReportNumber.trim() && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Will be verified
                </span>
              )}
            </label>
            <input
              type="text"
              id="policeReport"
              value={policeReportNumber}
              onChange={(e) => setPoliceReportNumber(e.target.value)}
              placeholder="e.g., UCSD-2024-12345"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Reports with police report numbers are marked as verified and have more impact on risk ratings
            </p>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : success ? 'Submitted!' : 'Submit Theft Report'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReportTheftPage;
