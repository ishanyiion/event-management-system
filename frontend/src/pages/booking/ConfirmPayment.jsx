import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Smartphone, ArrowRight, ShieldCheck, AlertCircle, Calendar, User, Mail, Banknote } from 'lucide-react';
import api from '../../utils/api';

const ConfirmPayment = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [txnId, setTxnId] = useState('');
    const [app, setApp] = useState('PHONEPE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await api.get(`/bookings/${bookingId}`);
                setBooking(res.data);
                // Auto-fill fields
                setUserName(res.data.user_name || '');
                setUserEmail(res.data.user_email || '');
            } catch (err) {
                console.error(err);
                setError('Failed to load booking details');
            }
        };
        fetchBooking();
    }, [bookingId]);

    const handleConfirm = async (e) => {
        e.preventDefault();
        if (!txnId) return setError('Please enter a Transaction ID');

        setLoading(true);
        setError('');
        try {
            await api.post('/bookings/confirm-payment', {
                booking_id: bookingId,
                payment_method: 'UPI',
                upi_app: app,
                transaction_id: txnId,
                // Passing updated name/email if needed (though backend currently uses authenticated user)
                user_name: userName,
                user_email: userEmail
            });
            alert('Payment confirmed successfully! A receipt has been sent to your email.');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!booking && !error) return <div className="text-center py-20 font-bold text-slate-500">Loading order info...</div>;

    return (
        <div className="max-w-4xl mx-auto mt-12 space-y-8 px-4">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Smartphone className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900">Secure UPI Payment</h1>
                <p className="text-slate-500 font-medium">Scan & Pay using your favorite UPI app</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* QR Code Section */}
                <div className="card p-8 space-y-6 flex flex-col items-center justify-center bg-white shadow-xl rounded-3xl border border-slate-100 sticky top-8">
                    {booking && (
                        <div className="w-full space-y-6 flex flex-col items-center">
                            <div className="w-56 h-56 bg-slate-900 rounded-3xl p-4 flex items-center justify-center shadow-2xl transition-transform hover:scale-105 duration-300">
                                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center border-4 border-slate-900 overflow-hidden">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                                            `upi://pay?pa=demo@upi&pn=EventHub&am=${booking.total_amount}&tn=${encodeURIComponent(`Payment for ${booking.event_title}`)}&tr=${bookingId}&cu=INR`
                                        )}`}
                                        alt="UPI QR Code"
                                        className="w-full h-full p-2"
                                    />
                                </div>
                            </div>

                            {/* Mobile Deep Link Button */}
                            <a
                                href={`upi://pay?pa=demo@upi&pn=EventHub&am=${booking.total_amount}&tn=${encodeURIComponent(`Payment for ${booking.event_title}`)}&tr=${bookingId}&cu=INR`}
                                className="w-full flex md:hidden items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                            >
                                <Smartphone className="w-5 h-5 text-primary-400" />
                                Pay via Any UPI App
                            </a>

                            <div className="text-center space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payee: EventHub</p>
                                <p className="text-2xl font-black text-primary-600 tracking-tighter">₹{booking.total_amount}</p>
                            </div>
                        </div>
                    )}

                    <div className="w-full pt-4 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Secure Encryption Active
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleConfirm} className="card p-8 space-y-6 bg-white border-none shadow-2xl rounded-3xl ring-1 ring-slate-100">
                    <div className="space-y-5">
                        <h3 className="font-black text-slate-900 text-xl border-l-4 border-primary-500 pl-4 py-1">Transaction Details</h3>

                        {/* Event Name - Read Only */}
                        <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 transition-colors focus-within:bg-white focus-within:border-primary-200">
                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Event for Payment</label>
                            <input
                                type="text"
                                className="w-full bg-transparent font-bold text-slate-700 outline-none text-sm pointer-events-none"
                                value={booking?.event_title || ''}
                                readOnly
                            />
                        </div>

                        {/* User Name - Editable */}
                        <div className="space-y-1.5 p-3.5 bg-white rounded-2xl border border-slate-200 transition-all focus-within:ring-2 focus-within:ring-primary-500/10 focus-within:border-primary-500">
                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><User className="w-3.5 h-3.5" /> Full Name</label>
                            <input
                                type="text"
                                className="w-full bg-transparent font-bold text-slate-700 outline-none text-sm"
                                placeholder="Enter your name"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                required
                            />
                        </div>

                        {/* User Email - Editable */}
                        <div className="space-y-1.5 p-3.5 bg-white rounded-2xl border border-slate-200 transition-all focus-within:ring-2 focus-within:ring-primary-500/10 focus-within:border-primary-500">
                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email for Receipt</label>
                            <input
                                type="email"
                                className="w-full bg-transparent font-bold text-slate-700 outline-none text-sm"
                                placeholder="Enter your email"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Package Breakdown */}
                        {booking?.items && booking.items.length > 0 && (
                            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">Items Breakdown</label>
                                <div className="space-y-2">
                                    {booking.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600 font-medium">{item.package_name} <span className="text-slate-400">x{item.qty}</span></span>
                                            <span className="text-slate-900 font-bold">₹{item.price_at_time * item.qty}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Event Price - Read Only highlight */}
                        <div className="space-y-1.5 p-4 bg-primary-50/50 rounded-2xl border border-primary-100">
                            <label className="text-[10px] font-black text-primary-500 uppercase flex items-center gap-2"><Banknote className="w-3.5 h-3.5" /> Total Payable Amount</label>
                            <p className="text-2xl font-black text-primary-700 leading-none mt-1">₹{booking?.total_amount}</p>
                        </div>

                        {/* Payment App */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">Payment Source</label>
                            <select
                                className="input h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-700 focus:bg-white transition-all"
                                value={app}
                                onChange={(e) => setApp(e.target.value)}
                            >
                                <option value="PHONEPE">PhonePe</option>
                                <option value="GPAY">Google Pay</option>
                                <option value="PAYTM">Paytm</option>
                                <option value="OTHER">Other UPI</option>
                            </select>
                        </div>

                        {/* Transaction ID */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase">Transaction ID (Ref No.)</label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-3.5 w-5 h-5 text-green-500 transition-all group-focus-within:scale-110" />
                                <input
                                    type="text"
                                    className="input h-12 pl-12 rounded-xl border-slate-200 focus:border-primary-500 font-bold text-slate-700"
                                    placeholder="Enter ID from payment app"
                                    value={txnId}
                                    onChange={(e) => setTxnId(e.target.value)}
                                    required
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium px-1">Check your payment app's history for the Ref. Number</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-100 animate-pulse">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-4 text-lg font-black flex items-center justify-center gap-3 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? 'Processing Receipt...' : 'Complete Payment'}
                        <ArrowRight className="w-6 h-6" />
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-medium">Receipt will be sent to your email instantly.</p>
                </form>
            </div>

            <div className="text-center text-slate-400 text-xs py-8">
                Verified Merchant • Secure Checkout • SSL 256-bit Encryption
            </div>
        </div>
    );
};

export default ConfirmPayment;
