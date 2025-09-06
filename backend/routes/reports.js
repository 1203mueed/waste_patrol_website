const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { WasteReport, User } = require('../models');
const { sequelize } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { processImageWithYOLO } = require('../services/yoloService');
const router = express.Router();

// @route   GET /api/reports/public
// @desc    Get public reports for heatmap (no auth required)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    // Debug: Check all reports first
    const allReports = await WasteReport.findAll({ 
      where: { status: { [require('sequelize').Op.ne]: 'resolved' } }
    });
    console.log('🔍 All non-resolved reports:', allReports.length);
    console.log('🔍 Reports with isActive=false:', allReports.filter(r => !r.isActive).length);
    console.log('🔍 Reports with isActive=true:', allReports.filter(r => r.isActive).length);
    
    const reports = await WasteReport.findAll({ 
      where: { 
        status: { [require('sequelize').Op.ne]: 'resolved' },
        isActive: true  // Only show active (non-deleted) reports
      },
      include: [{
        model: User,
        as: 'citizen',
        attributes: ['name']
      }],
      attributes: [
        'id', 'reportId', 'latitude', 'longitude', 'address', 'landmark',
        'originalImageFilename', 'processedImageFilename',
        'detectedObjects', 'totalWasteArea', 'estimatedVolume', 
        'wasteTypes', 'severityLevel', 'status', 'priority', 'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    // Transform data to match frontend expectations
    const transformedReports = reports.map(report => ({
      _id: report.id,
      reportId: report.reportId,
      location: {
        coordinates: [report.longitude, report.latitude]
      },
      wasteDetection: {
        totalWasteArea: report.totalWasteArea,
        estimatedVolume: report.estimatedVolume,
        wasteTypes: report.wasteTypes,
        severityLevel: report.severityLevel,
        detectedObjects: report.detectedObjects
      },
      status: report.status,
      priority: report.priority,
      createdAt: report.createdAt,
      originalImage: report.originalImageFilename ? { filename: report.originalImageFilename } : null,
      processedImage: report.processedImageFilename ? { filename: report.processedImageFilename } : null
    }));
    
    console.log('📊 Public endpoint returning:', transformedReports.length, 'reports');
    res.json(transformedReports);
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
    const wasteReport = await WasteReport.create({
      reportId,
      citizenId: req.user.userId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address,
      landmark,
      originalImageFilename: req.file.filename,
      processedImageFilename: yoloResults.processedFilename,
      detectedObjects: yoloResults.detectedObjects || [],
      totalWasteArea: yoloResults.totalWasteArea,
      estimatedVolume: yoloResults.estimatedVolume,
      wasteTypes: yoloResults.wasteTypes || [],
      severityLevel: yoloResults.severityLevel || 'medium',
      priority
    });

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

    console.log('💬 Comment request - User:', req.user.userId, 'Role:', req.user.role);
    console.log('💬 Comment request - Report ID:', reportId);
    console.log('💬 Comment request - Message:', message);

    // Check if report exists and user has access
    let whereClause = { id: reportId, isActive: true };
    
    // Citizens can only comment on their own reports
    // Authorities and admins can comment on any report
    if (req.user.role === 'citizen') {
      whereClause.citizenId = req.user.userId;
    }
    
    console.log('💬 Where clause:', whereClause);
    
    const report = await WasteReport.findOne({ where: whereClause });
    if (!report) {
      console.log('💬 Report not found or access denied');
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }
    
    console.log('💬 Report found:', report.id, 'Citizen ID:', report.citizenId);

    // Add comment with user information
    const newComment = {
      user: {
        id: req.user.userId,
        name: req.user.name || 'User',
        role: req.user.role
      },
      message: message.trim(),
      timestamp: new Date()
    };

    // Get existing comments and add new one
    const existingComments = report.comments || [];
    existingComments.push(newComment);
    
    console.log('💬 Adding comment to array:', newComment);
    console.log('💬 Updated comments array length:', existingComments.length);
    
    // Use raw SQL to update JSONB field (Sequelize has issues with JSONB updates)
    await sequelize.query(
      'UPDATE waste_reports SET comments = :comments WHERE id = :id',
      {
        replacements: {
          comments: JSON.stringify(existingComments),
          id: reportId
        }
      }
    );

    console.log('💬 SQL update completed');

    // Reload the report to get the updated comments
    await report.reload();
    
    console.log('💬 Report reloaded, comments:', report.comments);

    // Get the newly added comment
    const addedComment = existingComments[existingComments.length - 1];

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
    let whereClause = { isActive: true };

    // Role-based filtering
    if (req.user.role === 'citizen') {
      whereClause.citizenId = req.user.userId;
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Priority filter
    if (priority) {
      whereClause.priority = priority;
    }

    // Citizen filter (for authorities)
    if (citizenId && req.user.role !== 'citizen') {
      whereClause.citizenId = citizenId;
    }

    // Assigned to filter
    if (assignedTo && req.user.role !== 'citizen') {
      whereClause.assignedTo = assignedTo;
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const reports = await WasteReport.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'citizen',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    const total = await WasteReport.count({ where: whereClause });

    // Transform data to match frontend expectations
    const transformedReports = reports.map(report => ({
      _id: report.id,
      reportId: report.reportId,
      location: {
        address: report.address,
        coordinates: [report.longitude, report.latitude]
      },
      wasteDetection: {
        totalWasteArea: report.totalWasteArea,
        estimatedVolume: report.estimatedVolume,
        wasteTypes: report.wasteTypes,
        severityLevel: report.severityLevel,
        detectedObjects: report.detectedObjects
      },
      status: report.status,
      priority: report.priority,
      createdAt: report.createdAt,
      originalImage: report.originalImageFilename ? { filename: report.originalImageFilename } : null,
      processedImage: report.processedImageFilename ? { filename: report.processedImageFilename } : null
    }));

    res.json({
      success: true,
      reports: transformedReports,
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
    let whereClause = { id: req.params.id, isActive: true };

    // Citizens can only see their own reports
    if (req.user.role === 'citizen') {
      whereClause.citizenId = req.user.userId;
    }

    const report = await WasteReport.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'citizen',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['name', 'email']
        }
      ]
    });


    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or you don\'t have permission to view it.'
      });
    }

    // Transform data to match frontend expectations
    const transformedReport = {
      _id: report.id,
      reportId: report.reportId,
      location: {
        address: report.address,
        coordinates: [report.longitude, report.latitude]
      },
      wasteDetection: {
        totalWasteArea: report.totalWasteArea,
        estimatedVolume: report.estimatedVolume,
        wasteTypes: report.wasteTypes,
        severityLevel: report.severityLevel,
        detectedObjects: report.detectedObjects
      },
      status: report.status,
      priority: report.priority,
      createdAt: report.createdAt,
      citizen: report.citizen ? {
        _id: report.citizen.id,
        name: report.citizen.name,
        email: report.citizen.email,
        phone: report.citizen.phone
      } : null,
      assignedUser: report.assignedUser ? {
        name: report.assignedUser.name,
        email: report.assignedUser.email
      } : null,
      comments: report.comments || [],
      originalImage: report.originalImageFilename ? { filename: report.originalImageFilename } : null,
      processedImage: report.processedImageFilename ? { filename: report.processedImageFilename } : null
    };

    res.json({
      success: true,
      report: transformedReport
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
  body('assignedTo').isUUID().withMessage('Valid user ID required')
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
    const assignedUser = await User.findOne({ 
      where: { id: assignedTo, role: 'authority', isActive: true } 
    });
    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid authority user'
      });
    }

    const report = await WasteReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.update({
      assignedTo,
      status: 'in_progress'
    });

    // Load the assigned user details
    await report.reload({
      include: [{
        model: User,
        as: 'assignedTo',
        attributes: ['name', 'email']
      }]
    });

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

    const report = await WasteReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.update({ status });
    await report.reload({
      include: [{
        model: User,
        as: 'citizen',
        attributes: ['name', 'email']
      }]
    });

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

    const report = await WasteReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const resolution = {
      resolvedBy: req.user.userId,
      resolvedAt: new Date(),
      resolutionNotes: resolutionNotes,
      beforeAfterImages: afterImages
    };

    await report.update({
      status: 'resolved',
      resolution: resolution
    });

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
// @desc    Permanently delete a waste report (only if pending and user owns it)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.id;
    console.log('🗑️ Delete request for report:', reportId);
    console.log('🗑️ User making request:', req.user);

    // Find the report
    const report = await WasteReport.findByPk(reportId);
    if (!report) {
      console.log('🗑️ Report not found:', reportId);
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    console.log('🗑️ Found report:', {
      id: report.id,
      citizenId: report.citizenId,
      status: report.status,
      userId: req.user.userId
    });

    // Check if user owns the report
    if (report.citizenId !== req.user.userId) {
      console.log('🗑️ User does not own report:', {
        reportCitizenId: report.citizenId,
        userId: req.user.userId
      });
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reports'
      });
    }

    // Check if report is in pending status
    if (report.status !== 'pending') {
      console.log('🗑️ Report is not pending:', report.status);
      return res.status(400).json({
        success: false,
        message: 'Only pending reports can be deleted'
      });
    }

    console.log('🗑️ Proceeding with hard delete...');
    // Hard delete - completely remove the report from database
    await report.destroy();
    console.log('🗑️ Report deleted successfully');

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
