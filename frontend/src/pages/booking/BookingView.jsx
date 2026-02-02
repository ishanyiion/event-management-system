import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Ticket, ArrowLeft, Download, CheckCircle, Clock } from 'lucide-react';
import api from '../../utils/api';
import { formatTimeAMPM } from '../../utils/formatTime';
import { generateTicketPDF } from '../../utils/ticketGenerator';

const BookingView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await api.get(`/bookings/${id}`);
                setBooking(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    if (!booking) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-slate-900">Booking not found</h2>
            <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary-600 font-bold hover:underline flex items-center gap-2 mx-auto">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
        </div>
    );

    const getTicketTheme = (packageName) => {
        const name = packageName.toUpperCase();
        if (name.includes('VIP')) {
            return {
                card: 'border-amber-100 hover:border-amber-300 bg-amber-50/20',
                header: 'bg-amber-50 border-amber-100',
                icon: 'text-amber-600',
                text: 'text-amber-900',
                badge: 'bg-amber-100 text-amber-700'
            };
        }
        if (name.includes('BASIC') || name.includes('GENERAL')) {
            return {
                card: 'border-blue-100 hover:border-blue-300 bg-blue-50/20',
                header: 'bg-blue-50 border-blue-100',
                icon: 'text-blue-600',
                text: 'text-blue-900',
                badge: 'bg-blue-100 text-blue-700'
            };
        }
        return {
            card: 'border-emerald-100 hover:border-emerald-300 bg-emerald-50/20',
            header: 'bg-emerald-50 border-emerald-100',
            icon: 'text-emerald-600',
            text: 'text-emerald-900',
            badge: 'bg-emerald-100 text-emerald-700'
        };
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors">
                <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>

            <header className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${booking.booking_status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {booking.booking_status}
                        </span>
                        <span className="text-slate-400 font-bold text-sm">Booking ID: #{booking.id}</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">{booking.event_title}</h1>

                    <div className="grid grid-cols-2 gap-6 pt-4">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="p-2 bg-slate-50 rounded-xl text-primary-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Valid On</p>
                                <p className="font-bold">
                                    {booking.booked_date ?
                                        booking.booked_date.split(',').map(d => new Date(d).toLocaleDateString('en-GB')).join(', ')
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="p-2 bg-slate-50 rounded-xl text-primary-600">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                                <p className="font-bold">{booking.payment_status === 'PAID' ? 'Fully Paid' : 'Payment Pending'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900 border-l-4 border-primary-500 pl-4">Your Digital Passes</h3>

                <div className="grid md:grid-cols-2 gap-6">
                    {booking.tickets && booking.tickets.length > 0 ? (
                        booking.tickets.map((ticket, index) => {
                            const theme = getTicketTheme(ticket.package_name);
                            return (
                                <div key={ticket.id} className={`relative overflow-hidden border-2 rounded-[2rem] transition-all group ${theme.card}`}>
                                    {/* Ticket Design Top */}
                                    <div className={`p-6 border-b-2 border-dashed relative ${theme.header} border-slate-200`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                                <Ticket className={`w-6 h-6 ${theme.icon}`} />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Ticket No.</p>
                                                <p className="text-sm font-mono font-bold text-slate-900">{ticket.ticket_number}</p>
                                            </div>
                                        </div>

                                        <h4 className={`text-xl font-black uppercase ${theme.text}`}>{ticket.package_name} PASS</h4>
                                        <p className="text-xs text-slate-500 mt-1">Single Entry • Non-Transferable</p>

                                        {ticket.event_date && (
                                            <div className="mt-3 inline-block px-3 py-1 rounded-lg bg-white/50 border border-slate-200 backdrop-blur-sm">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(ticket.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        )}

                                        {/* Notch Cutouts */}
                                        <div className={`absolute -bottom-3 -left-3 w-6 h-6 rounded-full border-r-2 border-slate-200 group-hover:border-primary-200 transition-colors ${theme.header}`}></div>
                                        <div className={`absolute -bottom-3 -right-3 w-6 h-6 rounded-full border-l-2 border-slate-200 group-hover:border-primary-200 transition-colors ${theme.header}`}></div>
                                    </div>

                                    {/* Ticket Design Bottom */}
                                    <div className="p-8 space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendee</p>
                                                <p className="font-bold text-slate-800">{booking.user_name}</p>
                                            </div>
                                            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center p-2">
                                                {/* Representing a QR Code with a pattern */}
                                                <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-30">
                                                    {[...Array(16)].map((_, i) => (
                                                        <div key={i} className={`rounded-[1px] ${Math.random() > 0.4 ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${theme.badge}`}>
                                                <CheckCircle className="w-3 h-3" /> VERIFIED
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setDownloading(ticket.id);
                                                    generateTicketPDF(ticket, booking).finally(() => setDownloading(null));
                                                }}
                                                disabled={downloading === ticket.id}
                                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-primary-600 disabled:opacity-50"
                                                title="Download PDF Ticket"
                                            >
                                                {downloading === ticket.id ? (
                                                    <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <Download className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full card p-12 text-center bg-slate-50 text-slate-400 border-dashed">
                            {booking.booking_status === 'CONFIRMED'
                                ? "Loading your tickets..."
                                : "Complete payment to unlock your digital passes."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingView;
