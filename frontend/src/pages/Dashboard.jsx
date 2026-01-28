import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Calendar, Banknote, ShieldCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { getEventImage, formatEventImage } from '../utils/eventImages';

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
                    const sorted = res.data.sort((a, b) => new Date(b.booked_date) - new Date(a.booked_date));
                    setItems(sorted);
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

    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    const isExpired = (date) => new Date(date) < new Date().setHours(0, 0, 0, 0);

    const activeBookings = user.role === 'CLIENT' ? items.filter(i => !isExpired(i.booked_date)) : [];
    const expiredBookings = user.role === 'CLIENT' ? items.filter(i => isExpired(i.booked_date)).slice(0, 5) : [];

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
                <div className="lg:col-span-2 space-y-12">
                    {/* Section 1: Active/Main Items */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary-500 pl-3">
                            {user.role === 'ADMIN' ? 'Pending Approvals' : user.role === 'ORGANIZER' ? 'My Events' : 'Upcoming Bookings'}
                        </h3>

                        <div className="space-y-4">
                            {user.role === 'CLIENT' ? (
                                activeBookings.length === 0 ? (
                                    <div className="card p-12 text-center text-slate-400 bg-slate-50/50 border-dashed">No upcoming bookings.</div>
                                ) : (
                                    activeBookings.map((item) => (
                                        <BookingCard key={item.id} item={item} navigate={navigate} />
                                    ))
                                )
                            ) : (
                                items.length === 0 ? (
                                    <div className="card p-12 text-center text-slate-400">No items found.</div>
                                ) : (
                                    items.map((item) => (
                                        <div key={item.id} className="card p-6 flex items-center justify-between hover:border-slate-300 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-slate-400">
                                                    <img
                                                        src={formatEventImage(item.banner_url) || getEventImage(item.category_name, item.title || item.event_title)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => handleImageError(e, item.category_name, item.title || item.event_title)}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{item.title || item.event_title}</h4>
                                                    <p className="text-sm text-slate-500 line-clamp-1">
                                                        {`Location: ${item.city}`}
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
                                )
                            )}
                        </div>
                    </div>

                    {/* Section 2: Recent History (Client Only) */}
                    {user.role === 'CLIENT' && expiredBookings.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-400 border-l-4 border-slate-300 pl-3">
                                Recent History
                            </h3>
                            <div className="space-y-4 opacity-75 grayscale-[0.5] hover:grayscale-0 transition-all">
                                {expiredBookings.map((item) => (
                                    <BookingCard key={item.id} item={item} navigate={navigate} expired />
                                ))}
                            </div>
                        </div>
                    )}
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

const BookingCard = ({ item, navigate, expired }) => {
    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    return (
        <Link
            to={`/booking/view/${item.id}`}
            className={`card p-6 flex items-center justify-between transition-all border-2 ${expired
                ? 'opacity-80 grayscale-[0.3] hover:grayscale-0 hover:opacity-100 border-slate-100 hover:border-slate-300'
                : 'hover:border-primary-300 hover:shadow-lg border-transparent'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center ${expired ? 'bg-slate-200' : 'bg-slate-100'}`}>
                    <img
                        src={formatEventImage(item.banner_url) || getEventImage(item.category_name, item.title || item.event_title)}
                        alt=""
                        className={`w-full h-full object-cover ${expired ? 'opacity-50' : ''}`}
                        onError={(e) => handleImageError(e, item.category_name, item.title || item.event_title)}
                    />
                </div>
                <div>
                    <h4 className={`font-bold ${expired ? 'text-slate-500' : 'text-slate-900'}`}>{item.title || item.event_title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1">
                        <span className={`font-bold mr-2 ${expired ? 'text-slate-400' : 'text-primary-600'}`}>
                            {item.booked_date ? new Date(item.booked_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                        </span>
                        <span className={expired ? 'text-slate-400' : ''}>
                            Packages: {item.package_summary || 'N/A'}
                        </span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <StatusBadge status={expired ? 'ENDED' : (item.status || item.booking_status)} />
                {item.booking_status === 'PENDING' && !expired && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/booking/confirm/${item.id}`);
                        }}
                        className="px-4 py-2 text-sm font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-all border border-green-100"
                    >
                        Pay Now
                    </button>
                )}
            </div>
        </Link>
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
        ENDED: 'bg-slate-200 text-slate-500 border border-slate-300',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${styles[status] || 'bg-slate-100'}`}>
            {status}
        </span>
    );
};

export default Dashboard;
