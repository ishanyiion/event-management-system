import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Check, ArrowRight, ShieldCheck, Info, Clock } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getEventImage, formatEventImage } from '../utils/eventImages';
import { formatTimeAMPM } from '../utils/formatTime';

const EventDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState({}); // { pkgId: qty }
    const [selectedDates, setSelectedDates] = useState([]); // Array of strings
    const [bookingLoading, setBookingLoading] = useState(false);
    const [activeImage, setActiveImage] = useState(null);

    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${id}`);
                setEvent(res.data);
                if (res.data.start_date) {
                    const localDate = new Date(res.data.start_date);
                    const dateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
                    setSelectedDates([dateStr]);
                }
                // Set initial active image
                const mainImg = formatEventImage(res.data.banner_url) || getEventImage(res.data.category_name, res.data.title);
                setActiveImage(mainImg);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    const handleBook = async () => {
        if (!user) return navigate('/login');
        if (user.role !== 'CLIENT') return alert('Only clients can book events.');

        const items = Object.entries(selectedItems)
            .filter(([_, qty]) => qty > 0)
            .map(([pkgId, qty]) => ({ package_id: parseInt(pkgId), qty }));

        if (items.length === 0) return alert('Please select at least one ticket.');
        if (selectedDates.length === 0) return alert('Please select at least one date.');

        setBookingLoading(true);
        try {
            const res = await api.post('/bookings', {
                event_id: event.id,
                items,
                booked_date: selectedDates // Send array of dates
            });
            navigate(`/booking/confirm/${res.data.id}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    const toggleDateSelection = (dateStr) => {
        const dateOnly = dateStr.split('T')[0];
        if (selectedDates.includes(dateOnly)) {
            // Only allow deselecting if there's more than one date
            if (selectedDates.length > 1) {
                setSelectedDates(selectedDates.filter(d => d !== dateOnly));
            } else {
                alert("Please select at least one date.");
            }
        } else {
            setSelectedDates([...selectedDates, dateOnly]);
        }
    };

    const updateQty = (pkgId, delta) => {
        const current = selectedItems[pkgId] || 0;
        const next = Math.max(0, current + delta);
        setSelectedItems({ ...selectedItems, [pkgId]: next });
    };

    const calculateTotal = () => {
        const packageTotal = event.packages.reduce((sum, pkg) => {
            const qty = selectedItems[pkg.id] || 0;
            return sum + (pkg.price * qty);
        }, 0);
        return packageTotal * selectedDates.length;
    };

    if (loading) return <div className="h-96 flex items-center justify-center">Loading...</div>;
    if (!event) return <div className="text-center py-20">Event not found</div>;

    return (
        <div className="space-y-12">
            <div className="grid lg:grid-cols-3 gap-12">
                {/* Left: Event Info (2 cols) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl bg-slate-100 group">
                            <img
                                src={activeImage}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => handleImageError(e, event.category_name, event.title)}
                            />
                            <div className="absolute top-6 left-6 flex gap-3">
                                <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-sm font-bold text-primary-600 shadow-md">
                                    {event.category_name}
                                </div>
                                {new Date(event.end_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) && (
                                    <div className="bg-amber-500/90 backdrop-blur px-4 py-2 rounded-2xl text-sm font-bold text-white shadow-md flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> COMPLETED EVENT
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Thumbnail Gallery */}
                        {event.images && event.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                {event.images.map((imgUrl, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(formatEventImage(imgUrl))}
                                        className={`relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all ${activeImage === formatEventImage(imgUrl) ? 'border-primary-500 scale-95 shadow-lg' : 'border-transparent hover:border-slate-200'
                                            }`}
                                    >
                                        <img
                                            src={formatEventImage(imgUrl)}
                                            className="w-full h-full object-cover"
                                            alt=""
                                            onError={(e) => handleImageError(e, event.category_name, event.title)}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">{event.title}</h1>
                        <div className="flex flex-wrap gap-6 text-slate-500 font-medium">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary-500" />
                                <span>{new Date(event.start_date).toLocaleDateString('en-GB')} to {new Date(event.end_date).toLocaleDateString('en-GB')}</span>
                            </div>
                            {event.schedule && event.schedule.length > 0 ? (
                                <div className="space-y-3 pt-2 w-full">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Full Schedule
                                    </h4>
                                    <div className="space-y-2">
                                        {event.schedule.map((day, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-primary-200 transition-colors">
                                                <span className="font-bold text-slate-700">
                                                    {new Date(day.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                                                </span>
                                                <span className="text-slate-600 font-medium">
                                                    {formatTimeAMPM(day.start_time)} - {formatTimeAMPM(day.end_time)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : event.start_time && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary-500" />
                                    <span>{formatTimeAMPM(event.start_time)} - {formatTimeAMPM(event.end_time)}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary-500" />
                                <span>{event.location}, {event.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary-500" />
                                <span>Max {event.max_capacity} Guests</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-8 bg-white border-none shadow-sm space-y-4">
                        <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary-500 pl-3">Description</h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{event.description}</p>
                    </div>
                </div>

                {/* Right: Booking Sidebar (1 col) */}
                <div className="space-y-8">
                    <div className="card p-8 sticky top-24 space-y-8 border-slate-200 bg-slate-50/50">
                        {/* Date Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary-500 pl-3">Select Date</h3>
                                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Multi-Select</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {event.schedule && event.schedule.length > 0 ? (
                                    event.schedule.map((day) => (
                                        <button
                                            key={day.event_date}
                                            onClick={() => toggleDateSelection(day.event_date)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${selectedDates.includes(day.event_date.split('T')[0])
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            {new Date(day.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                        </button>
                                    ))
                                ) : (
                                    // Automatic Date Generation if schedule is missing
                                    (() => {
                                        const dates = [];
                                        if (!event.start_date || !event.end_date) return null;
                                        const start = new Date(event.start_date);
                                        const end = new Date(event.end_date);
                                        let current = new Date(start);
                                        while (current <= end) {
                                            const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                                            dates.push(dateStr);
                                            current.setDate(current.getDate() + 1);
                                        }
                                        return dates.map(dateStr => (
                                            <button
                                                key={dateStr}
                                                onClick={() => toggleDateSelection(dateStr)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${selectedDates.includes(dateStr)
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                                    }`}
                                            >
                                                {new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </button>
                                        ));
                                    })()
                                )}
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900">Select Package</h3>

                        <div className="space-y-4">
                            {event.packages && event.packages.length > 0 ? (
                                event.packages.map((pkg) => {
                                    const qty = selectedItems[pkg.id] || 0;
                                    const soldQty = parseInt(pkg.sold_qty || 0);
                                    const capacity = parseInt(pkg.capacity || 0);
                                    const isSoldOut = capacity > 0 && soldQty >= capacity;
                                    const remaining = Math.max(0, capacity - soldQty);

                                    return (
                                        <div
                                            key={pkg.id}
                                            className={`p-5 rounded-2xl border-2 transition-all ${isSoldOut ? 'opacity-60 bg-slate-50 border-slate-200' :
                                                qty > 0 ? 'border-primary-500 bg-white shadow-lg' : 'border-slate-100 bg-white/50 hover:border-slate-200'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold uppercase tracking-wider ${isSoldOut ? 'text-slate-400' : qty > 0 ? 'text-primary-600' : 'text-slate-400'}`}>
                                                        {pkg.package_name}
                                                    </span>
                                                    {capacity > 0 && (
                                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${isSoldOut ? 'text-red-500' : 'text-slate-400'}`}>
                                                            {isSoldOut ? 'SOLD OUT' : `${remaining} Tickets Left`}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-xl font-extrabold ${isSoldOut ? 'text-slate-400' : 'text-slate-900'}`}>₹{pkg.price}</span>
                                            </div>
                                            <p className="text-slate-500 text-sm mb-4 whitespace-pre-line">{pkg.features}</p>

                                            <div className="flex items-center justify-end">
                                                {isSoldOut ? (
                                                    <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 uppercase">
                                                        Unavailable
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-1">
                                                        <button
                                                            onClick={() => updateQty(pkg.id, -1)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all font-bold"
                                                        >
                                                            -
                                                        </button>
                                                        <span className={`font-bold w-4 text-center ${qty > 0 ? 'text-primary-600' : 'text-slate-400'}`}>
                                                            {qty}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQty(pkg.id, 1)}
                                                            disabled={capacity > 0 && (soldQty + qty) >= capacity}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">
                                    No packages available for this event.
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-200">
                            <div className="flex items-center justify-between text-lg">
                                <span className="font-bold text-slate-900">Total</span>
                                <div className="text-right">
                                    <span className="font-extrabold text-primary-600 text-2xl">₹{calculateTotal()}</span>
                                    {selectedDates.length > 1 && (
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">For {selectedDates.length} days</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={bookingLoading}
                            onClick={handleBook}
                            className="w-full btn-primary py-4 text-lg font-bold shadow-xl shadow-primary-500/20 disabled:opacity-50"
                        >
                            {bookingLoading ? 'Processing...' : 'Book This Event'}
                        </button>
                        <p className="text-center text-xs text-slate-400">Secure payment integration for PhonePe and GPay</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
