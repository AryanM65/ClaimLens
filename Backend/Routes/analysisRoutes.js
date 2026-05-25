import express from "express";
import { analyseVideo, getReports, getReportById, getJobStatus } from "../Controllers/analysisController.js";
import { protect } from "../Middlewares/authMiddleware.js";

const router = express.Router();

// POST  /api/analysis/analyse       — Submit a video URL for credibility analysis (Requires login)
router.post("/analyse", protect, analyseVideo);

// GET   /api/analysis/status/:jobId  — Poll the status of a background job (Requires login)
router.get("/status/:jobId", protect, getJobStatus);

// GET   /api/analysis/reports       — List recent reports (general, not user-specific)
router.get("/reports", getReports);

// GET   /api/analysis/reports/:id   — Fetch a single report by ID
router.get("/reports/:id", getReportById);


export default router;
