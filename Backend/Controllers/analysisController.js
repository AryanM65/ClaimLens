import Report from "../Models/Report.js";
import User from "../Models/User.js";

// @desc    Trigger credibility analysis for a video URL
//          Checks MongoDB cache first — returns instantly if already analyzed
//          Appends report to user's history
// @route   POST /api/analysis/analyse
// @access  Private (auth required)
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
    console.log(`[Express] Mocking analysis for URL: ${url}`);

    // TODO (Phase 1): Replace mock below with real FastAPI pipeline call:
    // const { data } = await axios.post(`${FASTAPI_URL}/run-pipeline`, { url, jobId });
    // const savedReport = await Report.create({ ...data });

    const savedReport = await Report.create({
      jobId,
      url,
      overallScore: 78,
      audioScore: 85,
      textScore: 70,
      verdict:
        "The advertisement presents mostly credible claims with clear evidence, though minor exaggeration was detected visually. Spoken statements match standard consumer reviews.",
      flaggedClaims: [
        {
          claim: "Made from 100% fresh organic natural oranges.",
          category: "health",
          status: "Verified",
          evidence:
            "Agricultural records and independent laboratory testings confirm the ingredients are sourced entirely from organic certified fruit orchards.",
        },
        {
          claim: "Provides 100% of your daily required Vitamin C intake.",
          category: "statistical",
          status: "Misleading",
          evidence:
            "While high in Vitamin C, the standard serving size only provides 45% of the USDA daily recommended dietary allowance for an average adult.",
        },
      ],
      visualFlags: [
        {
          issue: "Enhanced color saturation",
          description:
            "The product's visual presentation uses studio color filters and high saturation to make the drink look more vibrant than it is in real life.",
        },
      ],
      languageDetected: "en",
    });

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
