const express = require('express');
const WasteReport = require('../models/WasteReport');
const User = require('../models/User');
const { authenticateToken, requireAuthority } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Authority/Admin)
router.get('/stats', authenticateToken, requireAuthority, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch (timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get basic statistics - count all active reports regardless of timeframe for overview
    const [
      totalReports,
      pendingReports,
      inProgressReports,
      resolvedReports,
      totalCitizens,
      totalAuthorities
    ] = await Promise.all([
      WasteReport.countDocuments({ isActive: true }),
      WasteReport.countDocuments({ 
        status: 'pending',
        isActive: true
      }),
      WasteReport.countDocuments({ 
        status: 'in_progress',
        isActive: true
      }),
      WasteReport.countDocuments({ 
        status: 'resolved',
        isActive: true
      }),
      User.countDocuments({ role: 'citizen', isActive: true }),
      User.countDocuments({ role: 'authority', isActive: true })
    ]);

    // Get priority distribution for all active reports
    const priorityStats = await WasteReport.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily report trends within timeframe
    const dailyTrends = await WasteReport.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Get waste volume statistics for all active reports
    const volumeStats = await WasteReport.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $match: { 'wasteDetection.totalWasteArea': { $gt: 0 } }
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$wasteDetection.estimatedVolume' },
          avgVolume: { $avg: '$wasteDetection.estimatedVolume' },
          maxVolume: { $max: '$wasteDetection.estimatedVolume' }
        }
      }
    ]);

    // Get top locations by report count for all active reports
    const topLocations = await WasteReport.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $match: { 'wasteDetection.totalWasteArea': { $gt: 0 } }
      },
      {
        $group: {
          _id: '$location.address',
          count: { $sum: 1 },
          avgVolume: { $avg: '$wasteDetection.estimatedVolume' },
          location: { $first: '$location' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalReports,
          pendingReports,
          inProgressReports,
          resolvedReports,
          totalCitizens,
          totalAuthorities,
          resolutionRate: totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0
        },
        priorityDistribution: priorityStats,
        dailyTrends,
        volumeStats: volumeStats[0] || { totalVolume: 0, avgVolume: 0, maxVolume: 0 },
        topLocations,
        timeframe
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard statistics'
    });
  }
});

// @route   GET /api/dashboard/heatmap
// @desc    Get heatmap data for waste reports
// @access  Private (Authority/Admin)
router.get('/heatmap', authenticateToken, requireAuthority, async (req, res) => {
  try {
    const { 
      status = 'all',
      priority = 'all',
      bounds // Format: "sw_lat,sw_lng,ne_lat,ne_lng"
    } = req.query;

    // Build query
    let query = { isActive: true };
    
    if (status !== 'all') {
      query.status = status;
    }
    
    if (priority !== 'all') {
      query.priority = priority;
    }

    // Add geographical bounds filter
    if (bounds) {
      const [swLat, swLng, neLat, neLng] = bounds.split(',').map(parseFloat);
      query.location = {
        $geoWithin: {
          $box: [
            [swLng, swLat], // Southwest corner
            [neLng, neLat]  // Northeast corner
          ]
        }
      };
    }

    // Get reports with location and volume data
    const heatmapData = await WasteReport.find(query, {
      'location.coordinates': 1,
      'wasteDetection.estimatedVolume': 1,
      'wasteDetection.severityLevel': 1,
      'priority': 1,
      'status': 1,
      'reportId': 1,
      'createdAt': 1
    });

    // Transform data for heatmap
    const heatmapPoints = heatmapData.map(report => ({
      lat: report.location.coordinates[1],
      lng: report.location.coordinates[0],
      weight: report.wasteDetection.totalWasteArea > 0 ? (report.wasteDetection.estimatedVolume || 1) : 0.1,
      intensity: getSeverityIntensity(report.wasteDetection.severityLevel),
      reportId: report.reportId,
      priority: report.priority,
      status: report.status,
      createdAt: report.createdAt
    }));

    res.json({
      success: true,
      data: {
        points: heatmapPoints,
        total: heatmapPoints.length,
        filters: { status, priority, bounds }
      }
    });
  } catch (error) {
    console.error('Heatmap data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching heatmap data'
    });
  }
});

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity feed
// @access  Private (Authority/Admin)
router.get('/recent-activity', authenticateToken, requireAuthority, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent reports with citizen and assigned authority info
    const recentReports = await WasteReport.find({ isActive: true })
      .populate('citizenId', 'name email')
      .populate('assignedTo', 'name email')
      .populate('resolution.resolvedBy', 'name email')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    // Transform into activity feed format
    const activities = recentReports.map(report => {
      let activityType = 'report_created';
      let description = `New waste report created by ${report.citizenId?.name || 'Unknown'}`;
      
      if (report.status === 'resolved') {
        activityType = 'report_resolved';
        description = `Waste report resolved by ${report.resolution.resolvedBy?.name || 'Authority'}`;
      } else if (report.status === 'in_progress') {
        activityType = 'report_assigned';
        description = `Waste report assigned to ${report.assignedTo?.name || 'Authority'}`;
      }

      return {
        id: report._id,
        reportId: report.reportId,
        type: activityType,
        description,
        timestamp: report.updatedAt,
        priority: report.priority,
        location: report.location.address,
        user: report.citizenId?.name || 'Unknown'
      };
    });

    res.json({
      success: true,
      data: {
        activities,
        total: activities.length
      }
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recent activity'
    });
  }
});

// Helper function to convert severity level to heatmap intensity
function getSeverityIntensity(severityLevel) {
  const intensityMap = {
    'low': 0.3,
    'medium': 0.6,
    'high': 0.8,
    'critical': 1.0
  };
  return intensityMap[severityLevel] || 0.5;
}

module.exports = router;
