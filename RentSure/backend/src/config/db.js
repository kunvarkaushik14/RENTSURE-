
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "rentsure1",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      connectionTimeoutMillis: 10000,
    });

async function connectDB() {
  try {
    const client = await pool.connect();
    console.log(
      "PostgreSQL connected successfully using",
      connectionString ? "DATABASE_URL" : "local DB settings"
    );
    client.release();
  } catch (error) {
    console.error("PostgreSQL connection diagnostic:", {
      message: error.message,
      code: error.code,
      address: error.address,
      port: error.port,
      syscall: error.syscall,
    });
    throw error;
  }
}

module.exports = { pool, connectDB };
