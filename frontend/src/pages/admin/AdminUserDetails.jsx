import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { User, Mail, Phone, Calendar, Clock, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { getEventImage, formatEventImage } from '../../utils/eventImages';
import { showConfirm, showSuccess, showError } from '../../utils/swalHelper';

const AdminUserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]); // For Organizers
    const [bookings, setBookings] = useState([]); // For Clients
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get(`/admin/users/${id}`);
                setUser(userRes.data);

                if (userRes.data.role === 'ORGANIZER') {
                    const eventRes = await api.get(`/admin/users/${id}/events`);
                    setEvents(eventRes.data);
                } else if (userRes.data.role === 'CLIENT') {
                    const bookingRes = await api.get(`/admin/users/${id}/bookings`);
                    setBookings(bookingRes.data);
                }
            } catch (err) {
                console.error(err);
                showError('Error', 'Failed to fetch user details');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading user profile...</div>;
    if (!user) return <div className="p-8 text-center text-red-500">User not found</div>;

    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <button
                onClick={() => navigate('/dashboard', { state: { view: 'USERS' } })}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold"
            >
                <ArrowLeft className="w-5 h-5" /> Back to Users
            </button>

            {/* User Profile Header */}
            <div className="card p-8 bg-white shadow-lg border-t-4 border-primary-500">
                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <User className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
                            <div className="flex flex-col sm:flex-row gap-4 mt-2 text-slate-500 text-sm font-medium">
                                <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</span>
                                {user.mobile && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {user.mobile}</span>}
                                <span className="flex items-center gap-1">
                                    <Shield className="w-4 h-4 text-purple-500" />
                                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{user.role}</span>
                                </span>
                                <span className={`flex items-center gap-1 uppercase font-bold text-xs px-2 py-0.5 rounded ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {user.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Based on Role */}
            {user.role === 'ORGANIZER' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-primary-500" /> Created Events ({events.length})
                    </h2>

                    {events.length === 0 ? (
                        <div className="card p-12 text-center text-slate-400 bg-slate-50 border-dashed border-2">
                            No events created by this organizer.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map((item) => (
                                <Link
                                    to={`/event/analytics/${item.id}`}
                                    key={item.id}
                                    className="card bg-white shadow-sm hover:shadow-md transition-shadow group overflow-hidden border border-slate-100"
                                >
                                    <div className="h-40 bg-slate-200 overflow-hidden relative">
                                        <img
                                            src={formatEventImage(item.banner_url) || getEventImage(item.category_name, item.title)}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => handleImageError(e, item.category_name, item.title)}
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                item.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">{item.title}</h3>
                                        <div className="flex justify-between items-center mt-3 text-xs text-slate-500 font-medium uppercase tracking-wider">
                                            <span>{item.city}</span>
                                            <span>{new Date(item.start_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {user.role === 'CLIENT' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-500" /> Booking History ({bookings.length})
                    </h2>

                    {bookings.length === 0 ? (
                        <div className="card p-12 text-center text-slate-400 bg-slate-50 border-dashed border-2">
                            No bookings found for this client.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map((item) => (
                                <div key={item.id} className="card p-4 sm:p-6 bg-white shadow-sm hover:shadow transition-shadow border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                            <img
                                                src={formatEventImage(item.banner_url) || getEventImage(item.category_name, item.event_title)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => handleImageError(e, item.category_name, item.event_title)}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{item.event_title}</h3>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-bold uppercase tracking-wide">
                                                <span>Booked: {new Date(item.created_at).toLocaleDateString()}</span>
                                                <span>Amt: ₹{item.total_price}</span>
                                                <span className={`${item.payment_status === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {item.payment_status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.booking_status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                            item.booking_status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                            {item.booking_status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminUserDetails;
