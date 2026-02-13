import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Banknote, Clock, ArrowLeft, Info, X, ShieldCheck, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import { formatTimeAMPM } from '../../utils/formatTime';
import StatusBadge from '../../components/ui/StatusBadge';

const EventAnalytics = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get(`/events/analytics/${id}`);
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch analytics', err);
                setData({ error: true });
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [id]);

    if (loading) return <div className="h-96 flex items-center justify-center">Loading analytics...</div>;
    if (!data || data.error) return (
        <div className="text-center py-20 font-bold text-slate-400 text-xl flex flex-col items-center gap-4">
            <ShieldCheck className="w-12 h-12 opacity-20" />
            Analytics not found or unauthorized.
        </div>
    );

    const { event, stats, packages, bookings } = data;

    return (
        <div className="space-y-8 pb-12">
            {/* Header / Back Navigation */}
            <div className="flex items-center gap-4">
                <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-extrabold text-slate-900">Event Analytics</h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* 1. EVENT SUMMARY SECTION */}
                <div className="lg:col-span-2 card p-8 space-y-6 bg-white border-none shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full -z-0 opacity-50" />
                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-start">
                            <h2 className="text-2xl font-black text-slate-900">{event.title}</h2>
                            <StatusBadge status={event.status} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 text-slate-500 font-medium">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-primary-600"><Calendar className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Date & Time</p>
                                    <p>{new Date(event.start_date).toLocaleDateString('en-GB')} - {new Date(event.end_date).toLocaleDateString('en-GB')}</p>
                                    <p className="text-xs">{formatTimeAMPM(event.start_time)} to {formatTimeAMPM(event.end_time)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-primary-600"><MapPin className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Location</p>
                                    <p>{event.location}, {event.city}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. TICKET STATISTICS (CARDS) */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Total Created" value={stats.totalCapacity} icon={<Users />} color="text-blue-600" bg="bg-blue-50" />
                    <StatCard label="Total Sold" value={stats.totalSold} icon={<CheckCircle />} color="text-green-600" bg="bg-green-50" />
                    <StatCard label="Remaining" value={stats.remaining} icon={<Clock />} color="text-amber-600" bg="bg-amber-50" />
                    <StatCard label="Revenue" value={`₹${stats.totalRevenue}`} icon={<Banknote />} color="text-primary-600" bg="bg-primary-50" />
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* 3. CATEGORY-WISE TICKET BREAKDOWN (TABLE) */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary-500" /> Ticket Categories
                    </h3>
                    <div className="card overflow-hidden border-slate-200">
                        <div className="divide-y divide-slate-100">
                            {packages.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">No categories defined.</div>
                            ) : (
                                packages.map(pkg => (
                                    <div key={pkg.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-900">{pkg.package_name}</h4>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-primary-600">₹{parseFloat(pkg.category_revenue || 0).toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Revenue</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-100 p-2 rounded-xl text-center">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Limit / Day</p>
                                                <p className="font-bold text-slate-700">{pkg.capacity || '∞'}</p>
                                            </div>
                                            <div className="bg-green-50 p-2 rounded-xl text-center">
                                                <p className="text-[10px] text-green-400 font-bold uppercase">Total Sold</p>
                                                <p className="font-bold text-green-700">{pkg.sold_qty}</p>
                                            </div>
                                            <div className="bg-blue-50 p-2 rounded-xl text-center">
                                                <p className="text-[10px] text-blue-400 font-bold uppercase">Total Capacity</p>
                                                <p className="font-bold text-blue-700">
                                                    {pkg.capacity ? (pkg.capacity * (data.dailyStats?.length || 1)) : '∞'}
                                                </p>
                                            </div>
                                            <div className="bg-amber-50 p-2 rounded-xl text-center">
                                                <p className="text-[10px] text-amber-400 font-bold uppercase">Status</p>
                                                <p className="font-bold text-amber-700 text-xs py-1">ACTIVE</p>
                                            </div>
                                        </div>

                                        {/* Daily Breakdown */}
                                        {pkg.daily_breakdown && pkg.daily_breakdown.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Daily Sales</p>
                                                <div className="space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                                                    {pkg.daily_breakdown.map((d, i) => (
                                                        <div key={i} className="flex justify-between text-xs">
                                                            <span className="text-slate-600 font-medium">
                                                                {new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                            </span>
                                                            <span className={`font-bold ${d.count >= (pkg.capacity || 0) ? 'text-red-600' : 'text-slate-800'}`}>
                                                                {d.count} / {pkg.capacity || '∞'} Sold
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>


                </div>

                {/* 4. BOOKINGS LIST (TABLE) */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-slate-900">Bookings List</h3>
                    <div className="card overflow-hidden border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Booking ID</th>
                                        <th className="px-6 py-4">Person</th>
                                        <th className="px-6 py-4">Quantity</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {bookings.length === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">No bookings yet.</td></tr>
                                    ) : (
                                        bookings.map((booking) => (
                                            <tr
                                                key={booking.booking_id}
                                                onClick={() => setSelectedBooking(booking)}
                                                className="hover:bg-primary-50/30 cursor-pointer transition-all active:scale-[0.99]"
                                            >
                                                <td className="px-6 py-4 font-mono text-xs font-bold text-primary-600">#{booking.booking_id}</td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-900">{booking.person_name}</p>
                                                    <p className="text-xs text-slate-400">{booking.email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-slate-100 px-2 py-1 rounded-lg font-bold text-slate-600">{booking.package_summary}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900">₹{parseFloat(booking.total_amount).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <StatusBadge status={booking.payment_status} sm />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. PERSON DETAIL MODAL */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
                    <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-primary-600 p-8 text-white relative">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                                    <Users className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black">{selectedBooking.person_name}</h4>
                                    <p className="text-primary-100 font-medium">{selectedBooking.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Booking Details
                                </h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400">Total Paid</p>
                                        <p className="text-xl font-black text-primary-600">₹{parseFloat(selectedBooking.total_amount).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400">Booking Date</p>
                                        <p className="font-bold text-slate-700">{new Date(selectedBooking.booking_date).toLocaleDateString('en-GB')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest">Reserved Tickets</h5>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {selectedBooking.details && selectedBooking.details.length > 0 ? (
                                        selectedBooking.details.map((detail, i) => (
                                            <div key={i} className="flex flex-col gap-1 pb-3 last:pb-0 border-b last:border-0 border-slate-200/50">
                                                <div className="flex justify-between items-center font-bold text-slate-700">
                                                    <span>{detail.package_name}</span>
                                                    <span className="text-primary-600">x{detail.qty}</span>
                                                </div>
                                                {detail.event_date && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(detail.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        (selectedBooking.package_summary || '').split(',').map((pkg, i) => {
                                            if (!pkg.trim()) return null;
                                            const parts = pkg.trim().split(' (x');
                                            const name = parts[0];
                                            const qty = parts[1] ? parts[1].replace(')', '') : '1';
                                            return (
                                                <div key={i} className="flex justify-between items-center font-bold text-slate-700">
                                                    <span>{name}</span>
                                                    <span className="text-primary-600">x{qty}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Payment Status</p>
                                    <StatusBadge status={selectedBooking.payment_status} />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Booking ID</p>
                                    <p className="font-mono text-sm font-black text-primary-600">#{selectedBooking.booking_id}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon, color, bg }) => (
    <div className={`p-4 rounded-2xl ${bg} flex flex-col justify-between h-full border border-white`}>
        <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center ${color} shadow-sm mb-2`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
            <p className={`text-xl font-black ${color}`}>{value}</p>
        </div>
    </div>
);


export default EventAnalytics;
