import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Calendar, User, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [adminStats, setAdminStats] = useState(null);

    useEffect(() => {
        if (user?.role !== 'ADMIN') {
            setAdminStats(null);
            return;
        }

        const fetchAdminStats = async () => {
            try {
                const res = await api.get('/admin/dashboard');
                setAdminStats(res.data);
            } catch (err) {
                console.error('Navbar stats fetch failed:', err);
            }
        };

        fetchAdminStats();
        const interval = setInterval(fetchAdminStats, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const totalRequests = adminStats ? (adminStats.pendingEvents + adminStats.editRequestsCount) : 0;

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl">
                    <Calendar className="w-8 h-8" />
                    <span>EventHub</span>
                </Link>

                <div className="hidden md:flex items-center gap-4">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/events"
                        className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                    >
                        Events
                    </NavLink>
                    {user && (
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) => `nav-link relative pr-4 ${isActive ? 'nav-link-active' : ''}`}
                        >
                            Dashboard
                            {user.role === 'ADMIN' && totalRequests > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white animate-bounce">
                                    {totalRequests}
                                </span>
                            )}
                        </NavLink>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link to="/profile" className="flex items-center gap-2 text-slate-900 font-semibold bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors">
                                <User className="w-4 h-4 text-primary-600" />
                                <span>{user.name}</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-red-500 transition-colors p-2"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="flex items-center gap-2 text-slate-600 hover:text-primary-600 font-medium px-4 py-2">
                                <LogIn className="w-5 h-5" />
                                <span>Login</span>
                            </Link>
                            <Link to="/register" className="btn-primary">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
