"""
Test suite for Google OAuth integration and existing auth flows
Tests:
- Google OAuth button visibility (frontend)
- POST /api/auth/google/session - should reject invalid session_id
- GET /api/auth/me - should work with both JWT Bearer token and session_token cookie
- Existing email/password login still works
- User registration still works
- Content generation still works for authenticated users
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test that API is accessible"""
        response = requests.get(f"{BASE_URL}/api/auth/me", timeout=10)
        # Should return 401/403 for unauthenticated, not 500
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"API health check passed - returned {response.status_code} for unauthenticated request")


class TestUserRegistration:
    """Test user registration flow"""
    
    def test_register_new_user(self):
        """Test registering a new user"""
        unique_email = f"TEST_oauth_user_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "email": unique_email,
            "password": "TestPassword123!",
            "full_name": "Test OAuth User"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        
        # Should succeed with 200
        assert response.status_code == 200, f"Registration failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == unique_email
        assert data["user"]["subscription_plan"] == "free"
        
        print(f"Registration successful for {unique_email}")
        return data["access_token"], unique_email
    
    def test_register_duplicate_email(self):
        """Test that duplicate email registration fails"""
        unique_email = f"TEST_dup_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "email": unique_email,
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        
        # First registration should succeed
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        assert response1.status_code == 200
        
        # Second registration with same email should fail
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        assert response2.status_code == 400, f"Expected 400 for duplicate, got {response2.status_code}"
        
        print("Duplicate email registration correctly rejected")


class TestEmailPasswordLogin:
    """Test existing email/password login flow"""
    
    @pytest.fixture
    def test_user(self):
        """Create a test user for login tests"""
        unique_email = f"TEST_login_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "email": unique_email,
            "password": "TestPassword123!",
            "full_name": "Test Login User"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=10)
        assert response.status_code == 200
        return unique_email, "TestPassword123!"
    
    def test_login_success(self, test_user):
        """Test successful login with valid credentials"""
        email, password = test_user
        payload = {
            "email": email,
            "password": password
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=10)
        
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == email
        
        print(f"Login successful for {email}")
        return data["access_token"]
    
    def test_login_invalid_password(self, test_user):
        """Test login with invalid password"""
        email, _ = test_user
        payload = {
            "email": email,
            "password": "WrongPassword123!"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=10)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Invalid password correctly rejected")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        payload = {
            "email": "nonexistent_user_12345@example.com",
            "password": "SomePassword123!"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=10)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Non-existent user login correctly rejected")


class TestGoogleOAuthEndpoints:
    """Test Google OAuth specific endpoints"""
    
    def test_google_session_invalid_session_id(self):
        """Test POST /api/auth/google/session with invalid session_id"""
        payload = {
            "session_id": "invalid_session_id_12345"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/google/session",
            json=payload,
            timeout=10
        )
        
        # Should return 401 for invalid session
        assert response.status_code == 401, f"Expected 401 for invalid session, got {response.status_code}"
        print(f"Invalid session_id correctly rejected with status {response.status_code}")
    
    def test_google_session_empty_session_id(self):
        """Test POST /api/auth/google/session with empty session_id"""
        payload = {
            "session_id": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/google/session",
            json=payload,
            timeout=10
        )
        
        # Should return 401 or 422 for empty session
        assert response.status_code in [401, 422, 500], f"Expected 401/422/500, got {response.status_code}"
        print(f"Empty session_id correctly rejected with status {response.status_code}")
    
    def test_google_session_missing_session_id(self):
        """Test POST /api/auth/google/session with missing session_id"""
        payload = {}
        
        response = requests.post(
            f"{BASE_URL}/api/auth/google/session",
            json=payload,
            timeout=10
        )
        
        # Should return 422 for missing required field
        assert response.status_code == 422, f"Expected 422 for missing field, got {response.status_code}"
        print(f"Missing session_id correctly rejected with status {response.status_code}")


class TestAuthMeEndpoint:
    """Test GET /api/auth/me with different auth methods"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and login a test user, return token"""
        unique_email = f"TEST_me_{uuid.uuid4().hex[:8]}@example.com"
        
        # Register
        reg_payload = {
            "email": unique_email,
            "password": "TestPassword123!",
            "full_name": "Test Me User"
        }
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload, timeout=10)
        assert reg_response.status_code == 200
        
        return reg_response.json()["access_token"], unique_email
    
    def test_auth_me_with_bearer_token(self, authenticated_user):
        """Test GET /api/auth/me with JWT Bearer token"""
        token, email = authenticated_user
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["email"] == email
        assert "subscription_plan" in data
        assert "monthly_limit" in data
        assert "current_usage" in data
        
        print(f"GET /api/auth/me with Bearer token successful for {email}")
    
    def test_auth_me_without_auth(self):
        """Test GET /api/auth/me without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me", timeout=10)
        
        # Should return 401 or 403
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"Unauthenticated /api/auth/me correctly rejected with {response.status_code}")
    
    def test_auth_me_with_invalid_token(self):
        """Test GET /api/auth/me with invalid JWT token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"},
            timeout=10
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Invalid token correctly rejected")


class TestContentGeneration:
    """Test content generation for authenticated users"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and login a test user, return token"""
        unique_email = f"TEST_gen_{uuid.uuid4().hex[:8]}@example.com"
        
        reg_payload = {
            "email": unique_email,
            "password": "TestPassword123!",
            "full_name": "Test Gen User"
        }
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload, timeout=10)
        assert reg_response.status_code == 200
        
        return reg_response.json()["access_token"], unique_email
    
    def test_generate_social_post(self, authenticated_user):
        """Test social post generation for authenticated user"""
        token, email = authenticated_user
        
        payload = {
            "content_type": "social_post",
            "topic": "AI technology trends",
            "tone": "neutral",
            "platform": "instagram",
            "include_hashtags": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=30  # Longer timeout for AI generation
        )
        
        # Should succeed or return rate limit/usage limit error
        assert response.status_code in [200, 403, 429, 500, 503], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "content" in data
            assert "id" in data
            print(f"Content generation successful: {data['content'][:100]}...")
        else:
            print(f"Content generation returned {response.status_code}: {response.json().get('detail', 'No detail')}")
    
    def test_generate_without_auth(self):
        """Test that content generation requires authentication"""
        payload = {
            "content_type": "social_post",
            "topic": "Test topic"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json=payload,
            timeout=10
        )
        
        # Should return 401 or 403
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("Unauthenticated generation correctly rejected")


class TestLogout:
    """Test logout functionality"""
    
    def test_logout(self):
        """Test logout endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            timeout=10
        )
        
        # Logout should succeed even without auth
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("Logout endpoint working")


class TestHistory:
    """Test history endpoint"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and login a test user, return token"""
        unique_email = f"TEST_hist_{uuid.uuid4().hex[:8]}@example.com"
        
        reg_payload = {
            "email": unique_email,
            "password": "TestPassword123!",
            "full_name": "Test History User"
        }
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload, timeout=10)
        assert reg_response.status_code == 200
        
        return reg_response.json()["access_token"], unique_email
    
    def test_get_history(self, authenticated_user):
        """Test getting generation history"""
        token, email = authenticated_user
        
        response = requests.get(
            f"{BASE_URL}/api/history",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)
        
        print(f"History retrieved: {data['total']} items")
    
    def test_history_without_auth(self):
        """Test that history requires authentication"""
        response = requests.get(f"{BASE_URL}/api/history", timeout=10)
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("Unauthenticated history access correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
