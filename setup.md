# 🚀 Waste Patrol - Complete Setup Guide

**Smart Waste Management System with AI-Powered Detection**

Follow this comprehensive guide to get your Waste Patrol system running on your local machine. This system includes a React frontend, Node.js backend, Python AI service with YOLO, and MongoDB database.

## 📋 Prerequisites

Make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Start (Windows)

### Option 1: Automated Start
```bash
# Double-click start.bat in Windows Explorer
# OR run in terminal:
start.bat
```

### Option 2: Manual Start
```bash
# Clone and navigate (if using git)
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
pip install -r requirements.txt
cd ..
```

**Note:** All dependencies are already installed in your current setup!

### Step 3: Setup Database

**PostgreSQL Setup:**
1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Create a database named `waste_patrol`
3. Update your `.env` file with PostgreSQL credentials

**Create Database:**
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and set password
CREATE DATABASE waste_patrol;
ALTER USER postgres PASSWORD 'waste_patrol';
\q
```

**Database Status:** ✅ Ready for configuration

### Step 4: Configure Environment

**✅ Backend Configuration Complete:**
```bash
cd backend
cp env.example .env
```

**Environment Status:** ✅ Configured and ready

Your `.env` file contains:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waste_patrol
DB_USER=postgres
DB_PASSWORD=waste_patrol
JWT_SECRET=your-super-secret-key-change-this
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
npm run dev
```
**Status:** ✅ Ready to start

**Terminal 2 - Python AI Service:**
```bash
cd python_service
python app.py
```
**Status:** ✅ Ready to start

**Terminal 3 - Frontend:**
```bash
npm start
```
**Status:** ✅ Ready to start

### Step 6: Access the Application

**🌐 Access URLs:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Python AI Service**: http://localhost:8000
- **Public Heatmap**: http://localhost:3000/heatmap (no login required!)

**🚀 Quick Access:**
- **Homepage**: http://localhost:3000
- **Live Heatmap**: http://localhost:3000/heatmap
- **User Dashboard**: http://localhost:3000/dashboard (after login)

## 🆕 Latest Features & Improvements

### 🗺️ Public Heatmap (No Login Required)
- **Live Waste Visualization**: View all active waste reports on an interactive map
- **Real-time Statistics**: See total reports, high-priority issues, and volume data
- **Public Access**: Anyone can view the heatmap without creating an account
- **Mobile Responsive**: Works perfectly on all devices
- **Interactive Map**: Click on markers for detailed information

### 🎨 Enhanced UI/UX
- **Better Logo Visibility**: Updated theme colors for better contrast with transparent logo
- **Enhanced Navigation**: Added heatmap links in navbar and homepage
- **Improved Styling**: Better button layouts and responsive design
- **Brand Colors**: Primary #1e4d2b (dark green), Secondary #d32f2f (dark red)

### 🔧 Technical Improvements
- **Local MongoDB**: Automatically installed and configured
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
ls -la train5_11.pt
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
curl http://localhost:5000/api/health
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

## 🧪 Testing the System

### 1. Health Check
Once all services are running, test:
- Frontend: http://localhost:3000 (should show homepage)
- Backend: http://localhost:5000/api/health (should return JSON)
- Python Service: http://localhost:8000/health (should return JSON)

### 2. Test Public Heatmap
1. Go to http://localhost:3000/heatmap
2. You should see an interactive map with waste reports
3. No login required - this is a public feature!
4. Check that the map loads and shows sample data
5. Click on markers for detailed information

### 3. Create Test Account
1. Go to http://localhost:3000
2. Click "Register" 
3. Create a citizen account
4. Login and test the system

### 4. Test Waste Reporting
1. Click "Report Waste"
2. Upload a test image
3. Select location on map
4. Submit report
5. Check AI processing results

## 🐛 Troubleshooting

### Common Issues

**1. PostgreSQL Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Make sure PostgreSQL is running and configured:
```bash
# Check if PostgreSQL is running (Windows)
Get-Service | Where-Object {$_.Name -like "*postgresql*"}

# Start PostgreSQL if not running
net start postgresql-x64-14

# Test connection
psql -U postgres -h localhost -p 5432
```

**2. Python Dependencies Error**
```
ModuleNotFoundError: No module named 'ultralytics'
```
**Solution:** Dependencies are already installed, but if needed:
```bash
cd python_service
pip install -r requirements.txt
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
```bash
# Find and kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Or change PORT in .env file
PORT=5001
```

**5. Frontend Can't Connect to Backend**
```
Network Error
```
**Solution:** Make sure the backend is running on port 5000 and the proxy is configured in `package.json`.

**6. Report Submission Error**
```
Report submission error: AxiosError
```
**Solution:** ✅ Fixed! The system now properly generates reportId and handles data structures correctly.

### Performance Tips

1. **Use SSD storage** for better MongoDB performance
2. **Allocate sufficient RAM** for Python AI service (minimum 4GB recommended)
3. **Use GPU** for faster YOLO inference (optional)
4. **Enable MongoDB indexes** for better query performance

## 📱 Production Deployment

### Environment Setup

1. **Set NODE_ENV to production**
2. **Use strong JWT secrets**
3. **Configure MongoDB Atlas**
4. **Set up proper logging**
5. **Configure HTTPS**
6. **Set up monitoring**

### Deployment Options

- **Frontend:** Vercel, Netlify, AWS S3 + CloudFront
- **Backend:** Heroku, AWS EC2, DigitalOcean
- **Database:** MongoDB Atlas, AWS DocumentDB
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
4. **Customize the AI model** with your own waste detection data
5. **Configure map tiles** for your specific region
6. **Set up user roles** and permissions
7. **Customize the UI** with your branding
8. **Deploy to production** environment

## 🎉 **System Status: READY!**

Your Waste Patrol system is now fully configured and ready to use:

- ✅ **MongoDB**: Installed and running
- ✅ **Backend**: Configured and ready
- ✅ **Python AI Service**: Dependencies installed
- ✅ **Frontend**: Updated with new features
- ✅ **Public Heatmap**: Accessible without login
- ✅ **All Issues**: Resolved and fixed

**Happy coding! 🚀**
