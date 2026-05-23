import Report from "../Models/Report.js";
import User from "../Models/User.js";
import axios from "axios";

// @desc    Trigger credibility analysis for a video URL
//          Checks MongoDB cache first — returns instantly if already analyzed
//          Appends report to user's history
// @route   POST /api/analysis/analyse
// @access  Private (auth required)
// export const analyseVideo = async (req, res) => {
export const analyseVideo = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Video URL is required." });
  }

  const loggedInUserId = req.user._id;

  try {
    // Cache check — return existing report instantly if URL was already analyzed
    const existingReport = await Report.findOne({ url });
    if (existingReport) {
      console.log(`[Express] Cached report found for URL: ${url}`);
      await User.findByIdAndUpdate(loggedInUserId, {
        $addToSet: { reports: existingReport._id },
      });
      return res.status(200).json(existingReport);
    }

    const jobId = `job_${Date.now()}`;
    const fastApiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8000";
    console.log(`[Express] Calling FastAPI pipeline at: ${fastApiUrl}/run-pipeline for URL: ${url}`);

    // Call the real FastAPI pipeline
    const pipelineResponse = await axios.post(`${fastApiUrl}/run-pipeline`, { url, jobId });
    const pipelineData = pipelineResponse.data;

    // Map snake_case response fields to camelCase schema fields
    const mappedReport = {
      jobId,
      url,
      overallScore: pipelineData.overall_score !== undefined ? pipelineData.overall_score : 50,
      audioScore: pipelineData.audio_score !== undefined ? pipelineData.audio_score : 50,
      textScore: pipelineData.text_score !== undefined ? pipelineData.text_score : 50,
      verdict: pipelineData.verdict || "Analysis completed without generating a summary verdict.",
      flaggedClaims: (pipelineData.flagged_claims || []).map(c => ({
        claim: c.claim || "",
        category: c.category || "other",
        status: c.status || "Unverifiable",
        evidence: c.evidence || "No search results returned."
      })),
      visualFlags: (pipelineData.visual_flags || []).map(vf => ({
        issue: vf.issue || "",
        description: vf.description || ""
      })),
      languageDetected: pipelineData.language_detected || "en"
    };

    const savedReport = await Report.create(mappedReport);

    await User.findByIdAndUpdate(loggedInUserId, {
      $addToSet: { reports: savedReport._id },
    });

    return res.status(200).json(savedReport);
  } catch (error) {
    console.error("[Analysis ERROR]:", error.message);
    return res.status(500).json({ error: `Analysis failed: ${error.message}` });
  }
};

// @desc    Fetch all past reports (general listing — not user-specific)
//          User-specific history → GET /api/users/history
// @route   GET /api/analysis/reports
// @access  Public
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find({}).sort({ createdAt: -1 }).limit(20);
    return res.status(200).json(reports);
  } catch (error) {
    console.error("[Fetch Reports ERROR]:", error.message);
    return res.status(500).json({ error: "Failed to fetch reports." });
  }
};

// @desc    Fetch a single report by its MongoDB ID
// @route   GET /api/analysis/reports/:id
// @access  Public
export const getReportById = async (req, res) => {
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
};
