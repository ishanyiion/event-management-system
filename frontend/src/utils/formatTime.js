/**
 * Formats a 24h time string (e.g., "14:30" or "14:30:00") into 12h AM/PM format.
 * @param {string} timeStr - The 24h time string
 * @returns {string} - Formatted time (e.g., "02:30 PM")
 */
export const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return '';

    // Split the time string and take hours and minutes
    const [hours24, minutes] = timeStr.split(':');
    let hours = parseInt(hours24, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const minutesStr = minutes.padStart(2, '0');

    return `${hours.toString().padStart(2, '0')}:${minutesStr} ${ampm}`;
};
