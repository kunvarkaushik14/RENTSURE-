
require("dotenv").config();

const app = require("./app");
const { connectDB, pool } = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`RentSure API running at http://localhost:${PORT}`);
    });

    async function shutdown() {
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error.message);
    await pool.end();
    process.exit(1);
  }
}

startServer();
