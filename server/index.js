const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

// 1. MIDDLEWARE
app.use(cors());
app.use(express.json()); // Allows access to req.body (JSON data)

// 2. ROUTES

// Authentication Routes (Register & Login)
app.use("/auth", require("./routes/jwtAuth")); 

// ...
app.use("/auth", require("./routes/jwtAuth"));

// NEW: Dashboard Route
app.use("/dashboard", require("./routes/dashboard"));

// ... existing routes
app.use("/dashboard", require("./routes/dashboard"));

// NEW: Products Route
app.use("/products", require("./routes/products")); 

// ...
app.use("/products", require("./routes/products"));

// NEW: Sales Route
app.use("/sales", require("./routes/sales")); 
// ...

// ... start server

// ...

// Test Route (To check if server is working)
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the POS SaaS API!" });
});

// Test Database Connection
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ message: "Database Connected!", time: result.rows[0].now });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Database connection failed");
    }
});

// 3. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});