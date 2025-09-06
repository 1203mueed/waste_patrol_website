# 🚀 Waste Patrol - Complete Setup Guide

**Smart Waste Management System with AI-Powered Detection**

Follow this comprehensive guide to get your Waste Patrol system running on your local machine. This system includes a React frontend, Node.js backend, Python AI service with YOLO, and PostgreSQL database.

## 📋 Prerequisites

Make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Start

### Windows
```bash
# Double-click start.bat in Windows Explorer
# OR run in terminal:
start.bat
```

### macOS/Linux
```bash
# Make script executable and run:
chmod +x start.sh
./start.sh
```

## 🍎 macOS Setup Instructions

### Prerequisites for macOS
1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js**:
   ```bash
   brew install node
   ```

3. **Install Python**:
   ```bash
   brew install python
   ```

4. **Install PostgreSQL**:
   ```bash
   brew install postgresql
   brew services start postgresql
   ```

5. **Create PostgreSQL user and database**:
   ```bash
   createuser -s postgres
   createdb waste_patrol
   psql -U postgres -c "ALTER USER postgres PASSWORD 'waste_patrol';"
   ```

### macOS Quick Start
```bash
# Clone the repository
git clone <your-repo-url>
cd waste-patrol

# Make start script executable
chmod +x start.sh

# Run the start script
./start.sh
```

## 📋 Manual Setup

### Step 1: Clone Repository
```bash
git clone <your-repository-url>
cd waste-patrol
```

### Step 2: Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

**Python AI Service:**
```bash
cd python_service
pip install -r requirements.txt  # Windows
pip3 install -r requirements.txt # macOS/Linux
cd ..
```

### Step 3: Setup PostgreSQL Database

#### Option A: Automated Setup (Recommended)
```bash
# Run the automated database setup script
npm run setup-db
```

This script will:
- Test PostgreSQL connection
- Create the `waste_patrol` database
- Create all necessary tables
- Enable UUID extension
- Run database cleanup

#### Option B: Manual Setup

**Windows**
1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Open pgAdmin or use command line
3. Create database and user

**macOS**
```bash
# Start PostgreSQL service
brew services start postgresql

# Create user and database
createuser -s postgres
createdb waste_patrol
psql -U postgres -c "ALTER USER postgres PASSWORD 'waste_patrol';"
```

**Linux (Ubuntu/Debian)**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql
CREATE DATABASE waste_patrol;
ALTER USER postgres PASSWORD 'waste_patrol';
\q
```

**Manual Database Creation:**
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and set password
CREATE DATABASE waste_patrol;
ALTER USER postgres PASSWORD 'waste_patrol';
\q
```

### Step 4: Configure Environment

**Backend Configuration:**
```bash
cd backend
cp env.example .env
```

**Environment Variables (.env):**
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waste_patrol
DB_USER=postgres
DB_PASSWORD=waste_patrol
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
PYTHON_SERVICE_URL=http://localhost:8000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 5: Start All Services

You'll need **3 terminal windows**:

**Terminal 1 - Backend API:**
```bash
cd backend
npm start
```

**Terminal 2 - Python AI Service:**
```bash
cd python_service
python app.py    # Windows
python3 app.py   # macOS/Linux
```

**Terminal 3 - Frontend:**
```bash
npm start
```

### Step 6: Access the Application

**🌐 Access URLs:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Python AI Service**: http://localhost:8000
- **Public Heatmap**: http://localhost:3000/heatmap (no login required!)

## 🆕 Latest Features & Improvements

### 💬 Comments System
- **Real-time Comments**: Users can add comments to reports
- **User Information**: Comments display user names and timestamps
- **Role-based Access**: Citizens can comment on their own reports, authorities on any report

### 🗑️ Report Management
- **Delete Functionality**: Citizens can delete their own pending reports
- **Status Tracking**: Real-time status updates and progress tracking
- **Priority System**: Automatic priority assignment based on waste volume

### 🗺️ Public Heatmap (No Login Required)
- **Live Waste Visualization**: View all active waste reports on an interactive map
- **Real-time Statistics**: See total reports, high-priority issues, and volume data
- **Public Access**: Anyone can view the heatmap without creating an account
- **Mobile Responsive**: Works perfectly on all devices
- **Interactive Map**: Click on markers for detailed information

### 🎨 Enhanced UI/UX
- **Better Logo Visibility**: Updated theme colors for better contrast
- **Enhanced Navigation**: Added heatmap links in navbar and homepage
- **Improved Styling**: Better button layouts and responsive design
- **Brand Colors**: Primary #1e4d2b (dark green), Secondary #d32f2f (dark red)

### 🔧 Technical Improvements
- **PostgreSQL Database**: Optimized database schema with cleaned up columns
- **Public API Endpoint**: `/api/reports/public` for heatmap data
- **Better Error Handling**: Improved fallbacks and user experience
- **Fixed Backend Issues**: Resolved reportId generation and data structure problems

## 🔧 Detailed Setup

### PostgreSQL Setup

**✅ Option 1: Local Installation (Recommended)**
1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Create database and user as shown above
3. Update database credentials in your `.env` file

**Option 2: PostgreSQL Cloud (Heroku, AWS RDS, etc.)**
1. Create a PostgreSQL instance on your preferred cloud provider
2. Get your connection string
3. Update database credentials in your `.env` file

### YOLO Model Setup

**✅ YOLO Model Ready:**
The system includes a pre-trained YOLO model (`train5_11.pt`) in the root directory.

```bash
# Verify the model file exists
ls -la train5_11.pt  # macOS/Linux
dir train5_11.pt     # Windows
```

**AI Service Status:** ✅ Python service ready with all dependencies
**Fallback:** If the model is unavailable, the system will use mock data for development

### Environment Variables Explained

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 5000 |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | waste_patrol |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | (required) |
| `JWT_SECRET` | Secret key for JWT tokens | (required) |
| `PYTHON_SERVICE_URL` | Python AI service URL | http://localhost:8000 |
| `MAX_FILE_SIZE` | Maximum upload file size | 10MB |

## 🧪 Testing the Setup

### 1. Health Checks

**Backend API:**
```bash
curl http://localhost:5000/api/reports/public
```

**Python AI Service:**
```bash
curl http://localhost:8000/health
```

### 2. Test Public Heatmap (No Login Required)
1. Go to http://localhost:3000/heatmap
2. You should see an interactive map with waste reports
3. Click on markers for detailed information
4. Check that statistics are displayed correctly

### 3. Create Test User
1. Open http://localhost:3000
2. Click "Register"
3. Create a citizen account
4. Login with your credentials

### 4. Test Waste Reporting
1. Go to "Report Waste"
2. Upload a test image
3. Select a location on the map
4. Submit the report
5. Check if the AI processing works

### 5. Test Comments System
1. Go to a report details page
2. Try adding a comment
3. Check that comments display with user names

### 6. Test Delete Functionality
1. Create a report as a citizen
2. Go to report details
3. Try deleting the report (should work for pending reports only)

## 🐛 Troubleshooting

### Common Issues

**1. PostgreSQL Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Make sure PostgreSQL is running and configured:

**Windows:**
```bash
# Check if PostgreSQL is running
Get-Service | Where-Object {$_.Name -like "*postgresql*"}

# Start PostgreSQL if not running
net start postgresql-x64-14

# Test connection
psql -U postgres -h localhost -p 5432
```

**macOS:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if not running
brew services start postgresql

# Test connection
psql -U postgres -h localhost -p 5432
```

**Linux:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql

# Test connection
psql -U postgres -h localhost -p 5432
```

**2. Python Dependencies Error**
```
ModuleNotFoundError: No module named 'ultralytics'
```
**Solution:** Install dependencies:
```bash
cd python_service
pip install -r requirements.txt  # Windows
pip3 install -r requirements.txt # macOS/Linux
```

**3. YOLO Model Not Found**
```
❌ YOLO model file 'train5_11.pt' not found!
```
**Solution:** ✅ Model file is already in the root directory. The system will work with mock data if the model is missing.

**4. Port Already in Use**
```
Error: listen EADDRINUSE :::5000
```
**Solution:** Kill the process using the port or change the port in your `.env` file:

**Windows:**
```bash
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Or change PORT in .env file
PORT=5001
```

**macOS/Linux:**
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env file
PORT=5001
```

**5. Frontend Can't Connect to Backend**
```
Network Error
```
**Solution:** Make sure the backend is running on port 5000 and the proxy is configured in `package.json`.

**6. Comments Not Working**
```
Comments are not adding
```
**Solution:** ✅ Fixed! The system now properly handles JSONB fields and user information in comments.

**7. Delete Button Not Showing**
```
No delete button in report details
```
**Solution:** ✅ Fixed! The delete button now appears for citizens viewing their own pending reports.

### Performance Tips

1. **Use SSD storage** for better PostgreSQL performance
2. **Allocate sufficient RAM** for Python AI service (minimum 4GB recommended)
3. **Use GPU** for faster YOLO inference (optional)
4. **Enable PostgreSQL indexes** for better query performance

## 📱 Production Deployment

### Environment Setup

1. **Set NODE_ENV to production**
2. **Use strong JWT secrets**
3. **Configure PostgreSQL database**
4. **Set up proper logging**
5. **Configure HTTPS**
6. **Set up monitoring**

### Deployment Options

- **Frontend:** Vercel, Netlify, AWS S3 + CloudFront
- **Backend:** Heroku, AWS EC2, DigitalOcean
- **Database:** PostgreSQL Cloud, AWS RDS
- **AI Service:** AWS EC2 with GPU, Google Cloud Run

## 🔐 Security Notes

- Change all default passwords and secrets
- Use HTTPS in production
- Implement proper CORS policies
- Set up rate limiting
- Regularly update dependencies
- Monitor for security vulnerabilities

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Look at the console logs for error messages
3. Check if all services are running
4. Verify your environment configuration
5. Create an issue in the GitHub repository

## 🎯 Next Steps

After successful setup:

1. **Test the Public Heatmap** - Visit http://localhost:3000/heatmap (no login required!)
2. **Create Test Accounts** - Register as citizen and authority users
3. **Test Waste Reporting** - Upload images and test AI processing
4. **Test Comments System** - Add comments to reports
5. **Test Delete Functionality** - Try deleting pending reports
6. **Customize the AI model** with your own waste detection data
7. **Configure map tiles** for your specific region
8. **Set up user roles** and permissions
9. **Customize the UI** with your branding
10. **Deploy to production** environment

## 🎉 **System Status: READY!**

Your Waste Patrol system is now fully configured and ready to use:

- ✅ **PostgreSQL**: Configured and ready
- ✅ **Backend**: Configured and ready
- ✅ **Python AI Service**: Dependencies installed
- ✅ **Frontend**: Updated with new features
- ✅ **Public Heatmap**: Accessible without login
- ✅ **Comments System**: Working with user information
- ✅ **Delete Functionality**: Working for pending reports
- ✅ **All Issues**: Resolved and fixed

**Happy coding! 🚀**