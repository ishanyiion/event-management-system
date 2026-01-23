import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, CheckCircle, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

const ConfirmPayment = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [txnId, setTxnId] = useState('');
    const [method, setMethod] = useState('UPI');
    const [app, setApp] = useState('PHONEPE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async (e) => {
        e.preventDefault();
        if (!txnId) return setError('Please enter a Transaction ID');

        setLoading(true);
        setError('');
        try {
            await api.post('/bookings/confirm-payment', {
                booking_id: bookingId,
                payment_method: method,
                payment_app: app,
                transaction_id: txnId
            });
            alert('Payment confirmed successfully!');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-12 space-y-8">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto">
                    <Smartphone className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Secure UPI Payment</h1>
                <p className="text-slate-500">Scan & Pay using your favorite UPI app</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="card p-8 space-y-6 flex flex-col items-center justify-center">
                    <div className="w-48 h-48 bg-slate-900 rounded-3xl p-4 flex items-center justify-center shadow-2xl">
                        {/* Dummy QR Code */}
                        <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center border-4 border-slate-900 overflow-hidden">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=demo@upi&pn=EventHub&am=100" alt="QR" className="w-full h-full p-2" />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Scan to pay demo@upi</p>
                </div>

                <form onSubmit={handleConfirm} className="card p-8 space-y-6 bg-slate-50 border-slate-200">
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 text-lg">Transaction Details</h3>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Payment App</label>
                            <select className="input" value={app} onChange={(e) => setApp(e.target.value)}>
                                <option value="PHONEPE">PhonePe</option>
                                <option value="GPAY">Google Pay</option>
                                <option value="PAYTM">Paytm</option>
                                <option value="OTHER">Other UPI</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Transaction ID (Ref No.)</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-3 w-5 h-5 text-green-500" />
                                <input
                                    type="text"
                                    className="input pl-10 border-green-200 focus:border-green-500"
                                    placeholder="e.g., TXN123456789"
                                    value={txnId}
                                    onChange={(e) => setTxnId(e.target.value)}
                                    required
                                />
                            </div>
                            <p className="text-[10px] text-slate-400">Find this in your payment app's history/receipt.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-4 font-bold flex items-center justify-center gap-2"
                    >
                        {loading ? 'Verifying...' : 'Confirm Payment'}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </form>
            </div>

            <div className="text-center text-slate-400 text-sm">
                <ShieldCheck className="w-4 h-4 inline mr-1 text-green-500" /> Secure SSL Encryption Enabled
            </div>
        </div>
    );
};

export default ConfirmPayment;
