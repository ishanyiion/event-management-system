import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="card shadow-2xl p-8 space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto">
                        <LogIn className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
                    <p className="text-slate-500">Sign in to manage your events and bookings</p>
                    {error && <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="input pl-10"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-700">Password</label>
                            <Link to="#" className="text-xs font-medium text-primary-600 hover:underline">Forgot password?</Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="input pl-10"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 font-bold flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {loading ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <p className="text-center text-slate-600 text-sm">
                    Don't have an account? {' '}
                    <Link to="/register" className="text-primary-600 font-bold hover:underline">Create Account</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
