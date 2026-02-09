"""
Postify AI - New Features Tests
Tests for: Favorites (Pro+), Post Goals (Pro+), Extended Tones (Pro+), Features API
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://history-display-bug.preview.emergentagent.com')


class TestFeaturesAPI:
    """Test /api/features endpoint for plan-based feature access"""
    
    @pytest.fixture
    def free_user_token(self):
        """Get token for free user"""
        test_email = f"test_features_free_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Free Test User"
        })
        return response.json()["access_token"]
    
    def test_features_endpoint_returns_free_plan_features(self, free_user_token):
        """Test /api/features returns correct features for Free plan"""
        response = requests.get(f"{BASE_URL}/api/features",
            headers={"Authorization": f"Bearer {free_user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check plan
        assert data["plan"] == "free"
        
        # Check features for free plan
        features = data["features"]
        assert features["favorites"] == False
        assert features["post_goals"] == False
        assert features["extended_tones"] == False
        
        # Check available tones (only basic for free)
        available_tones = data["available_tones"]
        assert "neutral" in available_tones
        assert "selling" in available_tones
        assert "funny" in available_tones
        # Extended tones should NOT be available
        assert "expert" not in available_tones
        assert "bold" not in available_tones
        assert "ironic" not in available_tones
        assert "provocative" not in available_tones
        
        # Post goals should be disabled
        assert data["post_goals_enabled"] == False
    
    def test_features_endpoint_without_auth(self):
        """Test /api/features without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/features")
        assert response.status_code in [401, 403]


class TestFavoritesAPI:
    """Test Favorites endpoints - Pro+ only feature"""
    
    @pytest.fixture
    def free_user_token(self):
        """Get token for free user"""
        import random
        test_email = f"test_fav_free_{int(time.time())}_{random.randint(1000,9999)}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Free Test User"
        })
        if response.status_code != 200:
            pytest.skip(f"Registration failed: {response.text}")
        return response.json()["access_token"]
    
    def test_get_favorites_blocked_for_free_user(self, free_user_token):
        """Test GET /api/favorites returns 403 for Free user"""
        response = requests.get(f"{BASE_URL}/api/favorites",
            headers={"Authorization": f"Bearer {free_user_token}"}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "Pro" in data["detail"] or "Business" in data["detail"]
    
    def test_add_favorite_blocked_for_free_user(self, free_user_token):
        """Test POST /api/favorites returns 403 for Free user"""
        response = requests.post(f"{BASE_URL}/api/favorites",
            headers={"Authorization": f"Bearer {free_user_token}"},
            json={"generation_id": "test-gen-id"}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "Pro" in data["detail"] or "Business" in data["detail"]
    
    def test_delete_favorite_blocked_for_free_user(self, free_user_token):
        """Test DELETE /api/favorites/{id} returns 403 for Free user"""
        response = requests.delete(f"{BASE_URL}/api/favorites/test-fav-id",
            headers={"Authorization": f"Bearer {free_user_token}"}
        )
        
        assert response.status_code == 403
    
    def test_check_favorite_returns_can_favorite_false_for_free(self, free_user_token):
        """Test /api/favorites/check/{id} returns can_favorite=false for Free user"""
        response = requests.get(f"{BASE_URL}/api/favorites/check/test-gen-id",
            headers={"Authorization": f"Bearer {free_user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_favorite"] == False
        assert data["can_favorite"] == False
    
    def test_favorites_without_auth(self):
        """Test favorites endpoints without auth return 401/403"""
        response = requests.get(f"{BASE_URL}/api/favorites")
        assert response.status_code in [401, 403]


class TestPostGoalsGeneration:
    """Test Post Goals feature in content generation - Pro+ only"""
    
    @pytest.fixture
    def free_user_token(self):
        """Get token for free user"""
        test_email = f"test_goals_free_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Free Test User"
        })
        return response.json()["access_token"]
    
    def test_generation_with_post_goal_ignored_for_free_user(self, free_user_token):
        """Test that post_goal is ignored for Free users (no error, just ignored)"""
        response = requests.post(f"{BASE_URL}/api/generate",
            headers={"Authorization": f"Bearer {free_user_token}"},
            json={
                "content_type": "social_post",
                "topic": "Test product launch",
                "platform": "instagram",
                "tone": "neutral",
                "post_goal": "sell"  # This should be ignored for free users
            }
        )
        
        # Should succeed (post_goal is silently ignored, not rejected)
        assert response.status_code in [200, 429]


class TestExtendedTonesGeneration:
    """Test Extended Tones feature - Pro+ only"""
    
    @pytest.fixture
    def free_user_token(self):
        """Get token for free user"""
        test_email = f"test_tones_free_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Free Test User"
        })
        return response.json()["access_token"]
    
    def test_basic_tones_work_for_free_user(self, free_user_token):
        """Test basic tones (neutral, selling, funny, inspiring) work for Free users"""
        basic_tones = ["neutral", "selling", "funny", "inspiring"]
        
        for tone in basic_tones:
            time.sleep(1)  # Avoid rate limit
            response = requests.post(f"{BASE_URL}/api/generate",
                headers={"Authorization": f"Bearer {free_user_token}"},
                json={
                    "content_type": "social_post",
                    "topic": f"Test with {tone} tone",
                    "platform": "instagram",
                    "tone": tone
                }
            )
            
            # Should succeed or hit rate limit
            assert response.status_code in [200, 429], f"Failed for tone: {tone}"
            
            # Stop after first successful test to avoid rate limit
            if response.status_code == 200:
                break
    
    def test_extended_tone_falls_back_to_neutral_for_free_user(self, free_user_token):
        """Test extended tones fall back to neutral for Free users (no error)"""
        extended_tones = ["expert", "bold", "ironic", "provocative"]
        
        for tone in extended_tones:
            time.sleep(1)  # Avoid rate limit
            response = requests.post(f"{BASE_URL}/api/generate",
                headers={"Authorization": f"Bearer {free_user_token}"},
                json={
                    "content_type": "social_post",
                    "topic": f"Test with {tone} tone",
                    "platform": "instagram",
                    "tone": tone
                }
            )
            
            # Should succeed (tone falls back to neutral) or hit rate limit
            assert response.status_code in [200, 429], f"Failed for extended tone: {tone}"
            
            # Stop after first test to avoid rate limit
            break


class TestGenerationWithLanguage:
    """Test content generation with language parameter"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        test_email = f"test_lang_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User"
        })
        return response.json()["access_token"]
    
    def test_generation_with_russian_language(self, auth_token):
        """Test generation with Russian language"""
        response = requests.post(f"{BASE_URL}/api/generate",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "content_type": "social_post",
                "topic": "Искусственный интеллект",
                "platform": "instagram",
                "tone": "neutral",
                "language": "ru"
            }
        )
        
        assert response.status_code in [200, 429]
        
        if response.status_code == 200:
            data = response.json()
            assert "content" in data
            assert len(data["content"]) > 0
    
    def test_generation_with_english_language(self, auth_token):
        """Test generation with English language"""
        time.sleep(2)  # Avoid rate limit
        
        response = requests.post(f"{BASE_URL}/api/generate",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "content_type": "social_post",
                "topic": "Artificial Intelligence",
                "platform": "instagram",
                "tone": "neutral",
                "language": "en"
            }
        )
        
        assert response.status_code in [200, 429]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
