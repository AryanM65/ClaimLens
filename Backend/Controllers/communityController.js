import CommunityPost from '../Models/CommunityPost.js';
import Report from '../Models/Report.js';
import Organization from '../Models/Organization.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Submit a new community opinion on an ad
// @route   POST /api/community
// @access  Private
export const createPost = async (req, res) => {
  const { reportId, opinionText, organizationId } = req.body;

  if (req.user.role === 'admin' || req.user.role === 'organization') {
    return res.status(403).json({ message: "Administrators and Organization Representatives are not permitted to publish community posts." });
  }

  if (!reportId || !opinionText || !organizationId) {
    return res.status(400).json({ message: "reportId, opinionText, and organizationId are required." });
  }

  try {
    // Validate report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Credibility report not found for this ID." });
    }

    // Validate organization exists in our database
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Selected organization not found in our database." });
    }

    const post = await CommunityPost.create({
      userId: req.user._id,
      reportId,
      adUrl: report.url, // Auto-sync from the actual report
      opinionText,
      organizationId,
      organizationName: organization.organizationName,
    });

    // Populate username of author and report details for returning the post
    const populatedPost = await CommunityPost.findById(post._id)
      .populate('userId', 'username')
      .populate('reportId');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get community opinions (with optional filtering by reportId or adUrl)
// @route   GET /api/community
// @access  Public
export const getPosts = async (req, res) => {
  const { reportId, adUrl } = req.query;

  try {
    let filter = {};
    if (reportId) {
      filter.reportId = reportId;
    } else if (adUrl) {
      filter.adUrl = adUrl;
    }

    // Populate username and the full report details
    const posts = await CommunityPost.find(filter)
      .populate('userId', 'username')
      .populate('reportId')
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle like/unlike on a community post
// @route   POST /api/community/:id/like
// @access  Private
export const toggleLikePost = async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'organization') {
      return res.status(403).json({ message: "Administrators and Organization Representatives are not permitted to like community posts." });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Opinion post not found." });
    }

    const userIdStr = req.user._id.toString();
    const likeIndex = post.likes.findIndex(id => id.toString() === userIdStr);

    if (likeIndex > -1) {
      // Already liked -> unlike it
      post.likes.splice(likeIndex, 1);
    } else {
      // Not liked yet -> add user ID to likes
      post.likes.push(req.user._id);
    }

    await post.save();
    const populatedPost = await CommunityPost.findById(post._id)
      .populate('userId', 'username')
      .populate('reportId');
    res.status(200).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a community post (Admins or the owner only)
// @route   DELETE /api/v1/community/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id).populate('userId', 'email name');
    if (!post) {
      return res.status(404).json({ message: "Opinion post not found." });
    }

    // Verify ownership or admin role
    const postUserId = post.userId?._id || post.userId;
    if (postUserId && postUserId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this post." });
    }

    // Send email to the post author
    if (post.userId && post.userId.email) {
      const emailOptions = {
        email: post.userId.email,
        subject: "Notification: Community Post Deleted — ClaimLens Support",
        message: `Hello ${post.userId.name || 'User'},\n\nWe are writing to inform you that your community opinion post tagging "${post.organizationName}" has been deleted from ClaimLens.\n\nUpon manual review, our safety and auditing teams identified some potential problems, misleading claims, or code-of-conduct violations within the published opinion or report discussion.\n\nIf you believe this was an error or wish to appeal this decision, please feel free to reach out to our administration desk through our Contact Us panel.\n\nBest regards,\nThe ClaimLens Safety & Audit Team`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #ef4444; margin-bottom: 20px; font-weight: 700; font-family: system-ui, sans-serif;">Community Post Deleted</h2>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; font-family: system-ui, sans-serif;">Hello <strong>${post.userId.name || 'User'}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; font-family: system-ui, sans-serif;">
              We are writing to inform you that your community opinion post tagging <strong>"${post.organizationName}"</strong> has been removed from the ClaimLens platform.
            </p>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 6px;">
              <p style="margin: 0; font-size: 14px; color: #991b1b; font-weight: 600; font-family: system-ui, sans-serif;">Reason for Removal:</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #7f1d1d; line-height: 1.5; font-family: system-ui, sans-serif;">
                Upon safety audit team review, we detected potential problems, misleading claims, or code-of-conduct violations in the opinion content.
              </p>
            </div>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; font-family: system-ui, sans-serif;">
              If you believe this was done in error or if you would like to appeal this decision, please reach out to our team via the platform's support and Contact Us panel.
            </p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0; font-family: system-ui, sans-serif;">
              This is an automated system notification from the ClaimLens Integrity & Verification Desk.
            </p>
          </div>
        `
      };
      
      try {
        await sendEmail(emailOptions);
      } catch (emailError) {
        console.error("[Nodemailer Error]: Failed to send post deletion email:", emailError.message);
      }
    }

    await CommunityPost.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully.", postId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
