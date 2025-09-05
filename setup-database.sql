-- PostgreSQL Database Setup for Waste Patrol
-- Run this script to set up the database with the correct password

-- Connect to PostgreSQL as superuser and run these commands:

-- Create the database
CREATE DATABASE waste_patrol;

-- Set the postgres user password
ALTER USER postgres PASSWORD 'waste_patrol';

-- Grant all privileges on the database to postgres user
GRANT ALL PRIVILEGES ON DATABASE waste_patrol TO postgres;

-- Connect to the waste_patrol database
\c waste_patrol;

-- Enable UUID extension (needed for Sequelize UUID primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Display success message
SELECT 'Database setup completed successfully!' as status;
