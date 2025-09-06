# 🗑️ Waste Patrol - Smart Waste Management System

A comprehensive waste management platform that combines AI-powered waste detection with citizen reporting and authority management tools.

![Waste Patrol Logo](public/logo.png)

## 🌟 Key Features

- **🤖 AI-Powered Detection**: Automatic waste detection, classification, and volume estimation using YOLO v8
- **📱 Smart Reporting**: Citizens upload images with automatic compression and AI analysis
- **🗺️ Public Heatmap**: Real-time visualization accessible without login
- **👥 Multi-Role System**: Citizens, Authorities, and Admins with different access levels
- **📊 Interactive Dashboards**: Comprehensive analytics and management tools
- **💬 Comments System**: Users can add comments and updates to reports
- **🔒 Secure & Scalable**: JWT authentication, rate limiting, and PostgreSQL database

## 🏗️ Architecture

### Frontend (React 18)
- Modern React with Material-UI components
- Interactive maps with Leaflet/React-Leaflet
- Real-time dashboards and analytics
- Responsive design for all devices

### Backend (Node.js/Express)
- RESTful API with JWT authentication
- PostgreSQL database with Sequelize ORM
- File upload handling with Multer
- Role-based access control

### AI Service (Python/Flask)
- YOLO v8 model for waste detection
- Image processing with OpenCV
- Volume estimation algorithms
- Real-time inference API

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ and npm
- **Python** 3.8+
- **PostgreSQL** 12+ (install from [postgresql.org](https://www.postgresql.org/download/))
- **Git**

### 🎯 One-Command Start

#### Windows
```bash
# Double-click start.bat or run:
start.bat
```

#### macOS/Linux
```bash
# Make script executable and run:
chmod +x start.sh
./start.sh
```

### 📋 Manual Setup

**1. Install Dependencies**
```bash
# Frontend
npm install

# Backend
cd backend && npm install && cd ..

# Python AI Service
cd python_service && pip install -r requirements.txt && cd ..
```

**2. Setup PostgreSQL Database**

**Option A: Automated Setup (Recommended)**
```bash
# Run the automated database setup script
npm run setup-db
```

**Option B: Manual Setup**
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database and set password
CREATE DATABASE waste_patrol;
ALTER USER postgres PASSWORD 'waste_patrol';
\q
```

**3. Configure Environment**
```bash
cd backend
cp env.example .env
# Database is already configured with password: waste_patrol
```

**4. Start All Services**
```bash
# Terminal 1 - Backend (port 5000)
cd backend && npm start

# Terminal 2 - Python AI (port 8000)  
cd python_service && python app.py

# Terminal 3 - Frontend (port 3000)
npm start
```

**5. Access the Application**
- **Frontend**: http://localhost:3000
- **Public Heatmap**: http://localhost:3000/heatmap (no login required!)
- **Backend API**: http://localhost:5000

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

### macOS Manual Setup
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..
cd python_service && pip3 install -r requirements.txt && cd ..

# Setup environment
cd backend
cp env.example .env
cd ..

# Start services (in separate terminals)
cd backend && npm start &
cd python_service && python3 app.py &
npm start
```

## 🆕 Latest Features

### 💬 Comments System
- **Real-time Comments**: Users can add comments to reports
- **User Information**: Comments display user names and timestamps
- **Role-based Access**: Citizens can comment on their own reports, authorities on any report

### 🗑️ Report Management
- **Delete Functionality**: Citizens can delete their own pending reports
- **Status Tracking**: Real-time status updates and progress tracking
- **Priority System**: Automatic priority assignment based on waste volume

### 🗺️ Public Heatmap
- **No Login Required**: Anyone can view waste distribution
- **Real-time Updates**: Live data refresh every 30 seconds
- **Interactive Map**: Click markers for detailed information
- **Priority-based Colors**: Visual representation of waste severity

### 📱 Enhanced Reporting
- **Automatic Image Compression**: Large images compressed to ≤10MB
- **Smart Map Integration**: Clean CartoDB map styling
- **Progress Tracking**: Real-time upload and processing feedback
- **AI Analysis**: YOLO-powered waste detection and volume estimation

## 📁 Project Structure

```
waste-patrol/
├── backend/                 # Node.js/Express API
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middleware/         # Auth & validation
│   ├── scripts/            # Database scripts
│   └── server.js           # Main server file
├── python_service/         # Python AI service
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── uploads/            # Uploaded images
│   └── processed/          # Processed images
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   └── App.js              # Main app component
├── public/                 # Static assets
├── train5_11.pt           # YOLO model file
├── start.bat              # Windows start script
├── start.sh               # macOS/Linux start script
└── README.md
```

## 🗄️ Database Setup

### Automated Database Setup
The easiest way to set up your database is using the automated script:

```bash
# From the project root directory
npm run setup-db
```

This script will:
- ✅ Test PostgreSQL connection
- ✅ Create the `waste_patrol` database
- ✅ Create all necessary tables using Sequelize models
- ✅ Enable UUID extension for primary keys
- ✅ Run database cleanup to remove unnecessary columns
- ✅ Set up proper permissions

### Manual Database Setup
If you prefer to set up the database manually:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE waste_patrol;
ALTER USER postgres PASSWORD 'waste_patrol';
\q
```

### Database Scripts Available
- `npm run setup-db` - Complete database setup (recommended)
- `cd backend && npm run setup-db` - Backend-specific setup
- `cd backend && npm run cleanup-db` - Remove unnecessary columns

## 🔧 Configuration

### Backend Environment Variables (.env)
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

### Frontend Configuration
The frontend automatically connects to the backend at `http://localhost:5000` via the proxy setting in `package.json`.

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Reports
- `POST /api/reports` - Create waste report
- `GET /api/reports` - Get reports (with filters)
- `GET /api/reports/:id` - Get single report
- `POST /api/reports/:id/comments` - Add comment to report
- `PUT /api/reports/:id/assign` - Assign report to authority
- `PUT /api/reports/:id/status` - Update report status
- `PUT /api/reports/:id/resolve` - Mark report as resolved
- `DELETE /api/reports/:id` - Delete report (citizens only, pending reports)

### Public
- `GET /api/reports/public` - Get public reports for heatmap

## 🎯 User Roles

### Citizens
- Upload waste images with location
- View their submitted reports
- Add comments to their reports
- Delete their own pending reports
- Track resolution status
- Access basic statistics

### Authorities
- View all waste reports in their area
- Add comments to any report
- Assign reports to team members
- Mark reports as resolved
- Access comprehensive dashboard
- View heatmaps and analytics

### Admins
- Full system access
- User management
- System configuration
- Advanced analytics

## 🤖 AI Model Integration

The system uses a custom-trained YOLO v8 model (`train5_11.pt`) for waste detection. The model can identify:

- Plastic bottles and bags
- Food waste
- Paper and cardboard
- Glass containers
- Metal cans
- Electronic waste
- Hazardous materials

### Volume Estimation
The system estimates waste volume using:
1. Bounding box area calculation
2. Depth estimation algorithms
3. Real-world scale conversion
4. Multiple object aggregation

## 🗺️ Heatmap Features

- Real-time waste distribution visualization
- Volume-based intensity mapping
- Priority-based color coding
- Interactive filtering options
- Geographical clustering
- Historical trend analysis

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting
- Secure file upload
- CORS protection
- Helmet.js security headers

## 🚀 Deployment

### Production Environment
1. Set up PostgreSQL database (local or cloud)
2. Deploy backend to cloud service (AWS, Heroku, etc.)
3. Deploy Python service with GPU support for faster inference
4. Build and deploy React frontend to CDN
5. Configure environment variables
6. Set up monitoring and logging

### Environment Variables for Production
```env
NODE_ENV=production
DB_HOST=your-production-db-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-super-secure-jwt-secret
```

## 🐛 Troubleshooting

### Common Issues

**1. PostgreSQL Connection Error**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql     # Linux
Get-Service | Where-Object {$_.Name -like "*postgresql*"}  # Windows
```

**2. Port Already in Use**
```bash
# Find and kill process on port
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows
```

**3. Python Dependencies Error**
```bash
cd python_service
pip3 install -r requirements.txt
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## 🙏 Acknowledgments

- YOLO v8 by Ultralytics
- OpenStreetMap for mapping data
- Material-UI for React components
- PostgreSQL for database services
- All contributors and testers

---

**Waste Patrol** - Making cities cleaner with smart technology! 🌍♻️