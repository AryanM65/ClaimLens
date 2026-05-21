import mongoose from 'mongoose';

const DisputeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },

    // The verified organization that filed this dispute
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Denormalized for fast display without extra populate
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    claimText: {
      type: String,
      required: true,
      minlength: [10, "Claim text must be at least 10 characters"],
      maxlength: [500, "Claim text cannot exceed 500 characters"],
    },
    reasonText: {
      type: String,
      required: true,
      trim: true,
      minlength: [20, "Reasoning must be at least 20 characters"],
      maxlength: [2000, "Reasoning cannot exceed 2000 characters"],
    },
    evidenceLinks: [
      {
        type: String,
        trim: true,
      }
    ],
    status: {
      type: String,
      enum: ['pending', 'under-review', 'resolved', 'rejected'],
      default: 'pending',
    },
    resolutionNotes: {
      type: String,
      default: '',
    }
  },
  { timestamps: true }
);

export default mongoose.model('Dispute', DisputeSchema);
