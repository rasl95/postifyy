"""
Backend tests for Auth endpoints and UI Polish verification
Testing iteration 17 - UI/UX Polish changes
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://history-display-bug.preview.emergentagent.com').rstrip('/')

class TestAuthEndpoints:
    """Test authentication endpoints - register returns 201, login returns 200"""
    
    def test_register_returns_201_status_code(self):
        """Verify that /api/auth/register returns 201 for successful registration"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@uitest.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "testpassword123",
                "full_name": "UI Test User"
            }
        )
        
        # CRITICAL: Register must return 201 (fixed from 200)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        
        # Verify response structure
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["subscription_plan"] == "free"
        print(f"✓ Register returns 201 with proper user data")
    
    def test_register_duplicate_email_returns_400(self):
        """Verify that registering with duplicate email returns 400"""
        # First registration
        unique_email = f"dup_{uuid.uuid4().hex[:8]}@uitest.com"
        requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "testpassword123",
                "full_name": "First User"
            }
        )
        
        # Second registration with same email
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "testpassword123",
                "full_name": "Second User"
            }
        )
        
        assert response.status_code == 400
        assert "already registered" in response.json().get("detail", "").lower()
        print(f"✓ Duplicate email registration returns 400")
    
    def test_login_returns_200_with_token(self):
        """Verify that /api/auth/login returns 200 with valid token"""
        # Create a user first
        unique_email = f"login_{uuid.uuid4().hex[:8]}@uitest.com"
        requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "testpassword123",
                "full_name": "Login Test User"
            }
        )
        
        # Now login
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": unique_email,
                "password": "testpassword123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert len(data["access_token"]) > 0
        print(f"✓ Login returns 200 with valid token")
    
    def test_login_invalid_credentials_returns_401(self):
        """Verify that login with wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        print(f"✓ Invalid login returns 401")


class TestAuthenticatedEndpoints:
    """Test endpoints that require authentication"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for tests"""
        unique_email = f"auth_{uuid.uuid4().hex[:8]}@uitest.com"
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "testpassword123",
                "full_name": "Auth Test User"
            }
        )
        if reg_response.status_code == 201:
            return reg_response.json()["access_token"]
        
        # Try login if registration fails (user might exist)
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": unique_email,
                "password": "testpassword123"
            }
        )
        if login_response.status_code == 200:
            return login_response.json()["access_token"]
        
        pytest.skip("Could not authenticate")
    
    def test_dashboard_analytics_endpoint(self, auth_token):
        """Test /api/analytics/dashboard endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboard",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "overview" in data
        print(f"✓ Analytics dashboard endpoint works")
    
    def test_history_endpoint(self, auth_token):
        """Test /api/history endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/history?limit=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print(f"✓ History endpoint works")
    
    def test_campaigns_config_endpoint(self, auth_token):
        """Test /api/campaigns/config endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/campaigns/config",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "business_types" in data or "goals" in data
        print(f"✓ Campaigns config endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
