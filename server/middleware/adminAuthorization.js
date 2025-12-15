const pool = require("../db");

module.exports = async (req, res, next) => {
    try {
        // 1. Get the user ID from the previous auth middleware
        // (Note: This middleware must run AFTER the normal 'authorization' middleware)
        const user = await pool.query("SELECT role FROM users WHERE id = $1", [req.user.id]);

        // 2. Check if they are the boss
        if (user.rows[0].role !== "super_admin") {
            return res.status(403).json("Access Denied: Admins Only");
        }

        next(); // Allow them to pass
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};