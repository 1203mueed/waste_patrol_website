const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  type: {
    type: DataTypes.ENUM('residential', 'commercial', 'industrial', 'public', 'park', 'street'),
    allowNull: false
  },
  // Location coordinates
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  // Address data (stored as JSON)
  address: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      street: null,
      area: null,
      city: null,
      state: null,
      zipCode: null,
      country: 'Bangladesh'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'locations',
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['latitude', 'longitude']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = Location;
