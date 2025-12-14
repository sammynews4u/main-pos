const jwt = require("jsonwebtoken");
require("dotenv").config();

function jwtGenerator(user_id, business_id) {
    const payload = {
        user: {
            id: user_id,
            business_id: business_id
        }
    };

    // Token is valid for 1 hour
    return jwt.sign(payload, process.env.JWT_SECRET || "secret123", { expiresIn: "1h" });
}

module.exports = jwtGenerator;