import Dispute from '../Models/Dispute.js';
import Report from '../Models/Report.js';
import Organization from '../Models/Organization.js';

// @desc    Raise a new claim dispute / verification request
// @route   POST /api/disputes
// @access  Private/Organization (verified only)
export const createDispute = async (req, res) => {
  const { reportId, claimText, reasonText, evidenceLinks } = req.body;

  if (!reportId || !claimText || !reasonText) {
    return res.status(400).json({ message: "reportId, claimText, and reasonText are required." });
  }

  try {
    // Only organization-role users can file disputes
    if (req.user.role !== 'organization') {
      return res.status(403).json({ message: 'Only verified organizations can raise claim disputes.' });
    }

    // Fetch and validate the organization
    const org = await Organization.findById(req.user.organizationId);
    if (!org) {
      return res.status(403).json({ message: 'No registered organization found for your account.' });
    }

    // Organization must be admin-verified before filing disputes
    if (!org.isVerified) {
      return res.status(403).json({ message: 'Your organization is pending admin verification. You cannot file disputes yet.' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    const dispute = await Dispute.create({
      userId: req.user._id,
      reportId,
      organizationId: org._id,
      organizationName: org.organizationName,
      claimText,
      reasonText,
      evidenceLinks: evidenceLinks || [],
    });

    res.status(201).json(dispute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all disputes submitted by the logged-in user
// @route   GET /api/disputes
// @access  Private
export const getUserDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ userId: req.user._id })
      .populate('reportId', 'url overallScore verdict')
      .sort({ createdAt: -1 });

    res.status(200).json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all disputes filed against a specific report
// @route   GET /api/disputes/report/:reportId
// @access  Public
export const getDisputesByReport = async (req, res) => {
  try {
    const disputes = await Dispute.find({ reportId: req.params.reportId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all disputes globally across the platform (Admin only)
// @route   GET /api/disputes/admin/all
// @access  Private/Admin
export const getAllDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({})
      .populate('reportId', 'url overallScore verdict')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve or reject a claim dispute (Admin only)
// @route   PUT /api/disputes/:id/resolve
// @access  Private/Admin
export const resolveDispute = async (req, res) => {
  const { status, resolutionNotes } = req.body;

  if (!status || !['resolved', 'rejected', 'under-review'].includes(status)) {
    return res.status(400).json({ message: "Valid status ('resolved', 'rejected', 'under-review') is required." });
  }

  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found." });
    }

    dispute.status = status;
    dispute.resolutionNotes = resolutionNotes || '';
    await dispute.save();

    res.status(200).json(dispute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
