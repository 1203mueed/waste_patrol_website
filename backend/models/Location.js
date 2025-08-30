const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['residential', 'commercial', 'industrial', 'public', 'park', 'street'],
    required: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    street: String,
    area: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Bangladesh'
    }
  },
  boundaries: {
    type: {
      type: String,
      enum: ['Polygon'],
    },
    coordinates: {
      type: [[[Number]]] // Array of linear ring coordinate arrays
    }
  },
  wasteCollectionSchedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
      default: 'weekly'
    },
    days: [String], // ['monday', 'wednesday', 'friday']
    time: String, // '08:00'
    lastCollection: Date,
    nextCollection: Date
  },
  statistics: {
    totalReports: {
      type: Number,
      default: 0
    },
    resolvedReports: {
      type: Number,
      default: 0
    },
    averageResolutionTime: Number, // in hours
    lastReportDate: Date,
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create geospatial indexes
locationSchema.index({ coordinates: '2dsphere' });
locationSchema.index({ boundaries: '2dsphere' });

// Index for faster queries
locationSchema.index({ type: 1 });
locationSchema.index({ 'address.city': 1 });
locationSchema.index({ 'statistics.riskLevel': 1 });

module.exports = mongoose.model('Location', locationSchema);
