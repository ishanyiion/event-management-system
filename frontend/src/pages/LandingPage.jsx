import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Calendar, ArrowRight, Clock } from 'lucide-react';
import { getEventImage, formatEventImage } from '../utils/eventImages';
import api from '../utils/api';

const LandingPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch events
                const eventsRes = await api.get('/events');
                setEvents(eventsRes.data.slice(0, 3)); // Show top 3

                // Fetch real categories
                const catRes = await api.get('/events/categories');
                setCategories(catRes.data.slice(0, 5));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (city) params.append('city', city);
        navigate(`/events?${params.toString()}`);
    };

    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    return (
        <div className="space-y-20 pb-20">
            {/* Hero Section */}
            <section className="relative h-[500px] flex items-center justify-center rounded-3xl overflow-hidden bg-gradient-to-br from-primary-600 to-primary-900 text-white shadow-2xl">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 text-center space-y-8 max-w-3xl px-6">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                        Discover Your Next <span className="text-primary-300">Unforgettable</span> Event
                    </h1>
                    <p className="text-xl text-primary-100 font-light">
                        Book the best weddings, corporate events, and music festivals with ease.
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-xl text-slate-800">
                            <Search className="text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="bg-transparent outline-none w-full"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-xl text-slate-800">
                            <MapPin className="text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Select city..."
                                className="bg-transparent outline-none w-full"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="bg-primary-500 hover:bg-primary-400 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            Explore Now
                        </button>
                    </div>
                </div>
            </section>

            {/* Featured Events Section */}
            {!loading && events.length > 0 && (
                <section className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-slate-900 border-l-4 border-primary-500 pl-4">Featured Events</h2>
                        <Link to="/events" className="text-primary-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
                            View All Events <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <Link key={event.id} to={`/event/${event.id}`} className="group card hover:shadow-2xl transition-all duration-300">
                                <div className="h-48 overflow-hidden relative">
                                    <img
                                        src={formatEventImage(event.banner_url) || getEventImage(event.category_name, event.title)}
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => handleImageError(e, event.category_name, event.title)}
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-primary-600 shadow-sm uppercase">
                                            {event.category_name}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 space-y-3">
                                    <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">{event.title}</h3>
                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{event.city}</span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold">{new Date(event.start_date).toLocaleDateString('en-GB')}</span>
                                        </div>
                                        <span className="text-xs font-black text-primary-500">Explore Details</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Featured Categories */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold text-slate-900">Popular Categories</h2>
                    <button
                        onClick={() => navigate('/events')}
                        className="text-primary-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                    >
                        See all categories <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                    {(categories.length > 0 ? categories.map(c => c.name) : ['Corporate', 'Music', 'Workshop', 'Tech Conference', 'Art Exhibition']).map((cat) => (
                        <div
                            key={cat}
                            onClick={() => navigate(`/events?category=${cat}`)}
                            className="group relative h-48 bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-primary-500 hover:shadow-xl transition-all cursor-pointer"
                        >
                            <img
                                src={getEventImage(cat)}
                                alt={cat}
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500"
                                onError={(e) => { e.target.src = getEventImage('default'); }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                            <div className="relative h-full p-6 flex flex-col justify-end items-center gap-2">
                                <span className="font-bold text-white text-lg drop-shadow-md">{cat}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="bg-slate-900 text-white rounded-3xl p-12 lg:p-20 overflow-hidden relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold">Manage Your Events Effortlessly</h2>
                        <p className="text-slate-400 text-lg">
                            Our platform provides powerful tools for organizers to create, manage, and scale their events while offering clients a seamless booking experience.
                        </p>
                        <ul className="space-y-4">
                            {['Role-Based Access Control', 'Capacity Validation', 'UPI Payment Integration', 'Real-time Analytics'].map((feature) => (
                                <li key={feature} className="flex items-center gap-3 text-slate-200">
                                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => navigate('/register?role=ORGANIZER')}
                            className="btn-primary mt-4"
                        >
                            Join as Organizer
                        </button>
                    </div>
                    <div className="hidden lg:block">
                        <div className="bg-gradient-to-tr from-primary-500/20 to-primary-500/5 aspect-square rounded-full flex items-center justify-center">
                            <div className="w-3/4 h-3/4 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
