import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Briefcase, ArrowRight } from 'lucide-react';
import api from '../../utils/api';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('CLIENT');
    const [formData, setFormData] = useState({
        name: '',
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
            await api.post('/auth/register', { ...formData, role });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-8">
            <div className="card shadow-2xl p-8 space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
                    <p className="text-slate-500">Join EventHub to explore and manage amazing events</p>
                    {error && <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
                </div>

                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setRole('CLIENT')}
                        className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${role === 'CLIENT' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                    >
                        <User className="w-6 h-6" />
                        <span className="font-bold">Client</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('ORGANIZER')}
                        className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${role === 'ORGANIZER' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                    >
                        <Briefcase className="w-6 h-6" />
                        <span className="font-bold">Organizer</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="John Doe"
                                className="input pl-10"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

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
                        <label className="text-sm font-semibold text-slate-700">Password</label>
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
                        {loading ? 'Creating Account...' : `Register as ${role === 'CLIENT' ? 'Client' : 'Organizer'}`}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <p className="text-center text-slate-600 text-sm">
                    Already have an account? {' '}
                    <Link to="/login" className="text-primary-600 font-bold hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
