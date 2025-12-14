const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

router.post("/checkout", authorization, async (req, res) => {
    // 1. Get the data from Frontend
    const { total_amount, cart } = req.body; // cart is an array of items
    const business_id = req.user.business_id;

    // Use a separate client for Transaction
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Start Transaction

        // 2. Generate a Receipt Number (Simple timestamp based)
        const receipt_no = "REC-" + Date.now();

        // 3. Insert into SALES table
        const newSale = await client.query(
            "INSERT INTO sales (business_id, user_id, total_amount, receipt_no, payment_method) VALUES ($1, $2, $3, $4, 'CASH') RETURNING id",
            [business_id, req.user.id, total_amount, receipt_no]
        );
        const sale_id = newSale.rows[0].id;

        // 4. Process each item in the Cart
        for (let item of cart) {
            // item = { id, name, price, quantity, cost_price }
            
            // A. Insert into SALE_ITEMS
            await client.query(
                "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_cost) VALUES ($1, $2, $3, $4, $5)",
                [sale_id, item.id, item.quantity, item.selling_price, item.cost_price]
            );

            // B. Subtract Stock from PRODUCTS
            await client.query(
                "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
                [item.quantity, item.id]
            );
        }

        await client.query('COMMIT'); // Save changes
        res.json({ message: "Sale Successful", receipt_no });

    } catch (err) {
        await client.query('ROLLBACK'); // Undo if error
        console.error(err.message);
        res.status(500).send("Server Error");
    } finally {
        client.release();
    }
});
// ... existing checkout route ...

// 2. GET ALL SALES (History)
router.get("/", authorization, async (req, res) => {
    try {
        const sales = await pool.query(
            "SELECT * FROM sales WHERE business_id = $1 ORDER BY sale_date DESC",
            [req.user.business_id]
        );
        res.json(sales.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
module.exports = router;