import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Check, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [qty, setQty] = useState(1);
    const [bookingLoading, setBookingLoading] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${id}`);
                setEvent(res.data);
                if (res.data.packages.length > 0) setSelectedPkg(res.data.packages[0]);
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

        setBookingLoading(true);
        try {
            const res = await api.post('/bookings', {
                event_id: event.id,
                package_id: selectedPkg.id,
                qty
            });
            navigate(`/booking/confirm/${res.data.id}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center">Loading...</div>;
    if (!event) return <div className="text-center py-20">Event not found</div>;

    return (
        <div className="space-y-12">
            <div className="grid lg:grid-cols-2 gap-12">
                {/* Left: Event Info */}
                <div className="space-y-8">
                    <div className="relative h-96 rounded-3xl overflow-hidden shadow-xl">
                        {event.banner_url ? (
                            <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                <Calendar className="w-20 h-20 text-slate-300" />
                            </div>
                        )}
                        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-sm font-bold text-primary-600 shadow-md">
                            {event.category_name}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">{event.title}</h1>
                        <div className="flex flex-wrap gap-6 text-slate-500 font-medium">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary-500" />
                                <span>{new Date(event.start_date).toLocaleDateString()}</span>
                            </div>
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

                {/* Right: Booking Sidebar */}
                <div className="space-y-8">
                    <div className="card p-8 sticky top-24 space-y-8 border-slate-200 bg-slate-50/50">
                        <h3 className="text-2xl font-bold text-slate-900">Select Package</h3>

                        <div className="space-y-4">
                            {event.packages.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    onClick={() => setSelectedPkg(pkg)}
                                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedPkg?.id === pkg.id ? 'border-primary-500 bg-white shadow-lg' : 'border-slate-100 bg-white/50 hover:border-slate-200'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm font-bold uppercase tracking-wider ${selectedPkg?.id === pkg.id ? 'text-primary-600' : 'text-slate-400'}`}>
                                            {pkg.package_name}
                                        </span>
                                        <span className="text-xl font-extrabold text-slate-900">₹{pkg.price}</span>
                                    </div>
                                    <p className="text-slate-500 text-sm">{pkg.features}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-600">Quantity</span>
                                <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-1">
                                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-500">-</button>
                                    <span className="font-bold text-slate-900 w-4 text-center">{qty}</span>
                                    <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-500">+</button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-lg">
                                <span className="font-bold text-slate-900">Total</span>
                                <span className="font-extrabold text-primary-600 text-2xl">₹{(selectedPkg?.price || 0) * qty}</span>
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
