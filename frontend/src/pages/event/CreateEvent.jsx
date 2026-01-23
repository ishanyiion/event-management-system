import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Plus, Trash, ArrowRight, Info } from 'lucide-react';
import api from '../../utils/api';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        city: '',
        start_date: '',
        end_date: '',
        max_capacity: 100,
        category_id: 1,
    });
    const [packages, setPackages] = useState([
        { name: 'Basic', price: 1000, features: 'Basic entry, No snacks' }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddPackage = () => {
        setPackages([...packages, { name: '', price: 0, features: '' }]);
    };

    const handleRemovePackage = (index) => {
        setPackages(packages.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/events/create', { ...formData, packages });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">Create New Event</h1>
                <p className="text-slate-500">Events are subject to admin approval.</p>
            </div>

            {error && <div className="p-4 bg-red-100 text-red-600 rounded-xl font-medium">{error}</div>}

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="card p-8 space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary-500 pl-3">General Information</h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Event Title</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., Summer Music Festival"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Category</label>
                                <select
                                    className="input"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                >
                                    <option value="1">Wedding</option>
                                    <option value="2">Corporate</option>
                                    <option value="3">Music</option>
                                    <option value="4">Birthday</option>
                                    <option value="5">Workshop</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Capacity</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.max_capacity}
                                    onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Description</label>
                            <textarea
                                className="input min-h-[120px]"
                                placeholder="Describe your event..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Location & Time */}
                <div className="card p-8 space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary-500 pl-3">Location & Schedule</h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">City</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., Mumbai"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Venue Address</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Full address"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Start Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">End Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Packages */}
                <div className="md:col-span-2 card p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary-500 pl-3">Event Packages</h3>
                        <button
                            type="button"
                            onClick={handleAddPackage}
                            className="flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700"
                        >
                            <Plus className="w-5 h-5" /> Add Package
                        </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {packages.map((pkg, index) => (
                            <div key={index} className="p-6 border border-slate-200 rounded-2xl space-y-4 relative group">
                                {packages.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePackage(index)}
                                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Package Name</label>
                                    <input
                                        type="text"
                                        className="input py-1.5"
                                        placeholder="e.g., VIP"
                                        value={pkg.name}
                                        onChange={(e) => {
                                            const newPkgs = [...packages];
                                            newPkgs[index].name = e.target.value;
                                            setPackages(newPkgs);
                                        }}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Price (₹)</label>
                                    <input
                                        type="number"
                                        className="input py-1.5"
                                        value={pkg.price}
                                        onChange={(e) => {
                                            const newPkgs = [...packages];
                                            newPkgs[index].price = e.target.value;
                                            setPackages(newPkgs);
                                        }}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Features</label>
                                    <textarea
                                        className="input py-1.5 min-h-[80px]"
                                        placeholder="List features..."
                                        value={pkg.features}
                                        onChange={(e) => {
                                            const newPkgs = [...packages];
                                            newPkgs[index].features = e.target.value;
                                            setPackages(newPkgs);
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 flex items-center justify-end gap-4 pt-4">
                    <button type="button" onClick={() => navigate('/dashboard')} className="px-8 py-3 font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary px-12 py-3 text-lg font-bold flex items-center gap-2 group"
                    >
                        {loading ? 'Submitting...' : 'Submit for Approval'}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEvent;
