const mongoose = require('mongoose');

const wasteReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true
  },
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    },
    landmark: String
  },
  originalImage: {
    filename: String,
    path: String,
    size: Number,
    mimetype: String
  },
  processedImage: {
    filename: String,
    path: String,
    segmentedPath: String
  },
  wasteDetection: {
    detectedObjects: [{
      class: String,
      confidence: Number,
      boundingBox: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      }
    }],
    totalWasteArea: Number, // in pixels
    estimatedVolume: Number, // in cubic meters
    wasteTypes: [String],
    severityLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolutionNotes: String,
    beforeAfterImages: [String]
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
wasteReportSchema.index({ location: '2dsphere' });

// Index for faster queries
wasteReportSchema.index({ status: 1, priority: 1 });
wasteReportSchema.index({ citizenId: 1 });
wasteReportSchema.index({ assignedTo: 1 });
wasteReportSchema.index({ createdAt: -1 });

// Generate unique report ID
wasteReportSchema.pre('save', function(next) {
  if (!this.reportId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.reportId = `WR-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('WasteReport', wasteReportSchema);
