import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeContextProvider } from './context/ThemeContext';
import DashboardLayout from './layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VendorsManagement from './pages/VendorsManagement';
import CustomersManagement from './pages/CustomersManagement';
import BookingsManagement from './pages/BookingsManagement';
import Settlements from './pages/Settlements';
import Disputes from './pages/Disputes';
import VendorDetails from './pages/VendorDetails';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0E1A',
        color: '#F1F5F9',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #7C5CFC 0%, #00D9A6 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#fff',
            marginBottom: 16,
            animation: 'spin 2s linear infinite',
          }}>
            J
          </div>
          <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? <Navigate to="/" /> : children;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeContextProvider>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/vendors" element={<VendorsManagement />} />
              <Route path="/vendors/:vendorId" element={<VendorDetails />} />
              <Route path="/customers" element={<CustomersManagement />} />
              <Route path="/bookings" element={<BookingsManagement />} />
              <Route path="/settlements" element={<Settlements />} />
              <Route path="/disputes" element={<Disputes />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </ThemeContextProvider>
    </BrowserRouter>
  );
}

export default App;
