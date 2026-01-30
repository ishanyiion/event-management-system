import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export const generateTicketPDF = async (ticket, booking) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const ticketType = ticket.package_name.toUpperCase();
    const isVIP = ticketType.includes('VIP');
    const isBasic = ticketType.includes('BASIC') || ticketType.includes('GENERAL');

    // Theme Colors (RGB)
    let primaryColor = [16, 185, 129]; // Green (Default)
    let accentColor = [209, 250, 229];
    let badgeText = 'OFFICIAL PASS';

    if (isVIP) {
        primaryColor = [217, 119, 6]; // Gold/Amber
        accentColor = [255, 251, 235]; // Gold accent
        badgeText = 'PREMIUM VIP';
    } else if (isBasic) {
        primaryColor = [37, 99, 235]; // Blue
        accentColor = [239, 246, 255]; // Blue accent
        badgeText = 'STANDARD PASS';
    }

    // 1. Header Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 60, 'F');

    // 2. EventHub Logo / Branding
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('EventHub', 20, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Your Gateway to Unforgettable Experiences', 20, 32);

    // 3. Ticket ID in Header
    doc.setFontSize(9);
    doc.text(`TICKET ID: ${ticket.ticket_number}`, 190, 15, { align: 'right' });

    // 4. Main Event Section
    doc.setFillColor(...accentColor);
    doc.roundedRect(15, 45, 180, 220, 10, 10, 'F');
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, 45, 180, 220, 10, 10, 'D');

    // 5. Event Name (Centered)
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    const eventTitle = booking.event_title.toUpperCase();
    const midPoint = 105;
    doc.text(eventTitle, midPoint, 75, { align: 'center' });

    // 6. Ticket Type Badge
    doc.setFillColor(...primaryColor);
    doc.roundedRect(midPoint - 25, 85, 50, 10, 5, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(badgeText, midPoint, 91.5, { align: 'center' });

    // 7. Details Grid
    const gridY = 115;
    const labelX = 30;
    const valueX = 100;

    const drawRow = (label, value, y) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(label.toUpperCase(), labelX, y);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(value, labelX, y + 8);
    };

    drawRow('Attendee Name', booking.user_name, gridY);
    const formattedDates = booking.booked_date ?
        booking.booked_date.split(',').map(d => new Date(d).toLocaleDateString('en-GB')).join(', ')
        : 'N/A';
    drawRow('Event Date', formattedDates, gridY + 25);
    drawRow('Package Type', ticket.package_name, gridY + 50);
    drawRow('Entry Status', 'Single Entry • Non-Transferable', gridY + 75);

    // 8. QR Code Generation
    try {
        const qrDataUrl = await QRCode.toDataURL(ticket.ticket_number, {
            margin: 1,
            width: 200,
            color: {
                dark: '#1e293b',
                light: '#ffffff'
            }
        });
        doc.addImage(qrDataUrl, 'PNG', 135, gridY, 50, 50);

        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('SCAN FOR VALIDATION', 160, gridY + 55, { align: 'center' });
    } catch (err) {
        console.error('QR Gen Failed', err);
    }

    // 9. Verified Badge
    const footerY = 240;
    doc.setFillColor(220, 252, 231); // green-100
    doc.roundedRect(30, footerY, 35, 8, 4, 4, 'F');
    doc.setTextColor(21, 128, 61); // green-700
    doc.setFontSize(9);
    doc.text('VERIFIED', 47.5, footerY + 5.5, { align: 'center' });

    // 10. Footer info
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('This ticket is system generated and must be presented at the venue.', 105, 260, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 105, 265, { align: 'center' });

    // 11. Download the PDF
    doc.save(`Ticket_${ticket.ticket_number}.pdf`);
};
