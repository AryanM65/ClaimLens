import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Organization name must be at least 2 characters'],
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },

    // Human-readable unique code chosen by the registrant (e.g. "nestle-india")
    // Team members use this code when signing up to join the organization
    orgCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Organization code must be at least 3 characters'],
      maxlength: [30, 'Organization code cannot exceed 30 characters'],
    },

    website: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },

    // Set after first user from the org signs up
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Admin must verify the org before they can file disputes
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Organization', OrganizationSchema);
