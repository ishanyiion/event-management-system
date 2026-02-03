import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Check, ArrowRight, ShieldCheck, Info, Clock, ShoppingCart } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getEventImage, formatEventImage } from '../utils/eventImages';
import { formatTimeAMPM } from '../utils/formatTime';
import { showError, showWarning } from '../utils/swalHelper';

const formatDateSafe = (dateStr, options = { day: '2-digit', month: '2-digit', year: 'numeric' }) => {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', options);
};

const EventDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    // Changing state structure from global { pkgId: qty } to { "YYYY-MM-DD": { pkgId: qty } }
    const [cart, setCart] = useState({});

    // Used for calculating dates if schedule is missing
    const [availableDates, setAvailableDates] = useState([]);

    // Current selected date for viewing packages
    const [activeDate, setActiveDate] = useState(null);

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

                // Determine available dates
                let dates = [];
                if (res.data.schedule && res.data.schedule.length > 0) {
                    dates = res.data.schedule.map(d => d.event_date.split('T')[0]);
                } else if (res.data.start_date && res.data.end_date) {
                    const start = new Date(res.data.start_date);
                    const end = new Date(res.data.end_date);
                    let current = new Date(start);
                    while (current <= end) {
                        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                        dates.push(dateStr);
                        current.setDate(current.getDate() + 1);
                    }
                }

                // Remove duplicates if any
                dates = [...new Set(dates)];
                setAvailableDates(dates);

                if (dates.length > 0) {
                    setActiveDate(dates[0]);
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

        // Allowed roles: CLIENT, ADMIN, ORGANIZER (except for their own event)
        const allowedRoles = ['CLIENT', 'ADMIN', 'ORGANIZER'];
        if (!allowedRoles.includes(user.role)) {
            return showWarning('Access Denied', 'Your account type is not authorized to book events.');
        }

        if (user.role === 'ORGANIZER' && String(event.organizer_id) === String(user.id)) {
            return showWarning('Restricted', 'As an organizer, you cannot book tickets for your own event.');
        }

        // Flatten cart to items array
        let items = [];
        Object.entries(cart).forEach(([date, packages]) => {
            Object.entries(packages).forEach(([pkgId, qty]) => {
                if (qty > 0) {
                    items.push({
                        package_id: parseInt(pkgId),
                        qty: qty,
                        date: date
                    });
                }
            });
        });

        if (items.length === 0) return showWarning('Empty Cart', 'Please select at least one ticket before booking.');

        setBookingLoading(true);
        try {
            const res = await api.post('/bookings', {
                event_id: event.id,
                items,
                booked_date: Object.keys(cart).filter(d => Object.values(cart[d] || {}).some(q => q > 0))
            });
            navigate(`/booking/confirm/${res.data.id}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    const updateQty = (pkgId, delta) => {
        if (!activeDate) return;

        const currentDayPackages = cart[activeDate] || {};
        const currentQty = currentDayPackages[pkgId] || 0;
        const nextQty = Math.max(0, currentQty + delta);

        const newCart = { ...cart };

        if (nextQty === 0) {
            // Remove package from date if 0
            if (newCart[activeDate]) {
                delete newCart[activeDate][pkgId];
                // Clean up date if empty
                if (Object.keys(newCart[activeDate]).length === 0) {
                    delete newCart[activeDate];
                }
            }
        } else {
            // Update quantity
            newCart[activeDate] = {
                ...currentDayPackages,
                [pkgId]: nextQty
            };
        }

        setCart(newCart);
    };

    const calculateTotal = () => {
        let total = 0;
        let dayCount = 0;

        Object.entries(cart).forEach(([date, packages]) => {
            let hasPackages = false;
            Object.entries(packages).forEach(([pkgId, qty]) => {
                const pkg = event.packages.find(p => p.id === parseInt(pkgId));
                if (pkg) {
                    total += pkg.price * qty;
                    if (qty > 0) hasPackages = true;
                }
            });
            if (hasPackages) dayCount++;
        });

        return { total, dayCount };
    };

    const { total, dayCount } = calculateTotal();

    if (loading) return <div className="h-96 flex items-center justify-center">Loading...</div>;
    if (!event) return <div className="text-center py-20">Event not found</div>;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isEventCompleted = new Date(event.end_date).setHours(0, 0, 0, 0) < today.getTime();
    const isActiveDatePast = activeDate && new Date(activeDate).setHours(0, 0, 0, 0) < today.getTime();

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
                                <span>{formatDateSafe(event.start_date)} to {formatDateSafe(event.end_date)}</span>
                            </div>
                            {/* ... existing schedule display code if needed ... */}
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

                        {/* Day Selection Tabs */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary-500 pl-3">Select Day</h3>
                                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Day-Wise</span>
                            </div>

                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {availableDates.map((dateStr) => {
                                    const dayCart = cart[dateStr] || {};
                                    const hasItems = Object.values(dayCart).some(q => q > 0);
                                    const isActive = activeDate === dateStr;
                                    const isPast = new Date(dateStr).setHours(0, 0, 0, 0) < today.getTime();

                                    return (
                                        <button
                                            key={dateStr}
                                            disabled={isPast}
                                            onClick={() => setActiveDate(dateStr)}
                                            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 
                                                ${isActive ? 'border-primary-500 bg-primary-600 text-white shadow-md transform scale-105 z-10'
                                                    : hasItems ? 'border-primary-200 bg-primary-50 text-primary-700'
                                                        : isPast ? 'border-slate-100 bg-slate-100 text-slate-300 cursor-not-allowed opacity-60'
                                                            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span>{formatDateSafe(dateStr, { day: '2-digit', month: 'short' })}</span>
                                                {isPast && <span className="text-[8px] uppercase">Passed</span>}
                                            </div>
                                            {hasItems && !isActive && (
                                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Packages for Active Date */}
                        <div className="space-y-4 relative min-h-[200px]">
                            <div className="flex items-baseline justify-between">
                                <h3 className="text-2xl font-bold text-slate-900">Packages</h3>
                                <span className="text-xs font-bold text-slate-400">for {new Date(activeDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                            </div>

                            {event.packages && event.packages.length > 0 ? (
                                event.packages.map((pkg) => {
                                    const currentDayQty = (cart[activeDate] || {})[pkg.id] || 0;
                                    // Total sold calculation (approximate locally + DB stats)
                                    // ideally we subtract local other-day selections if strictly tracking absolute limit per package
                                    const dailySold = pkg.daily_sold || {};
                                    const soldQty = parseInt(dailySold[activeDate] || 0);
                                    const capacity = parseInt(pkg.capacity || 0);

                                    const isSoldOut = capacity > 0 && soldQty >= capacity;
                                    const remaining = Math.max(0, capacity - soldQty);

                                    return (
                                        <div
                                            key={pkg.id}
                                            className={`p-5 rounded-2xl border-2 transition-all ${isSoldOut ? 'opacity-60 bg-slate-50 border-slate-200' :
                                                currentDayQty > 0 ? 'border-primary-500 bg-white shadow-lg' : 'border-slate-100 bg-white/50 hover:border-slate-200'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold uppercase tracking-wider ${isSoldOut || isActiveDatePast ? 'text-slate-400' : currentDayQty > 0 ? 'text-primary-600' : 'text-slate-400'}`}>
                                                        {pkg.package_name}
                                                    </span>
                                                    {capacity > 0 && !isActiveDatePast && (
                                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${isSoldOut ? 'text-red-500' : 'text-slate-400'}`}>
                                                            {isSoldOut ? 'SOLD OUT' : `${remaining} Tickets Left`}
                                                        </span>
                                                    )}
                                                    {isActiveDatePast && (
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-amber-500">
                                                            Date Passed
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-xl font-extrabold ${isSoldOut || isActiveDatePast ? 'text-slate-400' : 'text-slate-900'}`}>₹{pkg.price}</span>
                                            </div>
                                            <p className="text-slate-500 text-sm mb-4 whitespace-pre-line">{pkg.features}</p>

                                            <div className="flex items-center justify-end">
                                                {isSoldOut ? (
                                                    <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 uppercase">
                                                        Unavailable
                                                    </div>
                                                ) : isActiveDatePast ? (
                                                    <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold border border-amber-100 uppercase">
                                                        Sales Ended
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-1">
                                                        <button
                                                            onClick={() => updateQty(pkg.id, -1)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all font-bold"
                                                        >
                                                            -
                                                        </button>
                                                        <span className={`font-bold w-4 text-center ${currentDayQty > 0 ? 'text-primary-600' : 'text-slate-400'}`}>
                                                            {currentDayQty}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQty(pkg.id, 1)}
                                                            disabled={capacity > 0 && (soldQty + currentDayQty) >= capacity}
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
                                    <span className="font-extrabold text-primary-600 text-2xl">₹{total}</span>
                                    {dayCount > 0 && (
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Across {dayCount} days</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={bookingLoading || total === 0 || isEventCompleted}
                            onClick={handleBook}
                            className={`w-full py-4 text-lg font-bold shadow-xl rounded-2xl flex items-center justify-center gap-2 transition-all 
                                ${isEventCompleted ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'btn-primary'}`}
                        >
                            {bookingLoading ? 'Processing...' : isEventCompleted ? 'Event Completed' : (
                                <>
                                    <ShoppingCart className="w-5 h-5" />
                                    Book Now
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-slate-400">Secure payment integration for PhonePe and GPay</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
