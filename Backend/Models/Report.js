import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    // url is the primary cache key — unique and indexed for fast lookups
    url: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
      index: true,
    },


    overallScore: {
      type: Number,
      default: 50,
      min: [0, 'Score cannot be below 0'],
      max: [100, 'Score cannot exceed 100'],
    },

    audioScore: {
      type: Number,
      default: 50,
      min: [0, 'Score cannot be below 0'],
      max: [100, 'Score cannot exceed 100'],
    },

    textScore: {
      type: Number,
      default: 50,
      min: [0, 'Score cannot be below 0'],
      max: [100, 'Score cannot exceed 100'],
    },

    // null until the pipeline generates a verdict
    verdict: {
      type: String,
      default: null,
    },

    flaggedClaims: [
      {
        claim:    { type: String, required: true },
        category: { type: String, default: 'other' }, // e.g. health, statistical, comparative, endorsement
        status: {
          type: String,
          enum: ["Verified", "Misleading", "Unverifiable", "False"],
          required: true,
        },
        evidence: { type: String, required: true },
      },
    ],

    visualFlags: [
      {
        issue:       { type: String, required: true },
        description: { type: String, required: true },
      },
    ],

    languageDetected: {
      type: String,
      default: "en",
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    organizationName: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Mongoose query middleware to retroactively map old records (created before the queue system)
// which have completed analyses but default to 'processing' when queried.
ReportSchema.post(['find', 'findOne', 'findOneAndUpdate'], function(res) {
  if (!res) return;
  const docs = Array.isArray(res) ? res : [res];
  for (const doc of docs) {
    if (doc) {
      const isPlaceholderVerdict = doc.verdict === 'AI analysis is currently in progress. Please check back shortly.' || !doc.verdict;
      if (doc.status === 'processing' && !isPlaceholderVerdict) {
        doc.status = 'completed';
      }
    }
  }
});

export default mongoose.model("Report", ReportSchema);
