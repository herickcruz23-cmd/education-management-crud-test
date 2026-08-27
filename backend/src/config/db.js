const { Pool } = require("pg");
const { env } = require("./env");

const db = new Pool({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

db.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

module.exports = { db };
