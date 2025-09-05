# 🐘 PostgreSQL Migration Guide

This guide will help you migrate your Waste Patrol application from MongoDB to PostgreSQL.

## 📋 Migration Checklist

### ✅ Completed Tasks
- [x] Updated `package.json` dependencies (mongoose → sequelize, pg, pg-hstore)
- [x] Created PostgreSQL database configuration (`backend/config/database.js`)
- [x] Converted all models to Sequelize format:
  - [x] User model (`backend/models/User.js`)
  - [x] WasteReport model (`backend/models/WasteReport.js`)
  - [x] Location model (`backend/models/Location.js`)
- [x] Updated server.js to use PostgreSQL connection
- [x] Updated authentication routes (`backend/routes/auth.js`)
- [x] Updated public reports endpoint (`backend/routes/reports.js`)
- [x] Updated environment configuration (`backend/env.example`)
- [x] Updated documentation (README.md, setup.md)
- [x] Created migration script (`backend/scripts/migrate-to-postgres.js`)

### 🔄 Remaining Tasks
- [ ] Update remaining route handlers (dashboard.js, locations.js, users.js)
- [ ] Install PostgreSQL and create database
- [ ] Run migration script
- [ ] Test all endpoints

## 🚀 Quick Migration Steps

### 1. Install PostgreSQL
```bash
# Windows: Download from https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib
```

### 2. Create Database
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database and set password
CREATE DATABASE waste_patrol;
ALTER USER postgres PASSWORD 'waste_patrol';
\q
```

### 3. Update Environment
```bash
cd backend
cp env.example .env
# Edit .env with your PostgreSQL credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=waste_patrol
# DB_USER=postgres
# DB_PASSWORD=waste_patrol
```

### 4. Install Dependencies
```bash
cd backend
npm install
```

### 5. Run Migration
```bash
node scripts/migrate-to-postgres.js
```

### 6. Start Application
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Python AI Service
cd python_service && python run.py

# Terminal 3 - Frontend
npm start
```

## 🔧 Key Changes Made

### Database Models
- **MongoDB ObjectId** → **PostgreSQL UUID**
- **Mongoose Schema** → **Sequelize Model**
- **Embedded Documents** → **JSONB columns**
- **Geospatial Indexes** → **Coordinate columns with indexes**

### API Changes
- **MongoDB Queries** → **Sequelize Queries**
- **Mongoose Methods** → **Sequelize Methods**
- **Aggregation Pipeline** → **Raw SQL or Sequelize functions**

### Data Structure Changes
```javascript
// MongoDB (Old)
{
  _id: ObjectId,
  location: {
    type: "Point",
    coordinates: [lng, lat]
  },
  wasteDetection: {
    detectedObjects: [...],
    totalWasteArea: 15000
  }
}

// PostgreSQL (New)
{
  id: UUID,
  latitude: DECIMAL(10,8),
  longitude: DECIMAL(11,8),
  detectedObjects: JSONB,
  totalWasteArea: INTEGER
}
```

## 🧪 Testing the Migration

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Test Public Heatmap
```bash
curl http://localhost:5000/api/reports/public
```

### 3. Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🐛 Troubleshooting

### Common Issues

**1. PostgreSQL Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS
Get-Service | Where-Object {$_.Name -like "*postgresql*"}  # Windows

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS
net start postgresql-x64-14  # Windows
```

**2. Database Does Not Exist**
```
Error: database "waste_patrol" does not exist
```
**Solution:**
```sql
psql -U postgres
CREATE DATABASE waste_patrol;
\q
```

**3. Permission Denied**
```
Error: permission denied for database waste_patrol
```
**Solution:**
```sql
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE waste_patrol TO your_user;
\q
```

**4. Sequelize Connection Error**
```
Error: SequelizeConnectionError
```
**Solution:**
- Check your `.env` file credentials
- Ensure PostgreSQL is running
- Verify database exists
- Check user permissions

## 📊 Performance Considerations

### Indexes
The migration includes optimized indexes for:
- User lookups (email, role)
- Report queries (status, priority, location)
- Geospatial queries (latitude, longitude)

### JSONB Benefits
- **Flexible Schema**: Store complex objects without rigid structure
- **Query Performance**: Index JSONB columns for fast queries
- **Storage Efficiency**: Better compression than separate tables

### Connection Pooling
Sequelize is configured with connection pooling:
- **Max Connections**: 5
- **Min Connections**: 0
- **Acquire Timeout**: 30 seconds
- **Idle Timeout**: 10 seconds

## 🔄 Rollback Plan

If you need to rollback to MongoDB:

1. **Restore MongoDB dependencies:**
```bash
cd backend
npm uninstall sequelize pg pg-hstore
npm install mongoose
```

2. **Restore original models:**
```bash
git checkout HEAD~1 -- models/
```

3. **Restore original server.js:**
```bash
git checkout HEAD~1 -- server.js
```

4. **Update .env file:**
```env
MONGODB_URI=mongodb://localhost:27017/waste_patrol
```

## 🎯 Next Steps

After successful migration:

1. **Monitor Performance**: Check query performance and optimize if needed
2. **Backup Strategy**: Set up regular PostgreSQL backups
3. **Production Deployment**: Update production environment variables
4. **Team Training**: Update team documentation and procedures

## 📞 Support

If you encounter issues during migration:

1. Check this troubleshooting guide
2. Review PostgreSQL logs
3. Verify environment configuration
4. Test database connection manually
5. Create an issue in the repository

---

**Migration Status**: ✅ Ready for testing
**Estimated Time**: 30-60 minutes
**Risk Level**: Low (with rollback plan)
