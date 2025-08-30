#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}    Waste Patrol - Smart Waste Management${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""
echo -e "${GREEN}Starting all services...${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if ! command_exists node; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command_exists python3; then
    echo -e "${RED}ERROR: Python 3 is not installed${NC}"
    echo "Please install Python 3 from https://python.org/"
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo -e "${RED}ERROR: npm is not installed${NC}"
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✓ Python version: $(python3 --version)${NC}"
echo -e "${GREEN}✓ npm version: $(npm --version)${NC}"
echo ""

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p backend/uploads
mkdir -p python_service/uploads
mkdir -p python_service/processed

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cp backend/env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env from template${NC}"
    echo -e "${YELLOW}⚠ Please edit backend/.env with your configuration${NC}"
fi

echo ""
echo -e "${BLUE}Services will start in the background:${NC}"
echo -e "${GREEN}- Backend API: http://localhost:5000${NC}"
echo -e "${GREEN}- Python AI Service: http://localhost:8000${NC}"
echo -e "${GREEN}- Frontend: http://localhost:3000${NC}"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    jobs -p | xargs -r kill
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start Backend API
echo -e "${BLUE}Starting Backend API...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment
sleep 3

# Start Python AI Service
echo -e "${BLUE}Starting Python AI Service...${NC}"
cd python_service
python3 run.py &
PYTHON_PID=$!
cd ..

# Wait a moment
sleep 3

# Start Frontend
echo -e "${BLUE}Starting Frontend...${NC}"
npm start &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}✓ All services are running!${NC}"
echo ""
echo -e "${BLUE}Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "${BLUE}Backend API: ${GREEN}http://localhost:5000${NC}"
echo -e "${BLUE}Python AI Service: ${GREEN}http://localhost:8000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo -e "${GREEN}===============================================${NC}"

# Wait for all background processes
wait
