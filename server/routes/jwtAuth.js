const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");

// REGISTRATION
router.post("/register", async (req, res) => {
    const client = await pool.connect(); 
    try {
        const { company_name, full_name, email, password } = req.body;

        // 1. Check if user exists
        const user = await client.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length > 0) {
            client.release();
            return res.status(401).json("User already exists!");
        }

        // 2. Start Transaction
        await client.query('BEGIN');

        // 3. Create Business
        const newBusiness = await client.query(
            "INSERT INTO businesses (company_name) VALUES ($1) RETURNING id",
            [company_name]
        );
        const businessId = newBusiness.rows[0].id;

        // 4. Encrypt Password
        const saltRound = 10;
        const salt = await bcrypt.genSalt(saltRound);
        const bcryptPassword = await bcrypt.hash(password, salt);

        // 5. Create User
        const newUser = await client.query(
            "INSERT INTO users (business_id, full_name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, 'owner', false) RETURNING id, full_name, email, role",
            [businessId, full_name, email, bcryptPassword]
        );

        // 6. Commit Transaction
        await client.query('COMMIT');

        // 7. Generate Token
        const token = jwtGenerator(newUser.rows[0].id, businessId);
        res.json({ token, user: newUser.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Server Error");
    } finally {
        client.release();
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check User
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            return res.status(401).json("Password or Email is incorrect");
        }

        // 2. Check Password
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json("Password or Email is incorrect");
        }

        // 3. Return Token
        const token = jwtGenerator(user.rows[0].id, user.rows[0].business_id);
        res.json({ 
            token, 
            is_active: user.rows[0].is_active 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;

const authorization = require("../middleware/authorization");

// VERIFY TOKEN ROUTE
router.get("/is-verify", authorization, async (req, res) => {
    try {
        // If the middleware (authorization) passes, then the token is valid
        res.json(true); 
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});