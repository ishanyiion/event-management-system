import React from 'react';
import { Link } from 'react-router-dom';
import { Trash } from 'lucide-react';
import { getEventImage, formatEventImage } from '../../utils/eventImages';
import StatusBadge from '../ui/StatusBadge';

const BookingCard = ({ item, navigate, expired, onRemove }) => {
    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    return (
        <Link
            to={`/booking/view/${item.id}`}
            className={`card p-6 flex items-center justify-between transition-all border-2 shadow-sm ${expired
                ? 'opacity-80 border-slate-100'
                : 'hover:border-primary-300 hover:shadow-lg border-transparent'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center ${expired ? 'bg-slate-200' : 'bg-slate-100'}`}>
                    <img
                        src={formatEventImage(item.banner_url) || getEventImage(item.category_name, item.title || item.event_title)}
                        alt=""
                        className={`w-full h-full object-cover ${expired ? 'opacity-50' : ''}`}
                        onError={(e) => handleImageError(e, item.category_name, item.title || item.event_title)}
                    />
                </div>
                <div>
                    <h4 className={`font-black uppercase tracking-tight ${expired ? 'text-slate-500' : 'text-slate-900'}`}>{item.title || item.event_title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1">
                        <span className={`font-black mr-2 ${expired ? 'text-slate-400' : 'text-primary-600'}`}>
                            {item.booked_date ?
                                item.booked_date.split(',').map(d => {
                                    const [y, m, day] = d.split('-');
                                    return `${day}/${m}/${y}`;
                                }).join(', ')
                                : 'N/A'}
                        </span>
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {!expired && item.payment_status === 'UNPAID' && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/booking/confirm/${item.id}`);
                        }}
                        className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105"
                    >
                        Pay Now
                    </button>
                )}
                {onRemove && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove Request"
                    >
                        <Trash className="w-5 h-5" />
                    </button>
                )}
                <StatusBadge status={expired ? 'ENDED' : (item.payment_status === 'PAID' ? 'PAID' : (item.status || item.booking_status))} />
            </div>
        </Link>
    );
};

export default BookingCard;
