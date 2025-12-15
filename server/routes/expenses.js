const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// 1. ADD EXPENSE
router.post("/", authorization, async (req, res) => {
    try {
        const { title, amount, description, expense_date } = req.body;
        const newExpense = await pool.query(
            "INSERT INTO expenses (business_id, title, amount, description, expense_date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [req.user.business_id, title, amount, description, expense_date || new Date()]
        );
        res.json(newExpense.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// 2. GET EXPENSES (Recent 50)
router.get("/", authorization, async (req, res) => {
    try {
        const expenses = await pool.query(
            "SELECT * FROM expenses WHERE business_id = $1 ORDER BY expense_date DESC LIMIT 50",
            [req.user.business_id]
        );
        res.json(expenses.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;