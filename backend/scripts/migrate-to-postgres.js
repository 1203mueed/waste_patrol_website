#!/usr/bin/env node

/**
 * Migration Script: MongoDB to PostgreSQL
 * 
 * This script helps migrate data from MongoDB to PostgreSQL
 * Run this after setting up PostgreSQL and updating your models
 */

const { sequelize } = require('../config/database');
const { User, WasteReport, Location } = require('../models');

async function migrateToPostgreSQL() {
  try {
    console.log('🚀 Starting PostgreSQL migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established');
    
    // Sync database (create tables)
    await sequelize.sync({ force: false }); // Don't force to avoid data loss
    console.log('✅ Database tables synchronized');
    
    // Create sample data if no data exists
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('📝 Creating sample data...');
      
      // Create sample users
      const sampleUsers = await User.bulkCreate([
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'citizen',
          phone: '+1234567890',
          address: '123 Main St, City, State'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password123',
          role: 'authority',
          phone: '+1234567891',
          address: '456 Oak Ave, City, State'
        },
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password123',
          role: 'admin',
          phone: '+1234567892',
          address: '789 Pine St, City, State'
        }
      ]);
      
      console.log(`✅ Created ${sampleUsers.length} sample users`);
      
      // Create sample waste reports
      const sampleReports = await WasteReport.bulkCreate([
        {
          reportId: `WR-${Date.now()}-ABC123`,
          citizenId: sampleUsers[0].id,
          latitude: 23.7937,
          longitude: 90.4066,
          address: 'Dhaka, Bangladesh',
          landmark: 'Near Central Park',
          originalImageFilename: 'sample1.jpg',
          detectedObjects: [
            {
              class: 'plastic_bottle',
              confidence: 0.85,
              boundingBox: { x: 100, y: 150, width: 50, height: 80 }
            }
          ],
          totalWasteArea: 15000,
          estimatedVolume: 1.5,
          wasteTypes: ['plastic', 'paper'],
          severityLevel: 'medium',
          status: 'pending',
          priority: 'medium'
        },
        {
          reportId: `WR-${Date.now() + 1}-DEF456`,
          citizenId: sampleUsers[0].id,
          latitude: 23.8103,
          longitude: 90.4125,
          address: 'Dhaka, Bangladesh',
          landmark: 'Near University Area',
          originalImageFilename: 'sample2.jpg',
          detectedObjects: [
            {
              class: 'food_waste',
              confidence: 0.92,
              boundingBox: { x: 200, y: 100, width: 80, height: 60 }
            }
          ],
          totalWasteArea: 25000,
          estimatedVolume: 2.3,
          wasteTypes: ['food', 'organic'],
          severityLevel: 'high',
          status: 'pending',
          priority: 'high'
        }
      ]);
      
      console.log(`✅ Created ${sampleReports.length} sample waste reports`);
      
      // Create sample locations
      const sampleLocations = await Location.bulkCreate([
        {
          name: 'Central Park Area',
          type: 'public',
          latitude: 23.7937,
          longitude: 90.4066,
          address: {
            street: 'Park Street',
            area: 'Central',
            city: 'Dhaka',
            state: 'Dhaka',
            country: 'Bangladesh'
          },
          wasteCollectionSchedule: {
            frequency: 'weekly',
            days: ['monday', 'friday'],
            time: '08:00'
          },
          statistics: {
            totalReports: 2,
            resolvedReports: 0,
            riskLevel: 'medium'
          }
        }
      ]);
      
      console.log(`✅ Created ${sampleLocations.length} sample locations`);
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env file with PostgreSQL credentials');
    console.log('2. Install PostgreSQL dependencies: npm install');
    console.log('3. Start your application: npm run dev');
    console.log('4. Test the endpoints to ensure everything works');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToPostgreSQL();
}

module.exports = { migrateToPostgreSQL };
