const { Sequelize } = require('sequelize');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'waste_patrol',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waste_patrol'
};

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    console.log('📋 Configuration:', {
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      database: DB_CONFIG.database,
      username: DB_CONFIG.username
    });

    // Step 1: Test if PostgreSQL is running
    console.log('\n1️⃣ Testing PostgreSQL connection...');
    await testPostgreSQLConnection();

    // Step 2: Create database if it doesn't exist
    console.log('\n2️⃣ Creating database...');
    await createDatabase();

    // Step 3: Create tables using Sequelize
    console.log('\n3️⃣ Creating tables...');
    await createTables();

    // Step 4: Run cleanup script to remove unnecessary columns
    console.log('\n4️⃣ Cleaning up database...');
    await runCleanup();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Database is ready for use with:');
    console.log(`   - Database: ${DB_CONFIG.database}`);
    console.log(`   - Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`   - User: ${DB_CONFIG.username}`);

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Check your .env file configuration');
    console.log('3. Ensure the postgres user has proper permissions');
    process.exit(1);
  }
}

async function testPostgreSQLConnection() {
  return new Promise((resolve, reject) => {
    const { Client } = require('pg');
    const client = new Client({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.username,
      password: DB_CONFIG.password,
      database: 'postgres' // Connect to default postgres database first
    });

    client.connect()
      .then(() => {
        console.log('✅ PostgreSQL connection successful');
        client.end();
        resolve();
      })
      .catch((error) => {
        console.error('❌ PostgreSQL connection failed:', error.message);
        reject(error);
      });
  });
}

async function createDatabase() {
  return new Promise((resolve, reject) => {
    const { Client } = require('pg');
    const client = new Client({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.username,
      password: DB_CONFIG.password,
      database: 'postgres' // Connect to default postgres database
    });

    client.connect()
      .then(() => {
        // Check if database exists
        return client.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_CONFIG.database}'`);
      })
      .then((result) => {
        if (result.rows.length === 0) {
          console.log(`📝 Creating database: ${DB_CONFIG.database}`);
          return client.query(`CREATE DATABASE "${DB_CONFIG.database}"`);
        } else {
          console.log(`✅ Database ${DB_CONFIG.database} already exists`);
          return Promise.resolve();
        }
      })
      .then(() => {
        return client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
      })
      .then(() => {
        console.log('✅ UUID extension enabled');
        client.end();
        resolve();
      })
      .catch((error) => {
        console.error('❌ Database creation failed:', error.message);
        client.end();
        reject(error);
      });
  });
}

async function createTables() {
  const { sequelize } = require('../config/database');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to target database');
    
    // Import models to ensure they're registered
    require('../models');
    
    // Sync database (create tables)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Tables created/updated successfully');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Table creation failed:', error.message);
    throw error;
  }
}

async function runCleanup() {
  try {
    const cleanupScript = require('./cleanup-database');
    await cleanupScript();
    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.log('⚠️ Cleanup script failed (this is usually okay):', error.message);
  }
}

// Check if required dependencies are available
function checkDependencies() {
  try {
    require('pg');
    console.log('✅ PostgreSQL driver (pg) is available');
  } catch (error) {
    console.error('❌ PostgreSQL driver (pg) is not installed');
    console.log('Please install it with: npm install pg');
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  console.log('🗄️  Waste Patrol Database Setup');
  console.log('================================');
  
  // Check dependencies
  checkDependencies();
  
  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  
  // Run setup
  setupDatabase();
}

module.exports = setupDatabase;
