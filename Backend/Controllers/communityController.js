import CommunityPost from '../Models/CommunityPost.js';
import Report from '../Models/Report.js';
import Organization from '../Models/Organization.js';

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
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Opinion post not found." });
    }

    // Verify ownership or admin role
    if (post.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this post." });
    }

    await CommunityPost.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully.", postId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
