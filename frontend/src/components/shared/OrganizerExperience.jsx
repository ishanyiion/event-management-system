import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, CreditCard, BarChart3, ArrowRight, Zap } from 'lucide-react';

const OrganizerExperience = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <ShieldCheck className="w-5 h-5 text-primary-400" />,
            title: "Access Control",
            description: "Advanced role-based access to manage your team securely."
        },
        {
            icon: <Users className="w-5 h-5 text-primary-400" />,
            title: "Capacity Control",
            description: "Real-time validation and management of event attendance."
        },
        {
            icon: <CreditCard className="w-5 h-5 text-primary-400" />,
            title: "UPI Integration",
            description: "Seamless and direct payments using your own UPI IDs."
        },
        {
            icon: <BarChart3 className="w-5 h-5 text-primary-400" />,
            title: "Real-time Analytics",
            description: "Monitor sales and attendance with powerful visual tools."
        }
    ];

    return (
        <section className="bg-slate-900 text-white rounded-3xl p-12 lg:p-20 overflow-hidden relative fade-in-on-scroll">
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto">

                {/* Content Area (Centered) */}
                <div className="space-y-12 flex flex-col items-center text-center">
                    <div className="space-y-4">
                        <span className="text-primary-400 font-black text-xs uppercase tracking-widest px-0">Organizer Experience</span>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                            Manage Your Events <span className="text-primary-500">Effortlessly</span>
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                            Our platform provides powerful tools for organizers to create, manage, and scale their events while offering clients a seamless booking experience.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                        {features.map((feature, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-4 group p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-primary-500/10 group-hover:border-primary-500/30 transition-all shadow-lg">
                                    {feature.icon}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-slate-100 text-base">{feature.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={() => navigate('/register?role=ORGANIZER')}
                            className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 active:scale-95 flex items-center gap-3 group text-lg"
                        >
                            Join as Organizer
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.02); }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-float {
                    animation: float 5s infinite ease-in-out;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s infinite ease-in-out;
                }
                .fade-in-on-scroll {
                    animation: fade-in 1.2s ease-out forwards;
                }
            `}</style>
        </section>
    );
};

export default OrganizerExperience;
