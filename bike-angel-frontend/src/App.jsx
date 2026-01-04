import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MapPage from './pages/MapPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ReportParkingPage from './pages/ReportParkingPage';
import ReportTheftPage from './pages/ReportTheftPage';
import ProfilePage from './pages/ProfilePage';
import ParkingDashboard from './components/ParkingDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AddSpotPage from './pages/AddSpotPage';
import InstallPrompt from './components/InstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import FeedbackButton from './components/FeedbackButton';
import PerformanceMonitor from './components/PerformanceMonitor';
import DebugInfo from './components/DebugInfo';
import { isAuthenticated, getCurrentUser } from './services/authService';

// Protected route component
function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

// Admin-only route component
function AdminRoute({ children }) {
  const user = getCurrentUser();
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/map" />;
  }
  return children;
}

function App() {
  return (
    <Router>
      {/* PWA Components */}
      <OfflineIndicator />
      <InstallPrompt />
      
      {/* Feedback button for authenticated users */}
      {isAuthenticated() && <FeedbackButton />}
      
      {/* Performance monitor (dev only) */}
      <PerformanceMonitor />
      
      {/* Debug info (dev only) */}
      <DebugInfo />
      
      <Routes>
        {/* Public routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        
        {/* PUBLIC ROUTES - No login required for Triton Theft Map */}
        {/* Map is now public - core feature of zero-friction design */}
        <Route path="/map" element={<MapPage />} />
        <Route path="/" element={<MapPage />} />
        
        {/* Quick theft reporting - no login required */}
        <Route path="/report-theft" element={<ReportTheftPage />} />
        
        {/* Protected routes - optional features */}
        <Route 
          path="/report-parking" 
          element={
            <ProtectedRoute>
              <ReportParkingPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/parking-dashboard" 
          element={
            <ProtectedRoute>
              <ParkingDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/add-spot" 
          element={
            <AdminRoute>
              <AddSpotPage />
            </AdminRoute>
          } 
        />
        
        {/* Fallback - show map instead of login */}
        <Route path="*" element={<Navigate to="/map" />} />
      </Routes>
    </Router>
  );
}

export default App;
