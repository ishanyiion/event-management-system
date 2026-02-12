import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { showSuccess, showError } from '../../utils/swalHelper';
import { User, Lock, Mail, Phone, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({
        name: '',
        mobile: ''
    });

    // Password State
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                mobile: user.mobile || ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (profile.mobile && (profile.mobile.length !== 10 || !/^\d+$/.test(profile.mobile))) {
            setLoading(false);
            return showError('Invalid Mobile', 'Mobile number must be exactly 10 digits');
        }

        try {
            const res = await api.put('/auth/profile', profile);
            updateUser(res.data);
            showSuccess('Profile Updated', 'Your profile details have been updated.');
        } catch (err) {
            showError('Update Failed', err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return showError('Error', 'New passwords do not match');
        }

        const password = passwords.newPassword;
        if (password.length < 8) return showError('Invalid Password', 'Password must be at least 8 characters long');
        if (!/[A-Z]/.test(password)) return showError('Invalid Password', 'Password must contain at least one uppercase letter');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return showError('Invalid Password', 'Password must contain at least one special character');

        setLoading(true);
        try {
            await api.put('/auth/profile/password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            showSuccess('Password Changed', 'Your password has been updated successfully.');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            showError('Error', err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Profile Details Card */}
                <div className="card p-8 space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary-600" /> Personal Details
                    </h2>

                    {!profile.mobile && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-amber-800">Add Mobile Number</h3>
                                <p className="text-sm text-amber-700 mt-1">
                                    Please add your mobile number to enable <strong>OTP-based Password Reset</strong> in case you forget your password.
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-slate-500">
                                <Shield className="w-4 h-4" />
                                <span className="font-medium">{user?.role}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-slate-500">
                                <Mail className="w-4 h-4" />
                                <span className="font-medium">{user?.email}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    className="input pl-10"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                />
                            </div>
                        </div>

                        {(user?.role === 'ORGANIZER' || user?.role === 'CLIENT' || true) && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                    <input
                                        type="tel"
                                        className="input pl-10"
                                        placeholder="Mobile Number (10 digits)"
                                        maxLength={10}
                                        value={profile.mobile}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) {
                                                setProfile({ ...profile, mobile: val });
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Change Password Card */}
                <div className="card p-8 space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary-600" /> Security
                    </h2>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? "text" : "password"}
                                    required
                                    className="input pr-10"
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                >
                                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? "text" : "password"}
                                    required
                                    className="input pr-10"
                                    minLength={8}
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                >
                                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    required
                                    className="input pr-10"
                                    minLength={8}
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                >
                                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
