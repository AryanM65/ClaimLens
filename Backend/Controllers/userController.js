import User from '../Models/User.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      plan: user.plan,
      isBanned: user.isBanned,
      analysisCount: user.reports.length,
      profilePicture: user.profilePicture,
      organizationId: user.organizationId,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  const users = await User.find({});
  res.status(200).json(users);
};

// @desc    Get user's personal analyzed ads history
// @route   GET /api/users/history
// @access  Private
export const getUserHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('reports');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Return the populated array of report documents sorted by most recent
    res.status(200).json(user.reports.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ban or unban a user (Admin only)
// @route   PUT /api/users/:id/ban
// @access  Private/Admin
export const banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban another admin account' });
    }

    // Toggle: if currently banned → unban, if active → ban
    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      message: user.isBanned ? `User @${user.username} has been banned.` : `User @${user.username} has been unbanned.`,
      isBanned: user.isBanned,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update simple fields
    user.name = req.body.name || user.name;
    user.email = (req.body.email || user.email).toLowerCase();

    // Check if new password is provided
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      plan: updatedUser.plan,
      isBanned: updatedUser.isBanned,
      analysisCount: updatedUser.reports.length,
      profilePicture: updatedUser.profilePicture,
      organizationId: updatedUser.organizationId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Promise wrapper for Cloudinary upload stream
const uploadFromBuffer = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'claimlens_avatars',
        transformation: [{ width: 250, height: 250, crop: 'fill', gravity: 'face' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// @desc    Upload profile picture
// @route   POST /api/users/profile-picture
// @access  Private
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const result = await uploadFromBuffer(req.file.buffer);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.profilePicture = result.secure_url;
    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      plan: updatedUser.plan,
      isBanned: updatedUser.isBanned,
      analysisCount: updatedUser.reports.length,
      profilePicture: updatedUser.profilePicture,
      organizationId: updatedUser.organizationId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
