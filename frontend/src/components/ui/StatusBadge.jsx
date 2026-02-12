import React from 'react';

const StatusBadge = ({ status, sm = false }) => {
    const styles = {
        // ... (existing styles)
        APPROVED: 'bg-green-100 text-green-700',
        CONFIRMED: 'bg-green-100 text-green-700',
        PENDING: 'bg-amber-100 text-amber-700',
        REJECTED: 'bg-red-100 text-red-700',
        CANCELLED: 'bg-slate-100 text-slate-700',
        ENDED: 'bg-slate-200 text-slate-500',
        UNPAID: 'bg-amber-100 text-amber-700',
        PAID: 'bg-green-500 text-white shadow-green-200 shadow-md',
        ACTIVE: 'bg-green-100 text-green-700',
        BLOCKED: 'bg-red-100 text-red-700',
        COMPLETED: 'bg-amber-500 text-white shadow-amber-200 shadow-md',
        FAILED: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`${sm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 rounded-full text-[10px]'} rounded-full font-black tracking-widest uppercase ${styles[status] || 'bg-slate-100'}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
