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
  },
  { timestamps: true }
);

export default mongoose.model("Report", ReportSchema);
