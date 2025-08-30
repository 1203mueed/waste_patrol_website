#!/usr/bin/env python3
"""
Test script to check database connectivity and test dashboard functionality
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:5000/api"
TEST_USER_EMAIL = "authority@example.com"
TEST_USER_PASSWORD = "testpass123"

def test_health():
    """Test if the backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running. Please start the backend server first.")
        return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_auth():
    """Test authentication endpoints"""
    try:
        # Try to register a test authority user
        register_data = {
            "name": "Test Authority",
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "role": "authority"
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        print(f"📝 Registration: {response.status_code}")
        if response.status_code == 201:
            print("   Authority user registered successfully")
        elif response.status_code == 400:
            print("   User might already exist")
        else:
            print(f"   Response: {response.text}")
        
        # Try to login
        login_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"🔐 Login: {response.status_code}")
        if response.status_code == 200:
            token = response.json().get('token')
            print("   Login successful")
            return token
        else:
            print(f"   Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Auth test failed: {e}")
        return None

def test_reports(token):
    """Test reports endpoints"""
    if not token:
        print("❌ No token available for reports test")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Get reports
        response = requests.get(f"{BASE_URL}/reports", headers=headers)
        print(f"📊 Get reports: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            reports = data.get('reports', [])
            print(f"   Found {len(reports)} reports")
            if reports:
                print("   Sample report:")
                print(f"     ID: {reports[0].get('_id')}")
                print(f"     Status: {reports[0].get('status')}")
                print(f"     Priority: {reports[0].get('priority')}")
        else:
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Reports test failed: {e}")

def test_dashboard_with_auth(token):
    """Test dashboard endpoints with authentication"""
    if not token:
        print("❌ No token available for dashboard test")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers)
        print(f"📈 Dashboard stats (auth): {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("   Stats retrieved successfully")
            if data.get('success') and data.get('data', {}).get('overview'):
                overview = data['data']['overview']
                print(f"   Total reports: {overview.get('totalReports', 0)}")
                print(f"   Pending: {overview.get('pendingReports', 0)}")
                print(f"   In Progress: {overview.get('inProgressReports', 0)}")
                print(f"   Resolved: {overview.get('resolvedReports', 0)}")
            else:
                print(f"   Response: {data}")
        else:
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Dashboard test failed: {e}")

def main():
    """Main test function"""
    print("🧪 Testing Waste Patrol Backend")
    print("=" * 40)
    
    # Test 1: Health check
    if not test_health():
        return
    
    print()
    
    # Test 2: Authentication
    token = test_auth()
    
    print()
    
    # Test 3: Reports
    if token:
        test_reports(token)
    
    print()
    
    # Test 4: Dashboard (with auth)
    if token:
        test_dashboard_with_auth(token)
    
    print()
    print("🏁 Testing complete!")
    print("\n💡 Note: To see reports in the dashboard, you need to:")
    print("   1. Submit waste reports through the frontend")
    print("   2. Or create reports directly in the database")
    print("   3. The dashboard will then show the correct counts")

if __name__ == "__main__":
    main()
