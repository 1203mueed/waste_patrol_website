const { sequelize } = require('../config/database');

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Remove unnecessary columns from waste_reports table
    const wasteReportsColumns = [
      'original_image_path',
      'original_image_size', 
      'original_image_mimetype',
      'processed_image_path',
      'segmented_image_path'
    ];
    
    for (const column of wasteReportsColumns) {
      try {
        await sequelize.query(`ALTER TABLE waste_reports DROP COLUMN IF EXISTS ${column};`);
        console.log(`✅ Removed column: ${column}`);
      } catch (error) {
        console.log(`⚠️  Column ${column} may not exist: ${error.message}`);
      }
    }
    
    // Remove unnecessary columns from users table
    const usersColumns = [
      'last_login',
      'profile_picture'
    ];
    
    for (const column of usersColumns) {
      try {
        await sequelize.query(`ALTER TABLE users DROP COLUMN IF EXISTS ${column};`);
        console.log(`✅ Removed column: ${column}`);
      } catch (error) {
        console.log(`⚠️  Column ${column} may not exist: ${error.message}`);
      }
    }
    
    // Remove unnecessary columns from locations table
    const locationsColumns = [
      'boundaries',
      'waste_collection_schedule',
      'statistics'
    ];
    
    for (const column of locationsColumns) {
      try {
        await sequelize.query(`ALTER TABLE locations DROP COLUMN IF EXISTS ${column};`);
        console.log(`✅ Removed column: ${column}`);
      } catch (error) {
        console.log(`⚠️  Column ${column} may not exist: ${error.message}`);
      }
    }
    
    console.log('🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupDatabase();
}

module.exports = cleanupDatabase;
