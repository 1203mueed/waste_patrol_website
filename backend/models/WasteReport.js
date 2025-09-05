const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WasteReport = sequelize.define('WasteReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reportId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    field: 'report_id'
  },
  citizenId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'citizen_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Location data
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  landmark: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Image data
  originalImageFilename: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'original_image_filename'
  },
  originalImagePath: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'original_image_path'
  },
  originalImageSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'original_image_size'
  },
  originalImageMimetype: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'original_image_mimetype'
  },
  processedImageFilename: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'processed_image_filename'
  },
  processedImagePath: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'processed_image_path'
  },
  segmentedImagePath: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'segmented_image_path'
  },
  // Waste detection data (stored as JSON)
  detectedObjects: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'detected_objects'
  },
  totalWasteArea: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Area in pixels',
    field: 'total_waste_area'
  },
  estimatedVolume: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
    comment: 'Volume in cubic meters',
    field: 'estimated_volume'
  },
  wasteTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    field: 'waste_types'
  },
  severityLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
    field: 'severity_level'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'resolved', 'rejected'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Resolution data (stored as JSON)
  resolution: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  // Comments (stored as JSON array)
  comments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'waste_reports',
  hooks: {
    beforeCreate: (report) => {
      if (!report.reportId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        report.reportId = `WR-${timestamp}-${random}`.toUpperCase();
      }
    }
  },
  indexes: [
    {
      fields: ['status', 'priority']
    },
    {
      fields: ['citizen_id']
    },
    {
      fields: ['assigned_to']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['latitude', 'longitude']
    }
  ]
});

module.exports = WasteReport;
