import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Plus, Trash, ArrowRight, Info, Search, Clock } from 'lucide-react';
import api from '../../utils/api';

const TimeInput12h = ({ value, onChange, className = "" }) => {
    const [h24, m] = (value || "10:00").split(':');
    let h12 = parseInt(h24, 10);
    const ampm = h12 >= 12 ? 'PM' : 'AM';
    h12 = h12 % 12 || 12;

    const updateTime = (newH12, newM, newAMPM) => {
        let hh24 = parseInt(newH12, 10);
        if (newAMPM === 'PM' && hh24 < 12) hh24 += 12;
        if (newAMPM === 'AM' && hh24 === 12) hh24 = 0;
        onChange(`${hh24.toString().padStart(2, '0')}:${newM}`);
    };

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                <select
                    className="bg-transparent py-1 px-1.5 text-sm font-semibold text-slate-700 outline-none border-none cursor-pointer hover:bg-slate-50"
                    value={h12}
                    onChange={(e) => updateTime(e.target.value, m, ampm)}
                >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <option key={h} value={h}>{h}</option>
                    ))}
                </select>
                <div className="self-center text-slate-300 font-bold">:</div>
                <select
                    className="bg-transparent py-1 px-1.5 text-sm font-semibold text-slate-700 outline-none border-none cursor-pointer hover:bg-slate-50"
                    value={m}
                    onChange={(e) => updateTime(h12, e.target.value, ampm)}
                >
                    {['00', '15', '30', '45'].map(min => (
                        <option key={min} value={min}>{min}</option>
                    ))}
                </select>
                <select
                    className="bg-primary-50 py-1 px-2 text-xs font-bold text-primary-600 outline-none border-none cursor-pointer hover:bg-primary-100 transition-colors"
                    value={ampm}
                    onChange={(e) => updateTime(h12, m, e.target.value)}
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
        </div>
    );
};

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
        category_name: '',
    });
    const [schedule, setSchedule] = useState([]);
    const [categories, setCategories] = useState([]);
    const [packages, setPackages] = useState([
        { name: 'Basic', price: 1000, features: 'Basic entry, No snacks', capacity: 50 }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await api.get('/events/categories');
                setCategories(res.data);
            } catch (err) {
                console.error('Failed to fetch categories');
            }
        };
        fetchCats();
    }, []);

    useEffect(() => {
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const days = [];
            let current = new Date(start);

            while (current <= end) {
                const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                days.push(dateStr);
                current.setDate(current.getDate() + 1);
            }

            const newSchedule = days.map(date => {
                const existing = schedule.find(s => s.date === date);
                // Default to 10:00 AM - 6:00 PM if new day, with global max_capacity
                return existing || { date, startTime: '10:00', endTime: '18:00', capacity: formData.max_capacity };
            });
            setSchedule(newSchedule);
        }
    }, [formData.start_date, formData.end_date]);

    const handleAddPackage = () => {
        setPackages([...packages, { name: '', price: 0, features: '', capacity: 50 }]);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validation: Max 5 images
        if (selectedFiles.length + files.length > 5) {
            alert('Maximum 5 images allowed');
            return;
        }

        const newFiles = [...selectedFiles, ...files];
        setSelectedFiles(newFiles);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeImage = (index) => {
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const handleRemovePackage = (index) => {
        setPackages(packages.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedFiles.length === 0) {
            setError('At least one event image is compulsory.');
            return;
        }

        const hasZeroCapacity = packages.some(pkg => parseInt(pkg.capacity || 0) <= 0);
        if (hasZeroCapacity) {
            setError('Each package must have at least 1 ticket.');
            return;
        }

        const totalPackageCapacity = packages.reduce((sum, pkg) => sum + parseInt(pkg.capacity || 0), 0);
        if (totalPackageCapacity !== parseInt(formData.max_capacity)) {
            setError(`Total package capacity (${totalPackageCapacity}) must exactly match the event capacity (${formData.max_capacity})`);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const formDataToSend = new FormData();

            // Append basic info
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            // For backward compatibility and main view, pick first day's timing
            const primaryStart = schedule[0]?.startTime || '10:00';
            const primaryEnd = schedule[0]?.endTime || '18:00';

            formDataToSend.append('start_time', primaryStart);
            formDataToSend.append('end_time', primaryEnd);

            // Append complex objects as JSON strings
            formDataToSend.append('packages', JSON.stringify(packages));
            formDataToSend.append('schedule', JSON.stringify(schedule));

            // Append images
            selectedFiles.forEach(file => {
                formDataToSend.append('images', file);
            });

            await api.post('/events/create', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

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
                <div className="space-y-6">
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
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            list="category-suggestions"
                                            className="input pl-10"
                                            placeholder="Pick or type..."
                                            value={formData.category_name}
                                            onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                                            required
                                        />
                                        <datalist id="category-suggestions">
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name} />
                                            ))}
                                        </datalist>
                                    </div>
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

                    {/* Images Section */}
                    <div className="card p-8 space-y-6">
                        <h3 className="text-xl font-bold text-slate-900 border-l-4 border-primary-500 pl-3">Event Media <span className="text-red-500">*</span></h3>
                        <p className="text-xs text-slate-500 italic">Upload at least one high-quality image. You can add up to 5 images.</p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                {previews.map((src, index) => (
                                    <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group">
                                        <img src={src} className="w-full h-full object-cover" alt="" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-white/80 backdrop-blur p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash className="w-3 h-3" />
                                        </button>
                                        {index === 0 && (
                                            <div className="absolute bottom-0 inset-x-0 bg-primary-600/80 text-white text-[10px] font-bold text-center py-0.5">COVER</div>
                                        )}
                                    </div>
                                ))}
                                {selectedFiles.length < 5 && (
                                    <label className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-primary-400 hover:bg-primary-50/30 transition-all flex flex-col items-center justify-center cursor-pointer gap-1">
                                        <Plus className="w-6 h-6 text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Add Photo</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                )}
                            </div>
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

                        {schedule.length > 0 && (
                            <div className="pt-2 space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Day-wise Timing
                                </label>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {schedule.map((item, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-3">
                                            <div className="font-bold text-slate-700 text-sm w-24">
                                                {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </div>
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    type="number"
                                                    className="input py-1 px-2 text-xs w-20"
                                                    placeholder="Cap"
                                                    title="Daily Capacity"
                                                    value={item.capacity}
                                                    onChange={(e) => {
                                                        const newS = [...schedule];
                                                        newS[idx].capacity = e.target.value;
                                                        setSchedule(newS);
                                                    }}
                                                />
                                                <TimeInput12h
                                                    value={item.startTime}
                                                    onChange={(val) => {
                                                        const newS = [...schedule];
                                                        newS[idx].startTime = val;
                                                        setSchedule(newS);
                                                    }}
                                                />
                                                <div className="text-slate-400 text-xs font-bold">TO</div>
                                                <TimeInput12h
                                                    value={item.endTime}
                                                    onChange={(val) => {
                                                        const newS = [...schedule];
                                                        newS[idx].endTime = val;
                                                        setSchedule(newS);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                                    <label className="text-xs font-bold text-slate-400 uppercase">Capacity (Tickets)</label>
                                    <input
                                        type="number"
                                        className="input py-1.5"
                                        placeholder="e.g., 50"
                                        value={pkg.capacity}
                                        onChange={(e) => {
                                            const newPkgs = [...packages];
                                            newPkgs[index].capacity = e.target.value;
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
