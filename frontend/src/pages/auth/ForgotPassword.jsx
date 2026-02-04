import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Phone, Lock, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import { showSuccess, showError } from '../../utils/swalHelper';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
    const [loading, setLoading] = useState(false);

    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        new: false,
        confirm: false
    });

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/sent-otp', { mobile });
            showSuccess('OTP Sent', 'Check your console for the OTP (Simulation mode).');
            setStep(2);
        } catch (err) {
            showError('Error', err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            return showError('Error', 'Passwords do not match');
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password-otp', {
                mobile,
                otp,
                newPassword: passwords.new
            });
            await showSuccess('Success', 'Password has been reset successfully. Please login.');
            navigate('/login');
        } catch (err) {
            showError('Error', err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 mb-12">
            <div className="card shadow-2xl p-8 space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto">
                        <KeyRound className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">Forgot Password</h2>
                    <p className="text-slate-500">
                        {step === 1
                            ? "Enter your mobile number to receive an OTP"
                            : "Enter the OTP sent to your mobile"}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Mobile Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input
                                    type="tel"
                                    placeholder="+91 9876543210"
                                    className="input pl-10"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 font-bold flex items-center justify-center gap-2"
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">OTP Code</label>
                            <div className="relative">
                                <CheckCircle className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    className="input pl-10 text-center tracking-widest font-mono text-lg"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPasswords.new ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="input pl-10 pr-10"
                                    minLength={6}
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="input pl-10 pr-10"
                                    minLength={6}
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 font-bold flex items-center justify-center gap-2"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <p className="text-center text-slate-600 text-sm">
                    Remember your password? {' '}
                    <Link to="/login" className="text-primary-600 font-bold hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
