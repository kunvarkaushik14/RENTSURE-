
const express = require("express");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");

const propertyRoutes = require("./routes/propertyRoutes");
const healthRoutes = require("./routes/healthRoutes");
const calculatorRoutes = require("./routes/calculatorRoutes");
const authRoutes = require("./routes/authRoutes");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

// Request parsing
app.use(express.json({ limit: "1mb" }));

// API root
app.get("/", (req, res) => {
  res.json({
    name: "RentSure API",
    version: "1.0.0",
    status: "running",
  });
});

// Swagger documentation — register before error handlers
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// Rate limit authentication requests
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

// API routes
app.use("/api/health", healthRoutes);
app.use("/api/calculator", calculatorRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/properties", propertyRoutes);

// Error-handling middleware — after registered routes
app.use((err, req, res, next) => {
  console.error("API error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
});

// Not-found handler — always last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

module.exports = app;
