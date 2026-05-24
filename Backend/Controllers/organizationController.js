import Organization from '../Models/Organization.js';
import User from '../Models/User.js';

// @desc    Register a new organization (public — before any user account exists)
// @route   POST /api/organizations
// @access  Public
export const registerOrganization = async (req, res) => {
  const { organizationName, orgCode, website, description } = req.body;

  if (!organizationName || !orgCode || !website) {
    return res.status(400).json({ message: 'Organization name, org code, and website are required.' });
  }

  try {
    // Check if organization name is already taken
    const nameExists = await Organization.findOne({
      organizationName: organizationName.trim()
    });
    if (nameExists) {
      return res.status(400).json({ message: 'An organization with this name is already registered.' });
    }

    // Check if orgCode is already taken
    const codeExists = await Organization.findOne({
      orgCode: orgCode.trim().toLowerCase()
    });
    if (codeExists) {
      return res.status(400).json({ message: 'This organization code is already taken. Please choose a different one.' });
    }

    const org = await Organization.create({
      organizationName: organizationName.trim(),
      orgCode: orgCode.trim().toLowerCase(),
      website: website.trim(),
      description: description?.trim() || '',
    });

    res.status(201).json({
      message: 'Organization registered. Share the org code with your team so they can sign up.',
      orgCode: org.orgCode,
      organizationName: org.organizationName,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify an organization (Admin only)
// @route   PUT /api/organizations/:id/verify
// @access  Private/Admin
export const verifyOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);

    if (!org) {
      return res.status(404).json({ message: 'Organization not found.' });
    }

    if (org.isVerified) {
      return res.status(400).json({ message: 'Organization is already verified.' });
    }

    org.isVerified = true;
    await org.save();

    res.status(200).json({
      message: `Organization "${org.organizationName}" has been verified successfully.`,
      organization: org,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all registered organizations (Admin only)
// @route   GET /api/organizations
// @access  Private/Admin
export const getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find({})
      .populate('createdBy', 'name username email')
      .sort({ createdAt: -1 });

    res.status(200).json(orgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single organization's public profile
// @route   GET /api/organizations/:id
// @access  Public
export const getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!org) {
      return res.status(404).json({ message: 'Organization not found.' });
    }

    res.status(200).json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get verified organizations (Public listing for selection dropdowns)
// @route   GET /api/organizations/public/list
// @access  Public
export const getPublicOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find()
      .select('organizationName orgCode website description')
      .sort({ organizationName: 1 });
    res.status(200).json(orgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
