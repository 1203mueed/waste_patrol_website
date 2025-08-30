const express = require('express');
const Location = require('../models/Location');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/locations
// @desc    Get all locations
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, city, limit = 50 } = req.query;

    let query = { isActive: true };
    
    if (type) {
      query.type = type;
    }
    
    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }

    const locations = await Location.find(query)
      .limit(parseInt(limit))
      .sort({ 'statistics.totalReports': -1 });

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Locations fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching locations'
    });
  }
});

// @route   GET /api/locations/nearby
// @desc    Get nearby locations
// @access  Private
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000, limit = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const nearbyLocations = await Location.find({
      isActive: true,
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    }).limit(parseInt(limit));

    res.json({
      success: true,
      data: nearbyLocations
    });
  } catch (error) {
    console.error('Nearby locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching nearby locations'
    });
  }
});

module.exports = router;
