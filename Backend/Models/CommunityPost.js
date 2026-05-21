import mongoose from "mongoose";

const CommunityPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    adUrl: {
      type: String,
      required: true,
      index: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
      index: true,
    },
    opinionText: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Opinion must be at least 3 characters"],
      maxlength: [1000, "Opinion cannot exceed 1000 characters"],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("CommunityPost", CommunityPostSchema);
