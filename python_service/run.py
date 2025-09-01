#!/usr/bin/env python3
"""
Waste Patrol Python Service Runner
This script sets up and runs the Flask service for YOLO-based waste detection.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_model_file():
    """Check if the YOLO model file exists"""
    model_path = Path("../train5_11.pt")
    if not model_path.exists():
        print("❌ YOLO model file 'train5_11.pt' not found!")
        print("📁 Please ensure the model file is in the parent directory")
        print("🔗 Model path expected: ../train5_11.pt")
        return False
    
    print(f"✅ YOLO model found: {model_path.absolute()}")
    return True

def install_requirements():
    """Install Python requirements"""
    try:
        print("📦 Installing Python requirements...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False

def main():
    """Main function to run the service"""
    print("🚀 Waste Patrol Python Service Setup")
    print("=" * 50)
    
    # Check if model exists
    if not check_model_file():
        sys.exit(1)
    
    # Install requirements
    if not install_requirements():
        sys.exit(1)
    
    # Create necessary directories
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("processed", exist_ok=True)
    print("📁 Created upload and processed directories")
    
    print("\n🎯 Starting Flask service...")
    print("🌐 Service will be available at: http://localhost:8000")
    print("📋 Health check: http://localhost:8000/health")
    print("🔧 Model info: http://localhost:8000/model-info")
    print("📸 Process waste: http://localhost:8000/process-waste")
    print("🗺️ Locations: http://localhost:8000/locations")
    print("\n" + "=" * 50)
    
    # Import and run the Flask app
    from app import app
    # Disable debug mode and auto-reload to prevent interruptions during YOLO processing
    app.run(host='0.0.0.0', port=8000, debug=False, use_reloader=False)

if __name__ == "__main__":
    main()
