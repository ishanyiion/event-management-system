import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Calendar, Banknote, Clock, CheckCircle, XCircle, Trash, BadgeCheck, Eye } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { getEventImage, formatEventImage } from '../utils/eventImages';
import { showConfirm, showSuccess, showError } from '../utils/swalHelper';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [items, setItems] = useState([]);
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('MANAGED'); // 'MANAGED' or 'BOOKED'

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            setLoading(true);
            try {
                if (user.role === 'ADMIN') {
                    // Fetch each independently so one failure doesn't block the rest
                    api.get('/admin/dashboard').then(res => setStats(res.data)).catch(console.error);
                    api.get('/admin/events/pending').then(res => setItems(prev => ({ ...prev, pending: res.data }))).catch(console.error);
                    api.get('/admin/events/approved').then(res => setItems(prev => ({ ...prev, approved: res.data }))).catch(console.error);
                    api.get('/events/edit-requests').then(res => setRequests(res.data)).catch(console.error);
                    api.get('/admin/users').then(res => setUsers(res.data)).catch(console.error);
                } else if (user.role === 'ORGANIZER') {
                    api.get('/events/my').then(res => setItems(res.data)).catch(console.error);
                }

                // Always fetch personal bookings
                api.get('/bookings/my').then(res => {
                    setMyBookings(res.data);
                    if (user.role === 'CLIENT') setItems(res.data);
                }).catch(console.error);

            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                // Approximate loading state - in a real app each would have its own loader
                setTimeout(() => setLoading(false), 500);
            }
        };
        fetchData();
    }, [user]);

    // Refresh data when switching to specific views for Admins
    useEffect(() => {
        if (user?.role === 'ADMIN') {
            if (view === 'REQUESTS') {
                api.get('/events/edit-requests').then(res => setRequests(res.data)).catch(console.error);
                api.get('/admin/dashboard').then(res => setStats(res.data)).catch(console.error);
            } else if (view === 'USERS') {
                api.get('/admin/users').then(res => setUsers(res.data)).catch(console.error);
            } else if (view === 'MANAGED') {
                api.get('/admin/events/pending').then(res => setItems(prev => ({ ...prev, pending: res.data }))).catch(console.error);
                api.get('/admin/events/approved').then(res => setItems(prev => ({ ...prev, approved: res.data }))).catch(console.error);
            }
        }
    }, [view, user?.role]);

    if (loading) return <div>Loading dashboard...</div>;

    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    const handleRemoveBooking = async (id) => {
        const result = await showConfirm('Remove Booking?', 'Are you sure you want to remove this booking request?');
        if (result.isConfirmed) {
            try {
                await api.delete(`/bookings/${id}`);
                setMyBookings(myBookings.filter(item => item.id !== id));
                if (user.role === 'CLIENT') setItems(items.filter(item => item.id !== id));
                showSuccess('Removed', 'Booking request has been removed.');
            } catch (err) {
                showError('Error', err.response?.data?.message || 'Failed to remove booking');
            }
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        const action = currentStatus === 'ACTIVE' ? 'Block' : 'Unblock';

        const result = await showConfirm(
            `${action} User?`,
            `Are you sure you want to ${action.toLowerCase()} this user?`
        );

        if (result.isConfirmed) {
            try {
                const res = await api.put(`/admin/users/status/${userId}`, { status: newStatus });
                setUsers(users.map(u => u.id === userId ? res.data : u));
                showSuccess('Updated', `User has been ${newStatus.toLowerCase()} successfully.`);
            } catch (err) {
                showError('Error', err.response?.data?.message || `Failed to ${action.toLowerCase()} user`);
            }
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

    const clientBookings = (user.role === 'CLIENT' || view === 'BOOKED') ? myBookings : [];
    const unpaidBookings = clientBookings.filter(i => i.payment_status === 'UNPAID' && !isExpired(i.booked_date));
    const activeBookings = clientBookings.filter(i => i.payment_status === 'PAID' && !isExpired(i.booked_date));
    const expiredBookings = clientBookings.filter(i => isExpired(i.booked_date)).slice(0, 5);

    const isEventPast = (dateStr) => {
        if (!dateStr) return false;
        const end = new Date(dateStr);
        end.setHours(23, 59, 59, 999);
        return end < new Date();
    };

    const pendingApprovals = user.role === 'ADMIN' ? (items.pending || []) : (user.role === 'ORGANIZER' ? items.filter(e => e.status === 'PENDING') : []);
    const approvedEventsList = user.role === 'ADMIN' ? (items.approved || []) : (user.role === 'ORGANIZER' ? items.filter(e => e.status === 'APPROVED') : []);

    const activeEvents = user.role === 'ORGANIZER' ? approvedEventsList.filter(e => !isEventPast(e.end_date)) : approvedEventsList;
    const completedEvents = user.role === 'ORGANIZER' ? approvedEventsList.filter(e => isEventPast(e.end_date)) : [];

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-slate-900 capitalize">{user.role.toLowerCase()} Dashboard</h1>
                        {user.role === 'ADMIN' && <BadgeCheck className="w-8 h-8 text-blue-500 fill-blue-50" />}
                    </div>
                    <p className="text-slate-500">Welcome back, {user.name}!</p>
                </div>
                <div className="flex items-center gap-3">
                    {(user.role === 'ADMIN' || user.role === 'ORGANIZER') && (
                        <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner mr-2">
                            <button
                                onClick={() => setView('MANAGED')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'MANAGED' ? 'bg-white text-primary-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Managed Events
                                {user.role === 'ADMIN' && stats?.pendingEvents > 0 && (
                                    <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg text-[10px] font-black">
                                        {stats.pendingEvents}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setView('BOOKED')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'BOOKED' ? 'bg-white text-primary-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                My Bookings
                            </button>
                            {user.role === 'ADMIN' && (
                                <>
                                    <button
                                        onClick={() => setView('REQUESTS')}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'REQUESTS' ? 'bg-white text-primary-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Requests
                                        {(stats?.editRequestsCount > 0 || requests.length > 0) && (
                                            <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg text-[10px] font-black">
                                                {stats?.editRequestsCount || requests.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setView('USERS')}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'USERS' ? 'bg-white text-primary-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Users
                                    </button>
                                    <button
                                        onClick={() => navigate('/events')}
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
                                    >
                                        Events
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    {user.role === 'ORGANIZER' && view === 'MANAGED' && (
                        <Link to="/event/create" className="btn-primary flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Create Event
                        </Link>
                    )}
                </div>
            </header >

            <div className="space-y-12">
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary-500 pl-3">
                        {view === 'BOOKED' ? 'My Event Passes' :
                            view === 'USERS' ? 'User Management' :
                                view === 'REQUESTS' ? 'Event Edit Requests' :
                                    (user.role === 'ADMIN' ? 'Event Management' : user.role === 'ORGANIZER' ? 'My Events' : 'Upcoming Bookings')}
                    </h3>

                    <div className="space-y-4">
                        {view === 'REQUESTS' ? (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    {requests.map((item) => (
                                        <div key={item.id} className="card p-6 flex items-center justify-between hover:border-slate-300 transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-400">
                                                    <Calendar className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                                                    <p className="text-sm text-slate-500 font-medium">
                                                        {item.edit_permission === 'SUBMITTED' ? 'Changes submitted by:' : 'Requested by:'}
                                                        <span className="text-indigo-600 ml-1">@{item.organizer_name}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            {item.edit_permission === 'SUBMITTED' ? (
                                                <Link
                                                    to={`/admin/review-edit/${item.id}`}
                                                    className="px-6 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition-colors shadow-sm"
                                                >
                                                    Review Changes
                                                </Link>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">
                                                        Access Request
                                                    </span>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await api.put(`/events/grant-edit/${item.id}`);
                                                                setRequests(requests.filter(r => r.id !== item.id));
                                                                showSuccess('Granted', 'Access granted.');
                                                            } catch (err) {
                                                                showError('Error', 'Failed to grant access');
                                                            }
                                                        }}
                                                        className="px-6 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors shadow-sm"
                                                    >
                                                        Grant Access
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {requests.length === 0 && (
                                        <div className="card p-12 text-center text-slate-400 bg-slate-50 border-dashed border-2">
                                            <p className="text-lg font-medium">All clear!</p>
                                            <p className="text-sm">There are no pending edit requests at the moment.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) :
                            view === 'USERS' ? (
                                <div className="space-y-12">
                                    <div className="space-y-6 text-left">
                                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-primary-500" /> Platform Organizers
                                        </h3>
                                        <div className="card bg-white shadow-sm overflow-hidden border-none">
                                            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-100">
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Organizer</th>
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {users.filter(u => u.role === 'ORGANIZER').map((u) => (
                                                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div>
                                                                        <p className="font-bold text-slate-900">{u.name}</p>
                                                                        <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <StatusBadge status={u.status} />
                                                                </td>
                                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                                    <Link
                                                                        to={`/admin/user/${u.id}`}
                                                                        className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
                                                                    >
                                                                        <Eye className="w-4 h-4" /> View
                                                                    </Link>
                                                                    {u.id !== user.id && (
                                                                        <button
                                                                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                                                                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${u.status === 'ACTIVE'
                                                                                ? 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-100'
                                                                                : 'text-green-600 bg-green-50 hover:bg-green-100 border border-green-100'
                                                                                }`}
                                                                        >
                                                                            {u.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {users.filter(u => u.role === 'ORGANIZER').length === 0 && (
                                                            <tr>
                                                                <td colSpan="3" className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">No organizers found.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 text-left">
                                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-slate-400" /> Platform Clients
                                        </h3>
                                        <div className="card bg-white shadow-sm overflow-hidden border-none text-left">
                                            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-100">
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {users.filter(u => u.role === 'CLIENT').map((u) => (
                                                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div>
                                                                        <p className="font-bold text-slate-900">{u.name}</p>
                                                                        <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <StatusBadge status={u.status} />
                                                                </td>
                                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                                    <Link
                                                                        to={`/admin/user/${u.id}`}
                                                                        className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
                                                                    >
                                                                        <Eye className="w-4 h-4" /> View
                                                                    </Link>
                                                                    {u.id !== user.id && (
                                                                        <button
                                                                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                                                                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${u.status === 'ACTIVE'
                                                                                ? 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-100'
                                                                                : 'text-green-600 bg-green-50 hover:bg-green-100 border border-green-100'
                                                                                }`}
                                                                        >
                                                                            {u.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {users.filter(u => u.role === 'CLIENT').length === 0 && (
                                                            <tr>
                                                                <td colSpan="3" className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">No clients found.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : view === 'BOOKED' || user.role === 'CLIENT' ? (
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
                            ) : user.role === 'ADMIN' ? (
                                <div className="space-y-12">
                                    {pendingApprovals.length > 0 && (
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-amber-500" /> Pending Approvals
                                            </h3>
                                            <div className="space-y-4">
                                                {pendingApprovals.map((item) => (
                                                    <div key={item.id} className="relative group">
                                                        <Link
                                                            to={`/admin/review-edit/${item.id}`}
                                                            className="card p-6 flex items-center justify-between hover:border-amber-300 hover:shadow-lg transition-all border-2 border-transparent bg-white shadow-sm"
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
                                                                    <p className="text-sm text-slate-500">By: {item.organizer_name}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="px-6 py-2 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-100 transition-all shadow-sm">
                                                                    Review & Approve
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" /> Approved Events
                                        </h3>
                                        <div className="space-y-4">
                                            {approvedEventsList.length === 0 ? (
                                                <div className="card p-12 text-center text-slate-400">No approved events.</div>
                                            ) : (
                                                approvedEventsList.map((item) => (
                                                    <Link
                                                        key={item.id}
                                                        to={`/event/analytics/${item.id}`}
                                                        className="card p-6 flex items-center justify-between hover:border-primary-300 hover:shadow-lg transition-all border-2 border-transparent group bg-white shadow-sm"
                                                    >
                                                        <>
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
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.preventDefault(); // Prevent navigation
                                                                        e.stopPropagation(); // Stop bubbling to Link
                                                                        const result = await showConfirm('Delete Event?', `Are you sure you want to delete "${item.title}"? This action cannot be undone.`);
                                                                        if (result.isConfirmed) {
                                                                            try {
                                                                                await api.delete(`/events/${item.id}`);
                                                                                setItems(prev => ({
                                                                                    ...prev,
                                                                                    approved: prev.approved.filter(e => e.id !== item.id)
                                                                                }));
                                                                                showSuccess('Deleted', 'Event has been deleted successfully.');
                                                                            } catch (err) {
                                                                                showError('Error', err.response?.data?.message || 'Failed to delete');
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="p-2 ml-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                    title="Delete Event"
                                                                >
                                                                    <Trash className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </>
                                                    </Link>
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
                                                    <OrganizerEventCard key={item.id} item={item} items={items} setItems={setItems} navigate={navigate} />
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" /> Active Events
                                        </h3>
                                        <div className="space-y-4">
                                            {activeEvents.length === 0 ? (
                                                <div className="card p-12 text-center text-slate-400 bg-slate-50 border-2 border-transparent">No active events.</div>
                                            ) : (
                                                activeEvents.map((item) => (
                                                    <OrganizerEventCard key={item.id} item={item} items={items} setItems={setItems} navigate={navigate} />
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {completedEvents.length > 0 && (
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-bold text-slate-400 flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5 text-slate-300" /> Completed Events
                                            </h3>
                                            <div className="space-y-4 opacity-75 grayscale-[0.3] hover:grayscale-0 transition-all">
                                                {completedEvents.map((item) => (
                                                    <OrganizerEventCard key={item.id} item={item} items={items} setItems={setItems} navigate={navigate} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>
                </div>

                {
                    (user.role === 'CLIENT' || view === 'BOOKED') && expiredBookings.length > 0 && (
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
                    )
                }
            </div>
        </div >
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
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove Request"
                    >
                        <Trash className="w-5 h-5" />
                    </button>
                )}
                <StatusBadge status={expired ? 'ENDED' : (item.payment_status === 'PAID' ? 'PAID' : (item.status || item.booking_status))} />
            </div>
        </Link>
    );
};


const StatusBadge = ({ status }) => {
    const styles = {
        APPROVED: 'bg-green-100 text-green-700',
        CONFIRMED: 'bg-green-100 text-green-700',
        PENDING: 'bg-amber-100 text-amber-700',
        REJECTED: 'bg-red-100 text-red-700',
        CANCELLED: 'bg-slate-100 text-slate-700',
        ENDED: 'bg-slate-200 text-slate-500',
        UNPAID: 'bg-amber-100 text-amber-700',
        PAID: 'bg-green-500 text-white shadow-green-200 shadow-md', // Highlighted style for PAID
        ACTIVE: 'bg-green-100 text-green-700',
        BLOCKED: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${styles[status] || 'bg-slate-100'}`}>
            {status}
        </span>
    );
};

const OrganizerEventCard = ({ item, items, setItems, navigate }) => {
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
                    {item.status === 'APPROVED' && (
                        <>
                            {item.edit_permission === 'SUBMITTED' ? (
                                <button
                                    disabled
                                    className="px-4 py-2 text-xs font-bold text-blue-400 bg-blue-50 rounded-xl border border-blue-100 cursor-not-allowed"
                                >
                                    Review Pending
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        navigate(`/edit-event/${item.id}`);
                                    }}
                                    className="px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-100 shadow-sm transition-all hover:scale-105"
                                >
                                    Propose Edits
                                </button>
                            )}
                        </>
                    )}
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const result = await showConfirm('Delete Event?', 'Are you sure you want to delete this event? This action cannot be undone.');
                            if (result.isConfirmed) {
                                try {
                                    await api.delete(`/events/${item.id}`);
                                    setItems(items.filter(i => i.id !== item.id));
                                    showSuccess('Deleted', 'Event has been deleted successfully.');
                                } catch (err) {
                                    showError('Delete Failed', err.response?.data?.message || 'Failed to delete event.');
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
