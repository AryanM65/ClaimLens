import Report from "../Models/Report.js";
import User from "../Models/User.js";
import Organization from "../Models/Organization.js";
import { analysisQueue } from "../queues/analysisQueue.js";

// @desc    Trigger credibility analysis for a video URL
//          Checks MongoDB cache first — returns instantly if already analyzed
//          Appends report to user's history
// @route   POST /api/analysis/analyse
// @access  Private (auth required)
export const analyseVideo = async (req, res) => {
  const { url, organizationId } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Video URL is required." });
  }

  // Enforce strict role validation: Admins and Organizations cannot generate reports
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: "Administrators and Organization Representatives are not permitted to analyze videos." });
  }

  const loggedInUserId = req.user._id;

  try {
    // Lookup organization name from DB if organizationId is supplied
    let validatedOrgId = null;
    let orgName = null;
    if (organizationId) {
      const org = await Organization.findById(organizationId);
      if (org) {
        validatedOrgId = org._id;
        orgName = org.organizationName;
      }
    }

    // Cache check — return existing report instantly if URL was already analyzed and completed successfully
    const existingReport = await Report.findOne({ url });
    if (existingReport) {
      if (existingReport.status === 'completed') {
        console.log(`[Express] Cached completed report found for URL: ${url}`);
        if (validatedOrgId && !existingReport.organizationId) {
          existingReport.organizationId = validatedOrgId;
          existingReport.organizationName = orgName;
          await existingReport.save();
        }
        await User.findByIdAndUpdate(loggedInUserId, {
          $addToSet: { reports: existingReport._id },
        });
        return res.status(200).json(existingReport);
      } else if (existingReport.status === 'processing') {
        console.log(`[Express] Job is already running for URL: ${url}. Redirecting to poll job ${existingReport.jobId}`);
        return res.status(202).json({
          message: 'Video is currently being analyzed.',
          jobId: existingReport.jobId,
          status: 'processing'
        });
      } else if (existingReport.status === 'failed') {
        console.log(`[Express] Found a failed report for URL: ${url}. Deleting the old failed report to retry fresh...`);
        await Report.deleteOne({ _id: existingReport._id });
        // Proceed down to create a new placeholder and queue a fresh job
      }
    }

    const jobId = `job_${Date.now()}`;

    // Create placeholder report in MongoDB
    const placeholderReport = await Report.create({
      jobId,
      url,
      organizationId: validatedOrgId,
      organizationName: orgName,
      status: 'processing',
      overallScore: 50,
      audioScore: 50,
      textScore: 50,
      verdict: 'AI analysis is currently in progress. Please check back shortly.'
    });

    console.log(`[Express] Enqueuing analysis job in BullMQ for URL: ${url}`);
    
    // Add job to BullMQ
    await analysisQueue.add(`audit_${jobId}`, {
      url,
      jobId,
      organizationId: validatedOrgId,
      organizationName: orgName,
      loggedInUserId
    });

    // Return 202 Accepted instantly
    return res.status(202).json({
      message: 'Video submitted for credibility analysis.',
      jobId,
      status: 'processing'
    });

  } catch (error) {
    if (error.code === 11000 || error.message.includes("E11000") || error.message.includes("duplicate key")) {
      console.log(`[Express] Duplicate key E11000 caught. Fetching the newly created report for url: ${url}`);
      try {
        const savedReport = await Report.findOne({ url });
        if (savedReport) {
          if (savedReport.status === 'completed') {
            await User.findByIdAndUpdate(loggedInUserId, {
              $addToSet: { reports: savedReport._id },
            });
            return res.status(200).json(savedReport);
          } else if (savedReport.status === 'processing') {
            return res.status(202).json({
              message: 'Video is currently being analyzed.',
              jobId: savedReport.jobId,
              status: 'processing'
            });
          } else if (savedReport.status === 'failed') {
            console.log(`[Express] Duplicate catch found a failed job. Deleting old failed report to retry fresh...`);
            await Report.deleteOne({ _id: savedReport._id });
          }
        }
      } catch (innerError) {
        console.error("[Analysis Inner Duplicate ERROR]:", innerError.message);
      }
    }
    console.error("[Analysis ERROR]:", error.message);
    return res.status(500).json({ error: `Could not start analysis: ${error.message}` });
  }
};

// @desc    Poll the status of a background analysis job
// @route   GET /api/analysis/status/:jobId
// @access  Private (auth required)
export const getJobStatus = async (req, res) => {
  const { jobId } = req.params;

  try {
    const report = await Report.findOne({ jobId });
    if (!report) {
      return res.status(404).json({ error: "Analysis job not found." });
    }

    return res.status(200).json({
      status: report.status,
      report
    });
  } catch (error) {
    console.error("[Poll Status ERROR]:", error.message);
    return res.status(500).json({ error: "Failed to fetch job status." });
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
