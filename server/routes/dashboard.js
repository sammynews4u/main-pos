const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

router.get("/", authorization, async (req, res) => {
    try {
        const { period } = req.query; // 'today', 'month', 'year', or 'all'
        const business_id = req.user.business_id;

        // 1. Determine Date Filter
        let dateQuery = "";
        if (period === "today") {
            dateQuery = "AND sale_date >= CURRENT_DATE";
        } else if (period === "month") {
            dateQuery = "AND sale_date >= DATE_TRUNC('month', CURRENT_DATE)";
        } else if (period === "year") {
            dateQuery = "AND sale_date >= DATE_TRUNC('year', CURRENT_DATE)";
        }

        let expenseDateQuery = dateQuery.replace("sale_date", "expense_date");

        // 2. Get Basic User Info
        const user = await pool.query("SELECT full_name, is_active FROM users WHERE id = $1", [req.user.id]);

        // 3. Calculate SALES REVENUE (Total Income)
        const sales = await pool.query(
            `SELECT SUM(total_amount) as total FROM sales WHERE business_id = $1 ${dateQuery}`,
            [business_id]
        );

        // 4. Calculate COST OF GOODS SOLD (To find Gross Profit)
        // We join sales and sale_items to filter by date
        const cogs = await pool.query(
            `SELECT SUM(si.unit_cost * si.quantity) as total_cost 
             FROM sale_items si 
             JOIN sales s ON si.sale_id = s.id 
             WHERE s.business_id = $1 ${dateQuery}`,
            [business_id]
        );

        // 5. Calculate OPERATIONAL EXPENSES
        const expenses = await pool.query(
            `SELECT SUM(amount) as total_expense FROM expenses WHERE business_id = $1 ${expenseDateQuery}`,
            [business_id]
        );

        // 6. Get Inventory Count (Always current)
        const stock = await pool.query(
            "SELECT COUNT(*) as total_items FROM products WHERE business_id = $1",
            [business_id]
        );

        // 7. DO THE MATH
        const total_income = Number(sales.rows[0].total) || 0;
        const total_cogs = Number(cogs.rows[0].total_cost) || 0;
        const total_expenses = Number(expenses.rows[0].total_expense) || 0;

        const gross_profit = total_income - total_cogs;
        const net_profit = gross_profit - total_expenses;

        res.json({
            full_name: user.rows[0].full_name,
            is_active: user.rows[0].is_active,
            
            // Financials
            total_income: total_income,
            total_expenses: total_expenses,
            net_profit: net_profit,
            
            total_items: stock.rows[0].total_items || 0
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;