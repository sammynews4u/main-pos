const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization"); // Protect this route!

// 1. ADD A PRODUCT
router.post("/", authorization, async (req, res) => {
    try {
        const { name, cost_price, selling_price, stock_quantity } = req.body;
        
        // We get business_id from the token (req.user), not from the body!
        // This prevents users from hacking data into other businesses.
        const newProduct = await pool.query(
            "INSERT INTO products (business_id, name, cost_price, selling_price, stock_quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [req.user.business_id, name, cost_price, selling_price, stock_quantity]
        );

        res.json(newProduct.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// 2. GET ALL PRODUCTS (For the logged-in business only)
router.get("/", authorization, async (req, res) => {
    try {
        const allProducts = await pool.query(
            "SELECT * FROM products WHERE business_id = $1 ORDER BY id DESC",
            [req.user.business_id]
        );
        
        res.json(allProducts.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;

// ... existing POST and GET routes ...

// 3. DELETE A PRODUCT
router.delete("/:id", authorization, async (req, res) => {
    try {
        const { id } = req.params;
        
        // DELETE query: strict check to ensure user only deletes THEIR OWN product
        const deleteProduct = await pool.query(
            "DELETE FROM products WHERE id = $1 AND business_id = $2 RETURNING *",
            [id, req.user.business_id]
        );

        if (deleteProduct.rows.length === 0) {
            return res.json("This product is not yours");
        }

        res.json("Product was deleted!");

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;