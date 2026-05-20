import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    overallScore: { type: Number, default: 50 },
    audioScore: { type: Number, default: 50 },
    textScore: { type: Number, default: 50 },
    verdict: { type: String, default: "" },
    flaggedClaims: [
      {
        claim: { type: String, required: true },
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
        issue: { type: String, required: true },
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
