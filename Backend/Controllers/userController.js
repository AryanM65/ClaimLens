import User from '../Models/User.js';

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
