
const express = require("express");
const { pool } = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS connected_at");

    res.json({
      success: true,
      message: "RentSure API is running",
      database: "connected",
      connectedAt: result.rows[0].connected_at,
    });
  } catch (error) {
    console.error("Health check failed:", error.message);

    res.status(503).json({
      success: false,
      message: "Database connection unavailable",
      database: "disconnected",
    });
  }
});

module.exports = router;
