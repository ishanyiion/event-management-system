const db = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await db.query('SELECT COUNT(*) FROM users');
        const totalOrganizers = await db.query('SELECT COUNT(*) FROM users WHERE role = \'ORGANIZER\'');
        const totalEvents = await db.query('SELECT COUNT(*) FROM events');
        const pendingEvents = await db.query('SELECT COUNT(*) FROM events WHERE status = \'PENDING\'');
        const totalRevenue = await db.query('SELECT SUM(amount) FROM payments WHERE status = \'SUCCESS\'');
        const totalBookings = await db.query('SELECT COUNT(*) FROM bookings');

        res.json({
            totalUsers: parseInt(totalUsers.rows[0].count),
            totalOrganizers: parseInt(totalOrganizers.rows[0].count),
            totalEvents: parseInt(totalEvents.rows[0].count),
            pendingEvents: parseInt(pendingEvents.rows[0].count),
            totalRevenue: parseFloat(totalRevenue.rows[0].sum || 0),
            totalBookings: parseInt(totalBookings.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPendingOrganizers = async (req, res) => {
    try {
        const organisers = await db.query('SELECT id, name, email, created_at FROM users WHERE role = \'ORGANIZER\' AND status = \'PENDING_VERIFICATION\'');
        res.json(organisers.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyOrganizer = async (req, res) => {
    try {
        const { status } = req.body; // ACTIVE or BLOCKED
        const updatedUser = await db.query('UPDATE users SET status = $1 WHERE id = $2 AND role = \'ORGANIZER\' RETURNING id, name, role, status', [status, req.params.id]);
        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPendingEvents = async (req, res) => {
    try {
        const events = await db.query('SELECT e.*, u.name as organizer_name, c.name as category_name FROM events e JOIN users u ON e.organizer_id = u.id LEFT JOIN categories c ON e.category_id = c.id WHERE e.status = \'PENDING\'');
        res.json(events.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getApprovedEvents = async (req, res) => {
    try {
        const events = await db.query('SELECT e.*, u.name as organizer_name, c.name as category_name FROM events e JOIN users u ON e.organizer_id = u.id LEFT JOIN categories c ON e.category_id = c.id WHERE e.status = \'APPROVED\' ORDER BY e.created_at DESC');
        res.json(events.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await db.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
        res.json(users.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // ACTIVE or BLOCKED

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: 'You cannot block your own account' });
        }

        const updatedUser = await db.query(
            'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, email, role, status',
            [status, id]
        );

        if (updatedUser.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getDashboardStats, getPendingOrganizers, verifyOrganizer, getPendingEvents, getApprovedEvents, getAllUsers, toggleUserStatus };
