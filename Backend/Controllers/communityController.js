import CommunityPost from '../Models/CommunityPost.js';
import Report from '../Models/Report.js';

// @desc    Submit a new community opinion on an ad
// @route   POST /api/community
// @access  Private
export const createPost = async (req, res) => {
  const { reportId, opinionText } = req.body;

  if (!reportId || !opinionText) {
    return res.status(400).json({ message: "reportId and opinionText are required." });
  }

  try {
    // Validate report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Credibility report not found for this ID." });
    }

    const post = await CommunityPost.create({
      userId: req.user._id,
      reportId,
      adUrl: report.url, // Auto-sync from the actual report
      opinionText,
    });

    // Populate only the username of the author for returning the post
    const populatedPost = await CommunityPost.findById(post._id).populate('userId', 'username');
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

    // Populate username only to protect user privacy
    const posts = await CommunityPost.find(filter)
      .populate('userId', 'username')
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
    const populatedPost = await CommunityPost.findById(post._id).populate('userId', 'username');
    res.status(200).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
