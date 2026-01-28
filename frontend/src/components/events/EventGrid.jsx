import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Tag, ArrowRight, Trash2, Clock, CheckCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { getEventImage, formatEventImage } from '../../utils/eventImages';
import { formatTimeAMPM } from '../../utils/formatTime';

const EventGrid = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        city: searchParams.get('city') || '',
        category: searchParams.get('category') || '',
        search: searchParams.get('search') || ''
    });

    useEffect(() => {
        setFilters({
            city: searchParams.get('city') || '',
            category: searchParams.get('category') || '',
            search: searchParams.get('search') || ''
        });
    }, [searchParams]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get('/events', { params: filters });
                setEvents(res.data);
            } catch (err) {
                console.error('Failed to fetch events', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [filters]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/events/categories');
                setCategories(res.data);
            } catch (err) {
                console.error('Failed to fetch categories', err);
            }
        };
        fetchCategories();
    }, []);

    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    return (
        <div className="space-y-8">
            {/* Filters Hub */}
            <div className="card p-4 grid md:grid-cols-4 gap-4 bg-white/50 backdrop-blur-sm border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="input pl-9 py-2 text-sm"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter by city..."
                        className="input pl-9 py-2 text-sm"
                        value={filters.city}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    />
                </div>
                <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        list="category-options"
                        placeholder="Search category..."
                        className="input pl-9 py-2 text-sm"
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    />
                    <datalist id="category-options">
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name} />
                        ))}
                    </datalist>
                </div>
                <div className="flex items-center justify-end px-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{events.length} Events Found</span>
                </div>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card h-80 animate-pulse bg-slate-100" />
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No events found</h3>
                    <p className="text-slate-500">Try adjusting your filters or search terms.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event) => (
                        <div key={event.id} className="group card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative">
                            <Link to={`/event/${event.id}`}>
                                <div className="relative h-48 bg-slate-200 overflow-hidden">
                                    <img
                                        src={formatEventImage(event.banner_url) || getEventImage(event.category_name, event.title)}
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => handleImageError(e, event.category_name, event.title)}
                                    />
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary-600 shadow-sm">
                                            {event.category_name}
                                        </div>
                                        {new Date(event.end_date) < new Date() && (
                                            <div className="bg-amber-500/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Completed
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">{event.title}</h3>
                                        <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                            <MapPin className="w-4 h-4" />
                                            <span>{event.city}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="text-slate-500 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm font-medium">
                                                    {new Date(event.start_date).toLocaleDateString('en-GB')} - {new Date(event.end_date).toLocaleDateString('en-GB')}
                                                </span>
                                            </div>
                                            {event.start_time && (
                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{formatTimeAMPM(event.start_time)} - {formatTimeAMPM(event.end_time)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-primary-600 font-bold">
                                            View Details <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventGrid;
