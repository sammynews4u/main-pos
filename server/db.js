const Pool = require("pg").Pool;
require("dotenv").config();

const pool = new Pool({
  user: "postgres",        // Default user
  password: "865864", // <--- CHANGE THIS to your actual Postgres password
  host: "localhost",
  port: 5432,
  database: "pos_system"   // The DB name we just created
});

module.exports = pool;