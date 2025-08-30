const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAuthority } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (for authorities/admin)
// @access  Private (Authority/Admin)
router.get('/', authenticateToken, requireAuthority, async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    let query = { isActive: true };
    
    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// @route   GET /api/users/authorities
// @desc    Get all authority users
// @access  Private
router.get('/authorities', authenticateToken, async (req, res) => {
  try {
    const authorities = await User.find({ 
      role: 'authority', 
      isActive: true 
    }).select('name email phone');

    res.json({
      success: true,
      data: authorities
    });
  } catch (error) {
    console.error('Authorities fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching authorities'
    });
  }
});

// @route   PUT /api/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private (Admin only)
router.put('/:id/toggle-status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling user status'
    });
  }
});

module.exports = router;
