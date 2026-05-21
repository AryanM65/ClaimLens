import User from '../Models/User.js';
import Organization from '../Models/Organization.js';
import jwt from 'jsonwebtoken';

// Generate JWT token
const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    sameSite: 'strict', // Prevent CSRF attacks
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  // orgCode is optional — only provided by org members (e.g. "nestle-india")
  const { name, username, email, password, orgCode } = req.body;

  try {
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // If orgCode is provided, look up the organization by its human-readable code
    let resolvedRole = 'user';
    let resolvedOrgId = null;

    if (orgCode) {
      const org = await Organization.findOne({ orgCode: orgCode.trim().toLowerCase() });
      if (!org) {
        return res.status(404).json({ message: 'Organization not found. Please check the org code.' });
      }
      resolvedRole = 'organization';
      resolvedOrgId = org._id;
    }

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email,
      password,
      role: resolvedRole,
      organizationId: resolvedOrgId,
    });

    // Set createdBy on the org to the first user who signs up with this code
    if (resolvedOrgId) {
      await Organization.findOneAndUpdate(
        { _id: resolvedOrgId, createdBy: null },
        { $set: { createdBy: user._id } }
      );
    }

    if (user) {
      generateToken(res, user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      user.lastLoginAt = Date.now();
      await user.save();

      generateToken(res, user._id);

      res.status(200).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};
