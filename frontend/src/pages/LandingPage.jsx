import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, ArrowRight } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (city) params.append('city', city);
        navigate(`/events?${params.toString()}`);
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
                    {['Wedding', 'Corporate', 'Music', 'Birthday', 'Workshop'].map((cat) => (
                        <div
                            key={cat}
                            onClick={() => navigate(`/events?category=${cat}`)}
                            className="group relative h-40 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary-500 hover:shadow-xl transition-all cursor-pointer"
                        >
                            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-slate-700">{cat}</span>
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
