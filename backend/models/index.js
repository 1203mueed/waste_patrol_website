const User = require('./User');
const WasteReport = require('./WasteReport');
const Location = require('./Location');

// Define associations
User.hasMany(WasteReport, {
  foreignKey: 'citizenId',
  as: 'reports'
});

WasteReport.belongsTo(User, {
  foreignKey: 'citizenId',
  as: 'citizen'
});

User.hasMany(WasteReport, {
  foreignKey: 'assignedTo',
  as: 'assignedReports'
});

WasteReport.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignedUser'
});

module.exports = {
  User,
  WasteReport,
  Location
};
