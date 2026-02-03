import Swal from 'sweetalert2';

const swalConfig = {
    customClass: {
        popup: 'rounded-[2rem] border-none shadow-2xl',
        title: 'text-2xl font-black text-slate-900 tracking-tight',
        htmlContainer: 'text-slate-500 font-medium',
        confirmButton: 'btn-primary px-8 py-3 rounded-xl font-bold text-lg',
        cancelButton: 'px-8 py-3 rounded-xl font-bold text-lg text-slate-500 hover:bg-slate-100 transition-colors',
    },
    buttonsStyling: false,
};

export const showSuccess = (title, text) => {
    return Swal.fire({
        ...swalConfig,
        title,
        text,
        icon: 'success',
        iconColor: '#10b981',
        confirmButtonText: 'Great!',
    });
};

export const showError = (title, text) => {
    return Swal.fire({
        ...swalConfig,
        title,
        text,
        icon: 'error',
        iconColor: '#ef4444',
        confirmButtonText: 'Understood',
    });
};

export const showWarning = (title, text) => {
    return Swal.fire({
        ...swalConfig,
        title,
        text,
        icon: 'warning',
        iconColor: '#f59e0b',
        confirmButtonText: 'Okay',
    });
};

export const showConfirm = (title, text, confirmText = 'Yes, Proceed', cancelText = 'Cancel') => {
    return Swal.fire({
        ...swalConfig,
        title,
        text,
        icon: 'question',
        iconColor: '#3b82f6',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
    });
};
