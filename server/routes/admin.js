const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const adminAuthorization = require("../middleware/adminAuthorization");

// Apply double security: Must be Logged In + Must be Super Admin
router.use(authorization); 
router.use(adminAuthorization);

// 1. GET SYSTEM STATS
router.get("/stats", async (req, res) => {
    try {
        // Count total businesses
        const businesses = await pool.query("SELECT COUNT(*) FROM businesses");
        
        // Count total users
        const users = await pool.query("SELECT COUNT(*) FROM users");
        
        // Sum of TOTAL SALES processed by the platform (Global Volume)
        const totalVolume = await pool.query("SELECT SUM(total_amount) FROM sales");

        res.json({
            total_businesses: businesses.rows[0].count,
            total_users: users.rows[0].count,
            total_volume: totalVolume.rows[0].sum || 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// 2. GET ALL USERS (With Business Names)
router.get("/users", async (req, res) => {
    try {
        const allUsers = await pool.query(`
            SELECT u.id, u.full_name, u.email, u.role, u.is_active, u.created_at, b.company_name 
            FROM users u 
            JOIN businesses b ON u.business_id = b.id
            ORDER BY u.created_at DESC
        `);
        res.json(allUsers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// 3. ACTIVATE / SUSPEND USER
router.put("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body; // true or false

        await pool.query(
            "UPDATE users SET is_active = $1 WHERE id = $2",
            [is_active, id]
        );

        res.json(`User status updated to ${is_active}`);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;