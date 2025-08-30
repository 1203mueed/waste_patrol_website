const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const WasteReport = require('../models/WasteReport');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { processImageWithYOLO } = require('../services/yoloService');
const router = express.Router();

// @route   GET /api/reports/public
// @desc    Get public reports for heatmap (no auth required)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    // Debug: Check all reports first
    const allReports = await WasteReport.find({ status: { $ne: 'resolved' } });
    console.log('🔍 All non-resolved reports:', allReports.length);
    console.log('🔍 Reports with isActive=false:', allReports.filter(r => !r.isActive).length);
    console.log('🔍 Reports with isActive=true:', allReports.filter(r => r.isActive).length);
    
    const reports = await WasteReport.find({ 
      status: { $ne: 'resolved' },
      isActive: true  // Only show active (non-deleted) reports
    })
      .populate('citizenId', 'name')
      .select('location wasteDetection status createdAt originalImage processedImage reportId priority')
      .sort({ createdAt: -1 })
      .limit(100);
    
    console.log('📊 Public endpoint returning:', reports.length, 'reports');
    res.json(reports);
  } catch (error) {
    console.error('Error fetching public reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/waste-images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and JPG images are allowed'));
    }
  }
});

// @route   POST /api/reports
// @desc    Create a new waste report
// @access  Private (Citizens)
router.post('/', authenticateToken, upload.single('wasteImage'), [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('address').trim().isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Waste image is required'
      });
    }

    const { latitude, longitude, address, landmark } = req.body;

    // Process image with YOLO model
    const yoloResults = await processImageWithYOLO(req.file.path);
    
    // Calculate priority based on detected waste volume
    // If no waste is detected, set priority to low
    const priority = yoloResults.totalWasteArea > 0 ? calculatePriority(yoloResults.estimatedVolume) : 'low';

    // Generate unique report ID
    const reportId = `WR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create waste report
    const wasteReport = new WasteReport({
      reportId,
      citizenId: req.user.userId,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
        landmark
      },
      originalImage: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      processedImage: {
        filename: yoloResults.processedFilename,
        path: yoloResults.processedPath
      },
      wasteDetection: {
        totalWasteArea: yoloResults.totalWasteArea,
        estimatedVolume: yoloResults.estimatedVolume,
        wasteTypes: yoloResults.wasteTypes,
        severityLevel: yoloResults.severityLevel
      },
      priority
    });

    await wasteReport.save();

    // Populate citizen details
    await wasteReport.populate('citizenId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Waste report created successfully',
      report: wasteReport
    });
  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating report'
    });
  }
});

// @route   POST /api/reports/:id/comments
// @desc    Add a comment to a waste report
// @access  Private
router.post('/:id/comments', authenticateToken, [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment message is required and must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { message } = req.body;
    const reportId = req.params.id;

    // Check if report exists and user has access
    let query = { _id: reportId, isActive: true };
    
    // Citizens can only comment on their own reports
    if (req.user.role === 'citizen') {
      query.citizenId = req.user.userId;
    }

    const report = await WasteReport.findOne(query);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }

    // Add comment
    const newComment = {
      user: req.user.userId,
      message: message.trim(),
      timestamp: new Date()
    };

    report.comments.push(newComment);
    await report.save();

    // Populate the new comment with user details
    await report.populate('comments.user', 'name email');

    // Get the newly added comment
    const addedComment = report.comments[report.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: addedComment
    });
  } catch (error) {
    console.error('Comment addition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment'
    });
  }
});

// @route   GET /api/reports
// @desc    Get waste reports (with filters)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      priority,
      page = 1,
      limit = 10,
      latitude,
      longitude,
      radius = 5000, // 5km default
      citizenId,
      assignedTo
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Role-based filtering
    if (req.user.role === 'citizen') {
      query.citizenId = req.user.userId;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Priority filter
    if (priority) {
      query.priority = priority;
    }

    // Citizen filter (for authorities)
    if (citizenId && req.user.role !== 'citizen') {
      query.citizenId = citizenId;
    }

    // Assigned to filter
    if (assignedTo && req.user.role !== 'citizen') {
      query.assignedTo = assignedTo;
    }

    // Location-based filter
    if (latitude && longitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await WasteReport.find(query)
      .populate('citizenId', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('resolution.resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WasteReport.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Reports fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reports'
    });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single waste report
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    let query = { _id: req.params.id, isActive: true };

    // Citizens can only see their own reports
    if (req.user.role === 'citizen') {
      query.citizenId = req.user.userId;
    }

    const report = await WasteReport.findOne(query)
      .populate('citizenId', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('resolution.resolvedBy', 'name email')
      .populate('comments.user', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Report fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching report'
    });
  }
});

// @route   PUT /api/reports/:id/assign
// @desc    Assign report to authority
// @access  Private (Authority/Admin)
router.put('/:id/assign', authenticateToken, [
  body('assignedTo').isMongoId().withMessage('Valid user ID required')
], async (req, res) => {
  try {
    if (req.user.role === 'citizen') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { assignedTo } = req.body;

    // Check if assigned user exists and is authority
    const assignedUser = await User.findOne({ _id: assignedTo, role: 'authority', isActive: true });
    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid authority user'
      });
    }

    const report = await WasteReport.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo,
        status: 'in_progress'
      },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report assigned successfully',
      report
    });
  } catch (error) {
    console.error('Report assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning report'
    });
  }
});

// @route   PUT /api/reports/:id/status
// @desc    Update report status
// @access  Private (Authority/Admin)
router.put('/:id/status', authenticateToken, [
  body('status').isIn(['pending', 'in_progress', 'resolved', 'rejected']).withMessage('Invalid status')
], async (req, res) => {
  try {
    if (req.user.role === 'citizen') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { status } = req.body;

    const report = await WasteReport.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('citizenId', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report status updated successfully',
      report
    });
  } catch (error) {
    console.error('Report status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating report status'
    });
  }
});

// @route   PUT /api/reports/:id/resolve
// @desc    Mark report as resolved
// @access  Private (Authority/Admin)
router.put('/:id/resolve', authenticateToken, upload.array('afterImages', 5), [
  body('resolutionNotes').trim().isLength({ min: 10 }).withMessage('Resolution notes must be at least 10 characters')
], async (req, res) => {
  try {
    if (req.user.role === 'citizen') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { resolutionNotes } = req.body;
    const afterImages = req.files ? req.files.map(file => file.path) : [];

    const report = await WasteReport.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        'resolution.resolvedBy': req.user.userId,
        'resolution.resolvedAt': new Date(),
        'resolution.resolutionNotes': resolutionNotes,
        'resolution.beforeAfterImages': afterImages
      },
      { new: true }
    ).populate('resolution.resolvedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report resolved successfully',
      report
    });
  } catch (error) {
    console.error('Report resolution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resolving report'
    });
  }
});



// @route   DELETE /api/reports/:id
// @desc    Delete a waste report (only if pending and user owns it)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.id;

    // Find the report
    const report = await WasteReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user owns the report
    console.log('Debug - report.citizenId:', report.citizenId, 'type:', typeof report.citizenId);
    console.log('Debug - req.user.userId:', req.user.userId, 'type:', typeof req.user.userId);
    console.log('Debug - comparison:', report.citizenId.toString(), '!==', req.user.userId.toString());
    
    if (report.citizenId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reports'
      });
    }

    // Check if report is in pending status
    if (report.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending reports can be deleted'
      });
    }

    // Soft delete by setting isActive to false
    report.isActive = false;
    
    // Debug: Log before and after
    console.log('Before save - isActive:', report.isActive);
    console.log('Before save - report:', JSON.stringify(report, null, 2));
    
    await report.save();
    
    // Debug: Verify the save worked
    const savedReport = await WasteReport.findById(reportId);
    console.log('After save - isActive:', savedReport.isActive);
    console.log('After save - report:', JSON.stringify(savedReport, null, 2));

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Report deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting report'
    });
  }
});

// Helper function to calculate priority based on waste detection
function calculatePriority(volume) {
  let priority = 'medium';
  
  // Volume-based priority (simplified)
  if (volume > 10) {
    priority = 'urgent';
  } else if (volume > 5) {
    priority = 'high';
  } else if (volume > 2) {
    priority = 'medium';
  } else {
    priority = 'low';
  }
  
  // Since we're not detecting specific waste types anymore, 
  // priority is based purely on volume
  return priority;
}

module.exports = router;
