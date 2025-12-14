const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

router.get("/", authorization, async (req, res) => {
    try {
        // 1. Get User Name
        const user = await pool.query(
            "SELECT full_name FROM users WHERE id = $1", 
            [req.user.id]
        );

        // 2. Get Total Sales Sum (Money made)
        const sales = await pool.query(
            "SELECT SUM(total_amount) as total FROM sales WHERE business_id = $1",
            [req.user.business_id]
        );

        // 3. Get Total Inventory Count (How many products)
        const stock = await pool.query(
            "SELECT COUNT(*) as total_items FROM products WHERE business_id = $1",
            [req.user.business_id]
        );

        // Send all data back as one JSON object
        res.json({
            full_name: user.rows[0].full_name,
            total_sales: sales.rows[0].total || 0, // Return 0 if no sales yet
            total_items: stock.rows[0].total_items || 0
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;