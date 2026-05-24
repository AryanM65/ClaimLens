import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import Contact from './pages/Contact';
import Community from './pages/Community';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AboutUs from './pages/AboutUs';
import Analyze from './pages/Analyze';
import RegisterOrganization from './pages/RegisterOrganization';
import OrganizationDashboard from './pages/OrganizationDashboard';
import { useAuth } from './context/AuthContext';

// Protects guest-only pages (e.g. login, signup, home landing pages for guests)
const GuestRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'organization') return <Navigate to="/organization-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Protects authenticated routes by role list
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'organization') return <Navigate to="/organization-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background text-on-background">
        <Navbar />
        <main className="flex-grow pt-20"> {/* pt-20 to account for fixed navbar */}
          <Routes>
            <Route path="/" element={<GuestRoute><Home /></GuestRoute>} />
            <Route path="/how-it-works" element={<GuestRoute><Home /></GuestRoute>} />
            <Route path="/features" element={<GuestRoute><Home /></GuestRoute>} />
            <Route path="/community" element={<Community />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user']}><Dashboard /></ProtectedRoute>} />
            <Route path="/analyze" element={<ProtectedRoute allowedRoles={['user']}><Analyze /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute allowedRoles={['user', 'admin', 'organization']}><Report /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['user', 'admin', 'organization']}><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/register-organization" element={<ProtectedRoute allowedRoles={['user']}><RegisterOrganization /></ProtectedRoute>} />
            <Route path="/organization-dashboard" element={<ProtectedRoute allowedRoles={['organization']}><OrganizationDashboard /></ProtectedRoute>} />
            <Route path="/about" element={<AboutUs />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
