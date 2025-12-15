const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const axios = require("axios");

// ⚠️ REPLACE THIS WITH YOUR OWN PAYSTACK SECRET KEY
// Go to Paystack Dashboard -> Settings -> API Keys
const PAYSTACK_SECRET = "sk_test_YOUR_OWN_SECRET_KEY_HERE"; 

router.post("/verify", authorization, async (req, res) => {
    try {
        const { reference } = req.body; // Reference comes from Frontend

        // 1. Verify transaction with Paystack
        const paystackResponse = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`
                }
            }
        );

        const data = paystackResponse.data.data;

        // 2. If Paystack says "Success", activate user
        if (data.status === "success") {
            
            // Activate the user in the database
            await pool.query(
                "UPDATE users SET is_active = TRUE WHERE id = $1",
                [req.user.id]
            );

            res.json({ message: "Payment Successful", is_active: true });
        } else {
            res.status(400).json("Payment verification failed.");
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;