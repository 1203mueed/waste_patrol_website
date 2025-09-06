# 🗄️ Database Setup Guide

## ✅ **Your Repository Now Includes Complete Database Setup!**

### 🚀 **Automated Database Setup (Recommended)**

The easiest way to set up your database is using the automated script:

```bash
# From the project root directory
npm run setup-db
```

**What this script does:**
- ✅ Tests PostgreSQL connection
- ✅ Creates the `waste_patrol` database
- ✅ Creates all necessary tables using Sequelize models
- ✅ Enables UUID extension for primary keys
- ✅ Runs database cleanup to remove unnecessary columns
- ✅ Sets up proper permissions

### 📁 **Database Setup Files Available**

#### 1. **`setup-database.js`** (Root Level)
- **Purpose**: Main database setup script
- **Usage**: `npm run setup-db`
- **Features**: Complete automated setup with error handling

#### 2. **`backend/scripts/setup-database.js`** (Backend Level)
- **Purpose**: Detailed database setup with PostgreSQL driver
- **Usage**: `cd backend && npm run setup-db`
- **Features**: Advanced setup with dependency checking

#### 3. **`setup-database.sql`** (Manual Setup)
- **Purpose**: Manual SQL commands for database creation
- **Usage**: Run in PostgreSQL client
- **Features**: Basic database and user creation

#### 4. **`backend/scripts/cleanup-database.js`** (Maintenance)
- **Purpose**: Remove unnecessary columns from existing database
- **Usage**: `cd backend && npm run cleanup-db`
- **Features**: Clean up legacy columns

### 🎯 **Quick Start Commands**

```bash
# Complete setup (recommended)
npm run setup-db

# Backend-specific setup
cd backend && npm run setup-db

# Database cleanup
cd backend && npm run cleanup-db

# Manual SQL setup
psql -U postgres -f setup-database.sql
```

### 🔧 **What Gets Created**

#### **Database:**
- Database name: `waste_patrol`
- User: `postgres` (password: `waste_patrol`)
- UUID extension enabled

#### **Tables (via Sequelize models):**
- `users` - User accounts and authentication
- `waste_reports` - Waste report data with comments
- `locations` - Location information
- `waste_report_locations` - Junction table for reports and locations

#### **Features:**
- ✅ Automatic table creation/updates
- ✅ Proper foreign key relationships
- ✅ UUID primary keys
- ✅ Timestamps (created_at, updated_at)
- ✅ JSONB fields for comments and metadata

### 🐛 **Troubleshooting**

#### **Common Issues:**

**1. PostgreSQL Not Running**
```bash
# Windows
net start postgresql-x64-14

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

**2. Permission Denied**
```bash
# Grant superuser privileges
sudo -u postgres psql
ALTER USER postgres WITH SUPERUSER;
```

**3. Database Already Exists**
```bash
# The script will handle this gracefully
# It will use the existing database
```

**4. Connection Refused**
```bash
# Check if PostgreSQL is listening on port 5432
netstat -an | grep 5432  # macOS/Linux
netstat -an | findstr 5432  # Windows
```

### 📋 **Setup Process Flow**

1. **Prerequisites Check**
   - PostgreSQL installed and running
   - Node.js and npm available
   - `.env` file configured

2. **Database Creation**
   - Connect to PostgreSQL as superuser
   - Create `waste_patrol` database
   - Enable UUID extension

3. **Table Creation**
   - Connect to `waste_patrol` database
   - Import Sequelize models
   - Run `sequelize.sync()` to create tables

4. **Cleanup**
   - Remove unnecessary columns
   - Optimize database structure

5. **Verification**
   - Test database connection
   - Verify table creation
   - Display success message

### 🎉 **Ready to Use!**

After running the setup script, your database will be ready for the Waste Patrol application:

- ✅ **Backend**: Can connect and create/read data
- ✅ **Frontend**: Can display reports and user data
- ✅ **API**: All endpoints will work properly
- ✅ **Comments**: JSONB fields ready for comments
- ✅ **File Uploads**: Image paths stored correctly

### 📞 **Support**

If you encounter issues:

1. **Check PostgreSQL Status**: Make sure PostgreSQL is running
2. **Verify .env File**: Check database credentials in `backend/.env`
3. **Check Logs**: Look at console output for specific error messages
4. **Manual Setup**: Use the SQL script as a fallback
5. **Clean Install**: Drop and recreate the database if needed

---

**Your database setup is now fully automated and ready to use! 🚀**
