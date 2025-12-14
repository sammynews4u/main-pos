const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
    try {
        // 1. Get the token from the header
        const jwtToken = req.header("token");

        if (!jwtToken) {
            return res.status(403).json("Not Authorized (No Token)");
        }

        // 2. Check if the token is real
        const payload = jwt.verify(jwtToken, process.env.JWT_SECRET || "secret123");

        // 3. If valid, give the user's info to the route
        req.user = payload.user;
        
        // 4. Continue to the next step
        next();

    } catch (err) {
        console.error(err.message);
        return res.status(403).json("Not Authorized (Invalid Token)");
    }
};