import { Worker } from 'bullmq';
import axios from 'axios';
import Report from '../Models/Report.js';
import User from '../Models/User.js';
import redisConnection from '../config/redis.js';


export const initAnalysisWorker = () => {
  const worker = new Worker(
    'analysis-queue',
    async (job) => {
      const { url, jobId, organizationId, loggedInUserId } = job.data;
      console.log(`[Worker Queue] Dequeued job: ${jobId}`);
      console.log(`[Worker Queue] Parameters: URL=${url}, Org=${organizationId}, User=${loggedInUserId}`);

      const fastApiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8000";
      console.log(`[Worker Queue] Forwarding request to FastAPI pipeline at: ${fastApiUrl}/run-pipeline`);

      try {
        // Call FastAPI pipeline
        const pipelineResponse = await axios.post(`${fastApiUrl}/run-pipeline`, { url, jobId }, { timeout: 300000 }); // 5 minutes timeout for scraping + parsing
        const pipelineData = pipelineResponse.data;
        console.log(`[Worker Queue] Pipeline responded successfully for job ${jobId}`);

        // Map snake_case response fields to camelCase schema fields
        const mappedUpdates = {
          status: 'completed',
          overallScore: pipelineData.overall_score !== undefined ? pipelineData.overall_score : 50,
          audioScore: pipelineData.audio_score !== undefined ? pipelineData.audio_score : 50,
          textScore: pipelineData.text_score !== undefined ? pipelineData.text_score : 50,
          verdict: pipelineData.verdict || "Analysis completed successfully.",
          flaggedClaims: (pipelineData.flagged_claims || []).map(c => ({
            claim: c.claim || "",
            category: c.category || "other",
            status: c.status || "Unverifiable",
            evidence: c.evidence || "No search evidence available."
          })),
          visualFlags: (pipelineData.visual_flags || []).map(vf => ({
            issue: vf.issue || "",
            description: vf.description || ""
          })),
          languageDetected: pipelineData.language_detected || "en"
        };

        // Update placeholder report in MongoDB
        const updatedReport = await Report.findOneAndUpdate(
          { jobId },
          { $set: mappedUpdates },
          { new: true }
        );

        if (!updatedReport) {
          throw new Error(`Report with jobId ${jobId} not found in database.`);
        }

        // Add report to user's completed history list
        await User.findByIdAndUpdate(loggedInUserId, {
          $addToSet: { reports: updatedReport._id },
        });

        console.log(`[Worker Queue] Successfully updated and saved report for job ${jobId}`);
        return { success: true, reportId: updatedReport._id };

      } catch (err) {
        console.error(`[Worker Queue ERROR] Error processing job ${jobId}:`, err.message);

        // Update report status to failed with helpful diagnostics
        await Report.findOneAndUpdate(
          { jobId },
          { 
            $set: { 
              status: 'failed',
              verdict: `Analysis failed: ${err.response?.data?.detail || err.message}` 
            } 
          }
        );

        throw err; // Throw to trigger BullMQ retry / failure state
      }
    },
    {
      connection: redisConnection,
      concurrency: 1, // Process one long video at a time to prevent server exhaustion
    }
  );

  worker.on('ready', () => {
    console.log('[Worker Queue] BullMQ worker is connected and ready to process jobs.');
  });

  worker.on('completed', (job, result) => {
    console.log(`[Worker Queue] Job completed successfully: ${job.id}, result:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker Queue ERROR] Job ${job ? job.id : 'unknown'} failed:`, err);
  });
};
