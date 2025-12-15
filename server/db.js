const Pool = require("pg").Pool;
require("dotenv").config();

const devConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
};

const proConfig = {
  connectionString: process.env.DATABASE_URL, // Comes from Render
  ssl: {
    rejectUnauthorized: false // <--- THIS IS REQUIRED FOR SUPABASE
  }
};

const pool = new Pool(
  process.env.NODE_ENV === "production" ? proConfig : devConfig
);

module.exports = pool;