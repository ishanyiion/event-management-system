import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Calendar, MapPin, Tag, Smartphone } from 'lucide-react';
import api from '../../utils/api';
import { showConfirm, showSuccess, showError } from '../../utils/swalHelper';

const ReviewEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${id}`);
                setEvent(res.data);
            } catch (err) {
                console.error(err);
                showError('Error', 'Failed to fetch event details');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Loading review data...</div>;
    if (!event) return <div className="p-10 text-center text-red-500">Event not found.</div>;

    const isInitial = event.status === 'PENDING';
    const proposed = isInitial ? event : (typeof event.proposed_data === 'string' ? JSON.parse(event.proposed_data) : event.proposed_data);

    if (!isInitial && !proposed) return <div className="p-10 text-center text-red-500">No proposed data found for this event.</div>;

    const handleApprove = async () => {
        const title = isInitial ? 'Approve Event?' : 'Approve Changes?';
        const msg = isInitial ? 'This will make the event live on the platform.' : 'This will apply the proposed changes to the live event.';
        const result = await showConfirm(title, msg);

        if (result.isConfirmed) {
            try {
                if (isInitial) {
                    await api.put(`/events/approve/${id}`);
                    showSuccess('Approved', 'Event is now live.');
                } else {
                    await api.put(`/events/approve-update/${id}`);
                    showSuccess('Approved', 'Changes have been applied to the live event.');
                }
                navigate('/dashboard');
            } catch (err) {
                showError('Error', err.response?.data?.message || 'Failed to approve');
            }
        }
    };

    const handleReject = async () => {
        const title = isInitial ? 'Reject Event?' : 'Reject Changes?';
        const msg = isInitial ? 'This will delete the event submission.' : 'Proposed changes will be discarded. The organizer can resubmit.';
        const result = await showConfirm(title, msg);

        if (result.isConfirmed) {
            try {
                if (isInitial) {
                    await api.delete(`/events/${id}`);
                    showSuccess('Rejected', 'Event submission deleted.');
                } else {
                    await api.put(`/events/reject-update/${id}`);
                    showSuccess('Rejected', 'Proposed changes have been discarded.');
                }
                navigate('/dashboard');
            } catch (err) {
                showError('Error', err.response?.data?.message || 'Failed to reject');
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
                <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>

            <header className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${isInitial ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {isInitial ? 'New Event Approval' : 'Edit Review'}
                        </span>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {isInitial ? `Review New Event: ${event.title}` : `Proposed Changes: ${event.title}`}
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium">
                        {isInitial ? 'Review the full details before making the event live.' : 'Review the differences before updating the live event.'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleReject}
                        className="px-8 py-3 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all border border-red-100 flex items-center gap-2"
                    >
                        <XCircle className="w-5 h-5" /> {isInitial ? 'Reject & Delete' : 'Reject Update'}
                    </button>
                    <button
                        onClick={handleApprove}
                        className="px-8 py-3 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" /> {isInitial ? 'Approve & Live' : 'Approve Update'}
                    </button>
                </div>
            </header>

            <div className="grid lg:grid-cols-2 gap-8 text-left">
                {/* Basic Info Comparison */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Tag className="w-6 h-6 text-primary-500" /> Basic Information
                    </h3>
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden text-left">
                        <ComparisonRow label="Event Title" oldVal={isInitial ? '--' : event.title} newVal={proposed.title} isInitial={isInitial} />
                        <ComparisonRow label="Description" oldVal={isInitial ? '--' : event.description} newVal={proposed.description} isInitial={isInitial} />
                        <ComparisonRow label="Location" oldVal={isInitial ? '--' : event.location} newVal={proposed.location} isInitial={isInitial} />
                        <ComparisonRow label="City" oldVal={isInitial ? '--' : event.city} newVal={proposed.city} isInitial={isInitial} />
                        <ComparisonRow label="UPI ID" oldVal={isInitial ? '--' : event.upi_id} newVal={proposed.upi_id} isInitial={isInitial} />
                        <ComparisonRow label="Max Capacity" oldVal={isInitial ? '--' : event.max_capacity} newVal={proposed.max_capacity} isInitial={isInitial} />
                    </div>
                </div>

                {/* Timing Comparison */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-indigo-500" /> Date & Time
                    </h3>
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden text-left">
                        <ComparisonRow label="Start Date" oldVal={isInitial ? '--' : event.start_date} newVal={proposed.start_date} isInitial={isInitial} />
                        <ComparisonRow label="End Date" oldVal={isInitial ? '--' : event.end_date} newVal={proposed.end_date} isInitial={isInitial} />
                        <ComparisonRow label="Start Time" oldVal={isInitial ? '--' : event.start_time} newVal={proposed.start_time} isInitial={isInitial} />
                        <ComparisonRow label="End Time" oldVal={isInitial ? '--' : event.end_time} newVal={proposed.end_time} isInitial={isInitial} />
                    </div>
                </div>
            </div>

            {/* Packages & Schedule (Simplified for now, can be expanded) */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-amber-500" /> Structured Data Updates
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="card p-6 bg-white border-2 border-slate-50 text-left">
                        <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-4">Packages Update</h4>
                        <p className="text-sm text-slate-500">
                            The organizer has proposed a full update to the event packages.
                            <span className="block mt-2 font-bold text-indigo-600">
                                {proposed.packages?.length} packages submitted.
                            </span>
                        </p>
                    </div>
                    <div className="card p-6 bg-white border-2 border-slate-50 text-left">
                        <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-4">Schedule Update</h4>
                        <p className="text-sm text-slate-500">
                            The organizer has proposed a full update to the event schedule sequence.
                            <span className="block mt-2 font-bold text-indigo-600">
                                {proposed.schedule?.length} dates/slots submitted.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ComparisonRow = ({ label, oldVal, newVal, isInitial }) => {
    const isChanged = String(oldVal) !== String(newVal);

    return (
        <div className="border-b border-slate-50 last:border-0 p-6 flex flex-col sm:flex-row gap-4">
            <div className="sm:w-1/4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
            <div className="sm:w-3/4 grid sm:grid-cols-2 gap-4">
                {!isInitial && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current</p>
                        <p className="text-sm text-slate-600 line-clamp-3">{oldVal || 'None'}</p>
                    </div>
                )}
                <div className={`p-3 rounded-xl transition-all ${isInitial ? 'col-span-2 bg-amber-50 border border-amber-200' : (isChanged ? 'bg-green-50 border border-green-200' : 'bg-slate-50')}`}>
                    <p className={`text-[10px] font-bold uppercase mb-1 ${isInitial ? 'text-amber-600' : (isChanged ? 'text-green-600' : 'text-slate-400')}`}>
                        {isInitial ? 'Submitted Value' : (isChanged ? 'Proposed Change' : 'Same')}
                    </p>
                    <p className={`text-sm font-medium ${isInitial ? 'text-amber-900' : (isChanged ? 'text-green-900' : 'text-slate-600')} line-clamp-3`}>
                        {newVal || 'None'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReviewEdit;
