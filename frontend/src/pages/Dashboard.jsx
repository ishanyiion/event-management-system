import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Calendar, Banknote, ShieldCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user.role === 'ADMIN') {
                    const s = await api.get('/admin/dashboard');
                    setStats(s.data);
                    const p = await api.get('/admin/events/pending');
                    setItems(p.data);
                } else if (user.role === 'ORGANIZER') {
                    // Implement organizer specific stats/events fetch if needed
                    // For now showing a placeholder or list of own events
                    const res = await api.get('/events'); // Needs filtering for own events in real app
                    setItems(res.data.filter(e => e.organizer_id === user.id));
                } else {
                    const res = await api.get('/bookings/my');
                    setItems(res.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 capitalize">{user.role.toLowerCase()} Dashboard</h1>
                    <p className="text-slate-500">Welcome back, {user.name}!</p>
                </div>
                {user.role === 'ORGANIZER' && (
                    <Link to="/event/create" className="btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Create Event
                    </Link>
                )}
            </header>

            {/* Stats Cards */}
            {user.role === 'ADMIN' && stats && (
                <div className="grid md:grid-cols-4 gap-6">
                    <StatCard icon={<Users />} label="Total Users" value={stats.totalUsers} color="bg-blue-500" />
                    <StatCard icon={<Calendar />} label="Total Events" value={stats.totalEvents} color="bg-purple-500" />
                    <StatCard icon={<Banknote />} label="Total Revenue" value={`₹${stats.totalRevenue}`} color="bg-green-500" />
                    <StatCard icon={<Clock />} label="Pending" value={stats.pendingEvents} color="bg-amber-500" />
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary-500 pl-3">
                        {user.role === 'ADMIN' ? 'Pending Approvals' : user.role === 'ORGANIZER' ? 'My Events' : 'My Bookings'}
                    </h3>

                    <div className="space-y-4">
                        {items.length === 0 ? (
                            <div className="card p-12 text-center text-slate-400">No items found.</div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="card p-6 flex items-center justify-between hover:border-slate-300 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{item.title || item.event_title}</h4>
                                            <p className="text-sm text-slate-500 line-clamp-1">
                                                {user.role === 'CLIENT' ? `Packages: ${item.package_summary || 'N/A'}` : `Location: ${item.city}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <StatusBadge status={item.status || item.booking_status} />
                                        {user.role === 'ADMIN' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await api.put(`/events/approve/${item.id}`);
                                                            setItems(items.filter(i => i.id !== item.id));
                                                        } catch (err) {
                                                            alert(err.response?.data?.message || 'Failed to approve event');
                                                        }
                                                    }}
                                                    className="px-4 py-2 text-sm font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-all border border-green-100"
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Are you sure you want to remove this event?')) {
                                                            try {
                                                                await api.delete(`/events/${item.id}`);
                                                                setItems(items.filter(i => i.id !== item.id));
                                                            } catch (err) {
                                                                alert(err.response?.data?.message || 'Failed to remove event');
                                                            }
                                                        }
                                                    }}
                                                    className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                        {user.role === 'CLIENT' && (item.status === 'PENDING' || item.booking_status === 'PENDING') && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/booking/confirm/${item.id}`)}
                                                    className="px-4 py-2 text-sm font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-all border border-green-100"
                                                >
                                                    Pay Now
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Are you sure you want to cancel this booking?')) {
                                                            try {
                                                                await api.delete(`/bookings/${item.id}`);
                                                                setItems(items.filter(i => i.id !== item.id));
                                                            } catch (err) {
                                                                alert(err.response?.data?.message || 'Failed to cancel booking');
                                                            }
                                                        }
                                                    }}
                                                    className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100"
                                                >
                                                    Cancel Booking
                                                </button>
                                            </div>
                                        )}
                                        {user.role === 'ORGANIZER' && (
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Are you sure you want to remove this event? This action cannot be undone.')) {
                                                        try {
                                                            await api.delete(`/events/${item.id}`);
                                                            setItems(items.filter(i => i.id !== item.id));
                                                        } catch (err) {
                                                            alert(err.response?.data?.message || 'Failed to remove event');
                                                        }
                                                    }
                                                }}
                                                className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100"
                                            >
                                                Remove Event
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar / Quick Actions */}
                <div className="space-y-6">
                    <div className="card p-6 bg-primary-600 text-white space-y-4">
                        <ShieldCheck className="w-10 h-10 opacity-50" />
                        <h4 className="text-xl font-bold font-primary">Account Status</h4>
                        <p className="text-primary-100 text-sm">
                            Your account is verified and you have full access to the {user.role.toLowerCase()} features.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="card p-6 flex items-center gap-4">
        <div className={`p-3 rounded-2xl text-white ${color} shadow-lg`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{value}</h3>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        APPROVED: 'bg-green-100 text-green-700',
        CONFIRMED: 'bg-green-100 text-green-700',
        PENDING: 'bg-amber-100 text-amber-700',
        REJECTED: 'bg-red-100 text-red-700',
        CANCELLED: 'bg-slate-100 text-slate-700',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${styles[status] || 'bg-slate-100'}`}>
            {status}
        </span>
    );
};

export default Dashboard;
