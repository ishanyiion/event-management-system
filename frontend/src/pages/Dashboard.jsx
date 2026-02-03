import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Calendar, Banknote, ShieldCheck, Clock, CheckCircle, XCircle, Trash } from 'lucide-react';
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
                    const a = await api.get('/admin/events/approved');
                    setItems({ pending: p.data, approved: a.data });
                } else if (user.role === 'ORGANIZER') {
                    const res = await api.get('/events/my');
                    setItems(res.data);
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

    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    const handleRemoveBooking = async (id) => {
        if (!window.confirm('Are you sure you want to remove this booking request?')) return;
        try {
            await api.delete(`/bookings/${id}`);
            setItems(items.filter(item => item.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove booking');
        }
    };

    const isExpired = (dateStr) => {
        if (!dateStr) return false;
        const dates = dateStr.split(',');
        // Get the last date and set it to the END of that day (23:59:59)
        const parts = dates[dates.length - 1].split('-');
        const lastDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59);
        return lastDate < new Date();
    };

    const unpaidBookings = user.role === 'CLIENT' ? items.filter(i => i.payment_status === 'UNPAID' && !isExpired(i.booked_date)) : [];
    const activeBookings = user.role === 'CLIENT' ? items.filter(i => i.payment_status === 'PAID' && !isExpired(i.booked_date)) : [];
    const expiredBookings = user.role === 'CLIENT' ? items.filter(i => isExpired(i.booked_date)).slice(0, 5) : [];

    const pendingApprovals = user.role === 'ADMIN' ? (items.pending || []) : (user.role === 'ORGANIZER' ? items.filter(e => e.status === 'PENDING') : []);
    const approvedEvents = user.role === 'ADMIN' ? (items.approved || []) : (user.role === 'ORGANIZER' ? items.filter(e => e.status === 'APPROVED') : []);

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

            {user.role === 'ADMIN' && stats && (
                <div className="grid md:grid-cols-4 gap-6">
                    <StatCard icon={<Users />} label="Total Users" value={stats.totalUsers} color="bg-blue-500" />
                    <StatCard icon={<Calendar />} label="Total Events" value={stats.totalEvents} color="bg-purple-500" />
                    <StatCard icon={<Banknote />} label="Total Revenue" value={`₹${stats.totalRevenue}`} color="bg-green-500" />
                    <StatCard icon={<Clock />} label="Pending" value={stats.pendingEvents} color="bg-amber-500" />
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-12">
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary-500 pl-3">
                            {user.role === 'ADMIN' ? 'Event Management' : user.role === 'ORGANIZER' ? 'My Events' : 'Upcoming Bookings'}
                        </h3>

                        <div className="space-y-4">
                            {user.role === 'ADMIN' ? (
                                <div className="space-y-12">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-amber-500" /> Pending Approvals
                                        </h3>
                                        <div className="space-y-4">
                                            {pendingApprovals.length === 0 ? (
                                                <div className="card p-12 text-center text-slate-400 bg-slate-50 border-dashed border-2">No events pending approval.</div>
                                            ) : (
                                                pendingApprovals.map((item) => (
                                                    <div key={item.id} className="card p-6 flex items-center justify-between hover:border-slate-300 transition-all shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-slate-400">
                                                                <img
                                                                    src={formatEventImage(item.banner_url) || getEventImage(item.category_name, item.title)}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => handleImageError(e, item.category_name, item.title)}
                                                                />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-900">{item.title}</h4>
                                                                <p className="text-sm text-slate-500">By: {item.organizer_name}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await api.put(`/events/approve/${item.id}`);
                                                                    const p = await api.get('/admin/events/pending');
                                                                    const a = await api.get('/admin/events/approved');
                                                                    setItems({ pending: p.data, approved: a.data });
                                                                } catch (err) {
                                                                    alert(err.response?.data?.message || 'Failed to approve');
                                                                }
                                                            }}
                                                            className="px-6 py-2 text-sm font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-xl border border-green-100"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" /> Approved Events
                                        </h3>
                                        <div className="space-y-4">
                                            {approvedEvents.length === 0 ? (
                                                <div className="card p-12 text-center text-slate-400">No approved events.</div>
                                            ) : (
                                                approvedEvents.map((item) => (
                                                    <Link
                                                        key={item.id}
                                                        to={`/event/analytics/${item.id}`}
                                                        className="card p-6 flex items-center justify-between hover:border-primary-300 hover:shadow-lg transition-all border-2 border-transparent group bg-white shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-slate-400">
                                                                <img
                                                                    src={formatEventImage(item.banner_url) || getEventImage(item.category_name, item.title)}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => handleImageError(e, item.category_name, item.title)}
                                                                />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{item.title}</h4>
                                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{item.category_name} • {item.city}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-[10px] font-black bg-primary-50 text-primary-600 px-2 py-1 rounded-lg uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                                                View Stats
                                                            </div>
                                                            <StatusBadge status="APPROVED" />
                                                        </div>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : user.role === 'CLIENT' ? (
                                <div className="space-y-12">
                                    {unpaidBookings.length > 0 && (
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-amber-500" /> Pending Payments
                                            </h3>
                                            <div className="space-y-4">
                                                {unpaidBookings.map((item) => (
                                                    <BookingCard key={item.id} item={item} navigate={navigate} onRemove={() => handleRemoveBooking(item.id)} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-700">Upcoming Bookings</h3>
                                        <div className="space-y-4">
                                            {activeBookings.length === 0 && unpaidBookings.length === 0 ? (
                                                <div className="card p-12 text-center text-slate-400 bg-slate-50 border-dashed border-2">No upcoming bookings.</div>
                                            ) : activeBookings.length === 0 ? (
                                                <div className="card p-8 text-center text-slate-400 bg-slate-50 border-2 border-transparent">No confirmed bookings yet.</div>
                                            ) : (
                                                activeBookings.map((item) => (
                                                    <BookingCard key={item.id} item={item} navigate={navigate} />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-amber-500" /> Pending for Approval
                                        </h3>
                                        <div className="space-y-4">
                                            {pendingApprovals.length === 0 ? (
                                                <div className="card p-12 text-center text-slate-400 bg-slate-50 border-dashed border-2">No events pending approval.</div>
                                            ) : (
                                                pendingApprovals.map((item) => (
                                                    <OrganizerEventCard key={item.id} item={item} items={items} setItems={setItems} />
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" /> Active Events
                                        </h3>
                                        <div className="space-y-4">
                                            {approvedEvents.length === 0 ? (
                                                <div className="card p-12 text-center text-slate-400 bg-slate-50 border-2 border-transparent">No active events.</div>
                                            ) : (
                                                approvedEvents.map((item) => (
                                                    <OrganizerEventCard key={item.id} item={item} items={items} setItems={setItems} />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

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

                <div className="space-y-6">
                    <div className="card p-6 bg-primary-600 text-white space-y-4 shadow-xl border-none">
                        <ShieldCheck className="w-10 h-10 opacity-50" />
                        <h4 className="text-xl font-black uppercase tracking-tighter">Account Verified</h4>
                        <p className="text-primary-100 text-sm font-medium">
                            Your account has been verified. You have full administrative control.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BookingCard = ({ item, navigate, expired, onRemove }) => {
    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    return (
        <Link
            to={`/booking/view/${item.id}`}
            className={`card p-6 flex items-center justify-between transition-all border-2 shadow-sm ${expired
                ? 'opacity-80 border-slate-100'
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
                    <h4 className={`font-black uppercase tracking-tight ${expired ? 'text-slate-500' : 'text-slate-900'}`}>{item.title || item.event_title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1">
                        <span className={`font-black mr-2 ${expired ? 'text-slate-400' : 'text-primary-600'}`}>
                            {item.booked_date ?
                                item.booked_date.split(',').map(d => {
                                    const [y, m, day] = d.split('-');
                                    return `${day}/${m}/${y}`;
                                }).join(', ')
                                : 'N/A'}
                        </span>
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {onRemove && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onRemove();
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove Request"
                    >
                        <Trash className="w-5 h-5" />
                    </button>
                )}
                <StatusBadge status={expired ? 'ENDED' : (item.payment_status === 'UNPAID' ? 'UNPAID' : (item.status || item.booking_status))} />
            </div>
        </Link>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="card p-6 flex items-center gap-4 bg-white shadow-sm border-none">
        <div className={`p-3 rounded-2xl text-white ${color} shadow-lg`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h3>
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
        ENDED: 'bg-slate-200 text-slate-500',
        UNPAID: 'bg-amber-100 text-amber-700',
        PAID: 'bg-green-100 text-green-700',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${styles[status] || 'bg-slate-100'}`}>
            {status}
        </span>
    );
};

const OrganizerEventCard = ({ item, items, setItems }) => {
    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    return (
        <div key={item.id} className="relative group">
            <Link
                to={`/event/analytics/${item.id}`}
                className="card p-6 flex items-center justify-between hover:border-primary-300 hover:shadow-lg transition-all border-2 border-transparent bg-white shadow-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-slate-400">
                        <img
                            src={formatEventImage(item.banner_url) || getEventImage(item.category_name, item.title || item.event_title)}
                            alt=""
                            className="w-full h-full object-cover uppercase"
                            onError={(e) => handleImageError(e, item.category_name, item.title || item.event_title)}
                        />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                            {item.title || item.event_title}
                        </h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            {item.city}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <StatusBadge status={item.status || item.booking_status} />
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            if (window.confirm('Delete this event?')) {
                                try {
                                    await api.delete(`/events/${item.id}`);
                                    setItems(items.filter(i => i.id !== item.id));
                                } catch (err) {
                                    alert('Delete failed');
                                }
                            }
                        }}
                        className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 z-10"
                    >
                        Delete
                    </button>
                </div>
            </Link>
        </div>
    );
};

export default Dashboard;
