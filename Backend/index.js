import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./Routes/authRoutes.js";
import userRoutes from "./Routes/userRoutes.js";
import analysisRoutes from "./Routes/analysisRoutes.js";
import communityRoutes from "./Routes/communityRoutes.js";
import disputeRoutes from "./Routes/disputeRoutes.js";
import organizationRoutes from "./Routes/organizationRoutes.js";
import contactRoutes from "./Routes/contactRoutes.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base Route
app.get("/", (req, res) => {
  res.send("ClaimLens API is running...");
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/analysis", analysisRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/disputes", disputeRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/contact", contactRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
