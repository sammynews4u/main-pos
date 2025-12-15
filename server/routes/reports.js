const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

router.post("/", authorization, async (req, res) => {
    try {
        const { start_date, end_date } = req.body;
        const business_id = req.user.business_id;

        // SQL UNION: Combines Sales (Income) and Expenses into one list
        const query = `
            SELECT 'income' as type, sale_date as date, 'Sale Receipt #' || receipt_no as description, total_amount as amount 
            FROM sales 
            WHERE business_id = $1 AND sale_date BETWEEN $2 AND $3
            
            UNION ALL
            
            SELECT 'expense' as type, expense_date as date, title as description, amount 
            FROM expenses 
            WHERE business_id = $1 AND expense_date BETWEEN $2 AND $3
            
            ORDER BY date DESC;
        `;

        // Default to "Last 30 Days" if no dates provided
        const start = start_date || new Date(new Date().setDate(new Date().getDate() - 30));
        const end = end_date || new Date();

        const report = await pool.query(query, [business_id, start, end]);

        // Calculate Totals
        let totalIncome = 0;
        let totalExpense = 0;

        report.rows.forEach(row => {
            if (row.type === 'income') totalIncome += Number(row.amount);
            if (row.type === 'expense') totalExpense += Number(row.amount);
        });

        res.json({
            transactions: report.rows,
            summary: {
                total_income: totalIncome,
                total_expense: totalExpense,
                net_profit: totalIncome - totalExpense
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;