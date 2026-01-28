import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/event/CreateEvent';
import EventGrid from './components/events/EventGrid';
import ConfirmPayment from './pages/booking/ConfirmPayment';
import BookingView from './pages/booking/BookingView';
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
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<EventGrid />} />
              <Route path="/event/:id" element={<EventDetails />} />
              <Route path="/event/create" element={<CreateEvent />} />
              <Route path="/booking/confirm/:bookingId" element={<ConfirmPayment />} />
              <Route path="/booking/view/:id" element={<BookingView />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
