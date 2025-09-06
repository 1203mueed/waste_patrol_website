#!/usr/bin/env node

/**
 * Database Setup Script for Waste Patrol
 * 
 * This script automatically sets up the PostgreSQL database for the Waste Patrol system.
 * It creates the database, tables, and runs necessary setup procedures.
 * 
 * Usage:
 *   node setup-database.js
 * 
 * Prerequisites:
 *   - PostgreSQL must be installed and running
 *   - postgres user must have CREATE DATABASE privileges
 *   - .env file must be configured in backend directory
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🗄️  Waste Patrol Database Setup');
console.log('================================');
console.log('');

// Check if we're in the right directory
if (!fs.existsSync('backend')) {
  console.error('❌ Error: Please run this script from the project root directory');
  console.log('   The backend folder should be visible from this location');
  process.exit(1);
}

// Check if .env file exists
const envPath = path.join('backend', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found in backend directory');
  console.log('   Creating .env file from template...');
  
  const envExamplePath = path.join('backend', 'env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created backend/.env from template');
    console.log('   Please edit backend/.env with your database configuration if needed');
  } else {
    console.error('❌ No env.example file found. Please create backend/.env manually');
    process.exit(1);
  }
}

console.log('🚀 Starting database setup...');
console.log('');

// Run the database setup script
const setupScript = path.join('backend', 'scripts', 'setup-database.js');

exec(`node "${setupScript}"`, { cwd: process.cwd() }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Database setup failed:');
    console.error(stderr);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Check your backend/.env file configuration');
    console.log('3. Ensure the postgres user has proper permissions');
    console.log('4. Try running: psql -U postgres -c "CREATE DATABASE waste_patrol;"');
    process.exit(1);
  }
  
  console.log(stdout);
  console.log('');
  console.log('🎉 Database setup completed successfully!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Start the backend server: cd backend && npm start');
  console.log('2. Start the Python AI service: cd python_service && python app.py');
  console.log('3. Start the frontend: npm start');
  console.log('');
  console.log('🌐 Access URLs:');
  console.log('   - Frontend: http://localhost:3000');
  console.log('   - Backend API: http://localhost:5000');
  console.log('   - Public Heatmap: http://localhost:3000/heatmap');
});
