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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch upcoming events for featured carousel
                const eventsRes = await api.get('/events', { params: { upcoming: true } });
                setEvents(eventsRes.data.slice(0, 6)); // Show top 6 for carousel

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

    useEffect(() => {
        if (!loading && events.length > 0 && !isPaused) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % events.length);
            }, 5000); // Slide every 5 seconds
            return () => clearInterval(timer);
        }
    }, [loading, events.length, isPaused]);

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
                <section className="space-y-8 relative group/carousel">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-slate-900 border-l-4 border-primary-500 pl-4">Featured Events</h2>
                        <Link to="/events" className="text-primary-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
                            View All Events <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div
                        className="relative overflow-hidden rounded-3xl"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        {/* Carousel Track */}
                        <div
                            className="flex transition-transform duration-700 ease-in-out"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {events.map((event) => (
                                <div key={event.id} className="w-full flex-shrink-0 px-4">
                                    <Link to={`/event/${event.id}`} className="group card flex flex-col md:flex-row overflow-hidden hover:shadow-2xl transition-all duration-500 border-none bg-white p-0 h-[400px] md:h-[300px]">
                                        <div className="w-full md:w-1/2 h-48 md:h-full overflow-hidden relative">
                                            <img
                                                src={formatEventImage(event.banner_url) || getEventImage(event.category_name, event.title)}
                                                alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                onError={(e) => handleImageError(e, event.category_name, event.title)}
                                            />
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-primary-600 shadow-sm uppercase">
                                                    {event.category_name}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-8 md:w-1/2 flex flex-col justify-center space-y-4">
                                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2 uppercase tracking-tight leading-tight">
                                                {event.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-4 text-slate-500 font-medium pt-2">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-primary-500" />
                                                    <span>{event.city}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-primary-500" />
                                                    <span>{new Date(event.start_date).toLocaleDateString('en-GB')}</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-400 line-clamp-2 text-sm leading-relaxed">
                                                {event.description}
                                            </p>
                                            <div className="pt-4">
                                                <span className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl font-bold group-hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/20 uppercase text-xs tracking-widest">
                                                    Book Tickets <ArrowRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={() => setCurrentIndex((prev) => (prev - 1 + events.length) % events.length)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-white z-10"
                        >
                            <ArrowRight className="w-6 h-6 rotate-180" />
                        </button>
                        <button
                            onClick={() => setCurrentIndex((prev) => (prev + 1) % events.length)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-white z-10"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Indicators */}
                    <div className="flex justify-center gap-2">
                        {events.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-1.5 transition-all duration-300 rounded-full ${currentIndex === idx ? 'w-8 bg-primary-600' : 'w-2 bg-slate-200'}`}
                            />
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
