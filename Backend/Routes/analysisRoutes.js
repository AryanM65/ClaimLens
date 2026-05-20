import express from "express";
import Report from "../Models/Report.js";

const router = express.Router();
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

// 1. Trigger credibility analysis and return report (Purely mock for offline testing)
router.post("/analyse", async (req, res) => {
  const { url, userId } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Video URL is required." });
  }

  try {
    const jobId = `job_${Date.now()}`;
    console.log(`[Express] Mocking analysis for URL: ${url}`);

    // Create a high-fidelity mock credibility report immediately
    const savedReport = await Report.create({
      jobId,
      url,
      userId: userId || null,
      overallScore: 78,
      audioScore: 85,
      textScore: 70,
      verdict: "The advertisement presents mostly credible claims with clear evidence, though minor exaggeration was detected visually. Spoken statements match standard consumer reviews.",
      flaggedClaims: [
        {
          claim: "Made from 100% fresh organic natural oranges.",
          status: "Verified",
          evidence: "Agricultural records and independent laboratory testings confirm the ingredients are sourced entirely from organic certified fruit orchards."
        },
        {
          claim: "Provides 100% of your daily required Vitamin C intake.",
          status: "Misleading",
          evidence: "While high in Vitamin C, the standard serving size only provides 45% of the USDA daily recommended dietary allowance for an average adult."
        }
      ],
      visualFlags: [
        {
          issue: "Enhanced color saturation",
          description: "The product's visual presentation uses studio color filters and high saturation to make the drink look more vibrant than it is in real life."
        }
      ],
      languageDetected: "en"
    });

    return res.status(200).json(savedReport);
  } catch (error) {
    console.error("[Mock Analysis ERROR]:", error.message);
    return res.status(500).json({ error: `Analysis failed: ${error.message}` });
  }
});

// 2. Fetch past reports history list
router.get("/reports", async (req, res) => {
  const { userId } = req.query;
  try {
    const filter = userId ? { userId } : {};
    const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(20);
    return res.status(200).json(reports);
  } catch (error) {
    console.error("[Fetch Reports ERROR]:", error.message);
    return res.status(500).json({ error: "Failed to fetch past reports." });
  }
});

// 3. Fetch single report details
router.get("/reports/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }
    return res.status(200).json(report);
  } catch (error) {
    console.error("[Fetch Single Report ERROR]:", error.message);
    return res.status(500).json({ error: "Failed to fetch report details." });
  }
});

export default router;
