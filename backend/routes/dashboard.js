const express = require('express');
const { WasteReport, User } = require('../models');
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
      WasteReport.count({ where: { isActive: true } }),
      WasteReport.count({ 
        where: { 
          status: 'pending',
          isActive: true
        }
      }),
      WasteReport.count({ 
        where: { 
          status: 'in_progress',
          isActive: true
        }
      }),
      WasteReport.count({ 
        where: { 
          status: 'resolved',
          isActive: true
        }
      }),
      User.count({ where: { role: 'citizen', isActive: true } }),
      User.count({ where: { role: 'authority', isActive: true } })
    ]);

    // Get priority distribution for all active reports
    const priorityStats = await WasteReport.findAll({
      where: { isActive: true },
      attributes: [
        'priority',
        [require('sequelize').fn('COUNT', require('sequelize').col('priority')), 'count']
      ],
      group: ['priority'],
      raw: true
    });

    // Get daily report trends within timeframe
    const dailyTrends = await WasteReport.findAll({
      where: {
        isActive: true,
        createdAt: { [require('sequelize').Op.gte]: startDate }
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('SUM', 
          require('sequelize').literal("CASE WHEN status = 'resolved' THEN 1 ELSE 0 END")
        ), 'resolved']
      ],
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
      raw: true
    });

    // Get waste volume statistics for all active reports
    const volumeStats = await WasteReport.findAll({
      where: {
        isActive: true,
        totalWasteArea: { [require('sequelize').Op.gt]: 0 }
      },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('estimatedVolume')), 'totalVolume'],
        [require('sequelize').fn('AVG', require('sequelize').col('estimatedVolume')), 'avgVolume'],
        [require('sequelize').fn('MAX', require('sequelize').col('estimatedVolume')), 'maxVolume']
      ],
      raw: true
    });

    // Get top locations by report count for all active reports
    const topLocations = await WasteReport.findAll({
      where: {
        isActive: true,
        totalWasteArea: { [require('sequelize').Op.gt]: 0 }
      },
      attributes: [
        'address',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('AVG', require('sequelize').col('estimatedVolume')), 'avgVolume']
      ],
      group: ['address'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

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
    let whereClause = { isActive: true };
    
    if (status !== 'all') {
      whereClause.status = status;
    }
    
    if (priority !== 'all') {
      whereClause.priority = priority;
    }

    // Add geographical bounds filter
    if (bounds) {
      const [swLat, swLng, neLat, neLng] = bounds.split(',').map(parseFloat);
      whereClause.latitude = {
        [require('sequelize').Op.between]: [swLat, neLat]
      };
      whereClause.longitude = {
        [require('sequelize').Op.between]: [swLng, neLng]
      };
    }

    // Get reports with location and volume data
    const heatmapData = await WasteReport.findAll({
      where: whereClause,
      attributes: [
        'latitude', 'longitude', 'estimatedVolume', 'severityLevel', 
        'priority', 'status', 'reportId', 'createdAt', 'totalWasteArea'
      ]
    });

    // Transform data for heatmap
    const heatmapPoints = heatmapData.map(report => ({
      lat: report.latitude,
      lng: report.longitude,
      weight: report.totalWasteArea > 0 ? (report.estimatedVolume || 1) : 0.1,
      intensity: getSeverityIntensity(report.severityLevel),
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
    const recentReports = await WasteReport.findAll({
      where: { isActive: true },
      include: [
        {
          model: User,
          as: 'citizen',
          attributes: ['name', 'email']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['name', 'email']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Transform into activity feed format
    const activities = recentReports.map(report => {
      let activityType = 'report_created';
      let description = `New waste report created by ${report.citizen?.name || 'Unknown'}`;
      
      if (report.status === 'resolved') {
        activityType = 'report_resolved';
        description = `Waste report resolved by ${report.resolution?.resolvedBy?.name || 'Authority'}`;
      } else if (report.status === 'in_progress') {
        activityType = 'report_assigned';
        description = `Waste report assigned to ${report.assignedTo?.name || 'Authority'}`;
      }

      return {
        id: report.id,
        reportId: report.reportId,
        type: activityType,
        description,
        timestamp: report.updatedAt,
        priority: report.priority,
        location: report.address,
        user: report.citizen?.name || 'Unknown'
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
