import React from 'react';
import { Link } from 'react-router-dom';
import { getEventImage, formatEventImage } from '../../utils/eventImages';
import { showConfirm, showSuccess, showError } from '../../utils/swalHelper';
import api from '../../utils/api';
import StatusBadge from '../ui/StatusBadge';

const OrganizerEventCard = ({ item, items, setItems, navigate }) => {
    const isEventPast = (dateStr) => {
        if (!dateStr) return false;
        const end = new Date(dateStr);
        end.setHours(23, 59, 59, 999);
        return end < new Date();
    };

    const handleImageError = (e, category, title) => {
        e.target.src = getEventImage(category, title);
    };

    return (
        <div key={item.id} className="relative group">
            <Link
                to={`/event/analytics/${item.id}`}
                className="card p-6 flex items-center justify-between hover:border-primary-300 hover:shadow-lg transition-all border-2 border-transparent bg-white shadow-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-slate-400">
                        <img
                            src={formatEventImage(item.banner_url) || getEventImage(item.category_name, item.title || item.event_title)}
                            alt=""
                            className="w-full h-full object-cover uppercase"
                            onError={(e) => handleImageError(e, item.category_name, item.title || item.event_title)}
                        />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                            {item.title || item.event_title}
                        </h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            {item.city}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <StatusBadge status={item.status || item.booking_status} />
                    {item.status === 'APPROVED' && !isEventPast(item.end_date) && (
                        <>
                            {item.edit_permission === 'SUBMITTED' ? (
                                <button
                                    disabled
                                    className="px-4 py-2 text-xs font-bold text-blue-400 bg-blue-50 rounded-xl border border-blue-100 cursor-not-allowed"
                                >
                                    Review Pending
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        navigate(`/edit-event/${item.id}`);
                                    }}
                                    className="px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-100 shadow-sm transition-all hover:scale-105"
                                >
                                    Propose Edits
                                </button>
                            )}
                        </>
                    )}
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const result = await showConfirm('Delete Event?', 'Are you sure you want to delete this event? This action cannot be undone.');
                            if (result.isConfirmed) {
                                try {
                                    await api.delete(`/events/${item.id}`);
                                    setItems(items.filter(i => i.id !== item.id));
                                    showSuccess('Deleted', 'Event has been deleted successfully.');
                                } catch (err) {
                                    showError('Delete Failed', err.response?.data?.message || 'Failed to delete event.');
                                }
                            }
                        }}
                        className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 z-10"
                    >
                        Delete
                    </button>
                </div>
            </Link>
        </div>
    );
};

export default OrganizerEventCard;
