import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import RegisterPage from './pages/auth/RegisterPage';
import Profile from './pages/auth/Profile';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/event/CreateEvent';
import EventGrid from './components/events/EventGrid';
import ConfirmPayment from './pages/booking/ConfirmPayment';
import BookingView from './pages/booking/BookingView';
import AdminUserDetails from './pages/admin/AdminUserDetails';
import EventAnalytics from './pages/EventAnalytics';
import ReviewEdit from './pages/admin/ReviewEdit';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<EventGrid />} />
              <Route path="/event/:id" element={<EventDetails />} />
              <Route path="/event/create" element={<CreateEvent />} />
              <Route path="/event/analytics/:id" element={<EventAnalytics />} />
              <Route path="/edit-event/:id" element={<CreateEvent />} />
              <Route path="/booking/confirm/:bookingId" element={<ConfirmPayment />} />
              <Route path="/booking/view/:id" element={<BookingView />} />
              <Route path="/admin/user/:id" element={<AdminUserDetails />} />
              <Route path="/admin/review-edit/:id" element={<ReviewEdit />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
