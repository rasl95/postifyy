"""
Postify AI Backend API Tests
Tests for authentication, content generation, history, and export features
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://history-display-bug.preview.emergentagent.com')

class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_register_new_user(self):
        """Test user registration creates account successfully"""
        test_email = f"test_register_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == test_email
        assert data["user"]["subscription_plan"] == "free"
    
    def test_register_duplicate_email(self):
        """Test duplicate email registration is rejected"""
        test_email = f"test_dup_{int(time.time())}@test.com"
        
        # First registration
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User"
        })
        
        # Second registration with same email
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User 2"
        })
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_login_valid_credentials(self):
        """Test login with valid credentials"""
        test_email = f"test_login_{int(time.time())}@test.com"
        
        # Register first
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User"
        })
        
        # Login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "TestPass123!"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == test_email
    
    def test_login_invalid_password(self):
        """Test login with invalid password is rejected"""
        test_email = f"test_invalid_{int(time.time())}@test.com"
        
        # Register first
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User"
        })
        
        # Login with wrong password
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "WrongPassword!"
        })
        
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent user is rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "TestPass123!"
        })
        
        assert response.status_code == 401
    
    def test_get_me_with_token(self):
        """Test /auth/me returns user data with valid token"""
        test_email = f"test_me_{int(time.time())}@test.com"
        
        # Register
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User"
        })
        token = reg_response.json()["access_token"]
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_email
        assert data["subscription_plan"] == "free"
        assert data["monthly_limit"] == 3
        assert "current_usage" in data
    
    def test_get_me_without_token(self):
        """Test /auth/me without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]
    
    def test_get_me_invalid_token(self):
        """Test /auth/me with invalid token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": "Bearer invalid_token_here"
        })
        assert response.status_code == 401


class TestContentGeneration:
    """Content generation endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for tests"""
        test_email = f"test_gen_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User"
        })
        return response.json()["access_token"]
    
    def test_generate_social_post(self, auth_token):
        """Test social post generation"""
        response = requests.post(f"{BASE_URL}/api/generate", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "content_type": "social_post",
                "topic": "AI technology",
                "platform": "instagram",
                "tone": "neutral",
                "include_hashtags": True
            }
        )
        
        # May get 200 (success) or 429 (rate limit)
        assert response.status_code in [200, 429]
        
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert "content" in data
            assert "tokens_used" in data
            assert "remaining_usage" in data
            assert len(data["content"]) > 0
    
    def test_generate_video_idea(self, auth_token):
        """Test video idea generation"""
        # Wait to avoid rate limit
        time.sleep(2)
        
        response = requests.post(f"{BASE_URL}/api/generate",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "content_type": "video_idea",
                "topic": "Fitness tips",
                "niche": "Fitness",
                "goal": "views",
                "tone": "motivational"
            }
        )
        
        assert response.status_code in [200, 429]
        
        if response.status_code == 200:
            data = response.json()
            assert "content" in data
    
    def test_generate_product_description(self, auth_token):
        """Test product description generation"""
        # Wait to avoid rate limit
        time.sleep(2)
        
        response = requests.post(f"{BASE_URL}/api/generate",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "content_type": "product_description",
                "topic": "Smart Watch",
                "product_name": "Smart Watch Pro",
                "target_audience": "Tech enthusiasts",
                "key_benefits": "Health tracking, notifications",
                "tone": "selling"
            }
        )
        
        assert response.status_code in [200, 429]
    
    def test_generate_without_auth(self):
        """Test generation without authentication is rejected"""
        response = requests.post(f"{BASE_URL}/api/generate", json={
            "content_type": "social_post",
            "topic": "Test topic"
        })
        
        assert response.status_code in [401, 403]
    
    def test_generate_empty_topic(self, auth_token):
        """Test generation with empty topic"""
        response = requests.post(f"{BASE_URL}/api/generate",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "content_type": "social_post",
                "topic": ""
            }
        )
        
        # Should either fail validation or generate with empty topic
        # Depends on backend validation
        assert response.status_code in [200, 400, 422, 429]


class TestHistoryEndpoints:
    """History endpoint tests"""
    
    @pytest.fixture
    def auth_token_with_history(self):
        """Get auth token and create some history"""
        test_email = f"test_hist_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User"
        })
        token = response.json()["access_token"]
        
        # Generate some content
        requests.post(f"{BASE_URL}/api/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "content_type": "social_post",
                "topic": "Test topic for history"
            }
        )
        
        return token
    
    def test_get_history(self, auth_token_with_history):
        """Test getting history returns items"""
        response = requests.get(f"{BASE_URL}/api/history",
            headers={"Authorization": f"Bearer {auth_token_with_history}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)
    
    def test_get_history_without_auth(self):
        """Test getting history without auth is rejected"""
        response = requests.get(f"{BASE_URL}/api/history")
        assert response.status_code in [401, 403]


class TestExportEndpoints:
    """Export endpoint tests - CSV/PDF for Pro/Business only"""
    
    @pytest.fixture
    def free_user_token(self):
        """Get token for free user"""
        test_email = f"test_export_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User"
        })
        return response.json()["access_token"]
    
    def test_export_csv_free_user_blocked(self, free_user_token):
        """Test CSV export is blocked for free users"""
        response = requests.get(f"{BASE_URL}/api/history/export/csv",
            headers={"Authorization": f"Bearer {free_user_token}"}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "Pro" in data["detail"] or "Business" in data["detail"]
    
    def test_export_pdf_free_user_blocked(self, free_user_token):
        """Test PDF export is blocked for free users"""
        response = requests.get(f"{BASE_URL}/api/history/export/pdf",
            headers={"Authorization": f"Bearer {free_user_token}"}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "Pro" in data["detail"] or "Business" in data["detail"]
    
    def test_export_csv_without_auth(self):
        """Test CSV export without auth is rejected"""
        response = requests.get(f"{BASE_URL}/api/history/export/csv")
        assert response.status_code in [401, 403]
    
    def test_export_pdf_without_auth(self):
        """Test PDF export without auth is rejected"""
        response = requests.get(f"{BASE_URL}/api/history/export/pdf")
        assert response.status_code in [401, 403]


class TestGoogleOAuth:
    """Google OAuth endpoint tests"""
    
    def test_google_session_invalid_session_id(self):
        """Test Google OAuth with invalid session_id returns error"""
        response = requests.post(f"{BASE_URL}/api/auth/google/session", json={
            "session_id": "invalid_session_id"
        })
        
        assert response.status_code in [401, 500]
    
    def test_google_session_empty_session_id(self):
        """Test Google OAuth with empty session_id returns error"""
        response = requests.post(f"{BASE_URL}/api/auth/google/session", json={
            "session_id": ""
        })
        
        assert response.status_code in [401, 422, 500]
    
    def test_google_session_missing_session_id(self):
        """Test Google OAuth with missing session_id returns 422"""
        response = requests.post(f"{BASE_URL}/api/auth/google/session", json={})
        
        assert response.status_code == 422


class TestLogout:
    """Logout endpoint tests"""
    
    def test_logout(self):
        """Test logout endpoint works"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        
        # Should succeed even without auth
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
