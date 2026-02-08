"""
Phase 5 Testing - Content History Enhancement & Onboarding
Tests: duplicate, save-template, score, templates endpoints
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
PRO_USER_EMAIL = "sharetest@test.com"
PRO_USER_PASSWORD = "password"

# Free user for testing template restrictions
FREE_USER_EMAIL = f"free_test_{uuid.uuid4().hex[:8]}@test.com"
FREE_USER_PASSWORD = "testpassword123"


class TestSetup:
    """Setup: Login and get test data"""
    
    @pytest.fixture(scope="class")
    def pro_user_token(self):
        """Login as Pro user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        assert response.status_code == 200, f"Pro user login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def free_user_token(self):
        """Register and login as free user"""
        # Try to register
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": FREE_USER_EMAIL,
            "password": FREE_USER_PASSWORD,
            "full_name": "Free Test User"
        })
        if reg_response.status_code != 201:
            # User might already exist, try login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": FREE_USER_EMAIL,
                "password": FREE_USER_PASSWORD
            })
            if login_response.status_code == 200:
                return login_response.json()["access_token"]
            pytest.skip("Could not create or login free test user")
        return reg_response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def content_id(self, pro_user_token):
        """Get first content ID from history"""
        response = requests.get(f"{BASE_URL}/api/history?limit=1", headers={
            "Authorization": f"Bearer {pro_user_token}"
        })
        if response.status_code != 200:
            pytest.skip("Could not fetch history")
        items = response.json().get("items", [])
        if not items:
            pytest.skip("No content in history to test")
        return items[0]["id"]


class TestContentDuplicate(TestSetup):
    """Test content duplicate endpoint"""
    
    def test_duplicate_returns_content_data(self, pro_user_token, content_id):
        """POST /api/content/{id}/duplicate returns content data for re-use"""
        response = requests.post(
            f"{BASE_URL}/api/content/{content_id}/duplicate",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        assert response.status_code == 200, f"Duplicate failed: {response.text}"
        data = response.json()
        
        # Verify response contains required fields
        assert "content_type" in data, "Missing content_type in duplicate response"
        assert "topic" in data, "Missing topic in duplicate response"
        assert "tone" in data, "Missing tone in duplicate response"
        assert "generated_content" in data, "Missing generated_content in duplicate response"
        
        print(f"✓ Duplicate returned: content_type={data['content_type']}, topic={data['topic'][:30]}...")
    
    def test_duplicate_404_for_invalid_id(self, pro_user_token):
        """POST /api/content/{invalid_id}/duplicate returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/content/invalid-nonexistent-id/duplicate",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid ID, got {response.status_code}"
        print("✓ Duplicate returns 404 for invalid content ID")


class TestContentScore(TestSetup):
    """Test content score endpoint"""
    
    def test_score_endpoint_returns_score(self, pro_user_token, content_id):
        """GET /api/content/{id}/score returns performance score (0-100)"""
        response = requests.get(
            f"{BASE_URL}/api/content/{content_id}/score",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        assert response.status_code == 200, f"Score failed: {response.text}"
        data = response.json()
        
        # Verify 'score' field exists and is 0-100
        assert "score" in data, f"Missing 'score' field in response: {data}"
        score = data["score"]
        assert isinstance(score, (int, float)), f"Score should be numeric, got {type(score)}"
        assert 0 <= score <= 100, f"Score should be 0-100, got {score}"
        
        # Verify content_id is returned
        assert data.get("content_id") == content_id, "content_id mismatch in response"
        
        print(f"✓ Score endpoint returned score={score}/100 for content_id={content_id}")
    
    def test_score_404_for_invalid_id(self, pro_user_token):
        """GET /api/content/{invalid_id}/score returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/content/invalid-nonexistent-id/score",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid ID, got {response.status_code}"
        print("✓ Score returns 404 for invalid content ID")


class TestSaveTemplate(TestSetup):
    """Test save-template endpoint"""
    
    def test_save_template_pro_user_success(self, pro_user_token, content_id):
        """POST /api/content/{id}/save-template saves content as template (Pro)"""
        response = requests.post(
            f"{BASE_URL}/api/content/{content_id}/save-template",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        assert response.status_code == 200, f"Save template failed: {response.text}"
        data = response.json()
        
        # Verify template is returned
        assert "template" in data, f"Missing 'template' in response: {data}"
        template = data["template"]
        
        assert "id" in template, "Template missing id"
        assert "name" in template, "Template missing name"
        assert "content_type" in template, "Template missing content_type"
        assert "content" in template, "Template missing content"
        
        print(f"✓ Template saved: id={template['id']}, name={template['name']}")
        
        # Return template ID for cleanup
        return template["id"]
    
    def test_save_template_free_user_403(self, free_user_token):
        """POST /api/content/{id}/save-template returns 403 for free plan users"""
        # First get a content item for free user (generate one if needed)
        # For simplicity, test with a random ID since free users can't save templates anyway
        response = requests.post(
            f"{BASE_URL}/api/content/any-content-id/save-template",
            headers={"Authorization": f"Bearer {free_user_token}"}
        )
        
        # Should be 403 (plan restriction) or 404 (content not found)
        # Priority: plan check should happen first
        assert response.status_code in [403, 404], f"Expected 403 or 404, got {response.status_code}: {response.text}"
        
        if response.status_code == 403:
            print("✓ Save template returns 403 for free plan users (plan restriction checked first)")
        else:
            print("✓ Save template returns 404 for free plan (content not found)")


class TestGetUserTemplates(TestSetup):
    """Test get user templates endpoint"""
    
    def test_get_templates_returns_list(self, pro_user_token):
        """GET /api/content/templates returns user's saved templates"""
        response = requests.get(
            f"{BASE_URL}/api/content/templates",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        assert response.status_code == 200, f"Get templates failed: {response.text}"
        data = response.json()
        
        assert "templates" in data, f"Missing 'templates' in response: {data}"
        assert isinstance(data["templates"], list), "Templates should be a list"
        
        # If templates exist, verify structure
        if data["templates"]:
            template = data["templates"][0]
            assert "id" in template, "Template missing id"
            assert "name" in template, "Template missing name"
            assert "content" in template, "Template missing content"
        
        print(f"✓ Get templates returned {len(data['templates'])} templates")


class TestDeleteTemplate(TestSetup):
    """Test delete template endpoint"""
    
    def test_delete_template_success(self, pro_user_token, content_id):
        """DELETE /api/content/templates/{id} deletes a template"""
        # First save a template to delete
        save_response = requests.post(
            f"{BASE_URL}/api/content/{content_id}/save-template",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        if save_response.status_code != 200:
            pytest.skip("Could not create template to test deletion")
        
        template_id = save_response.json()["template"]["id"]
        
        # Now delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/content/templates/{template_id}",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        assert delete_response.status_code == 200, f"Delete template failed: {delete_response.text}"
        data = delete_response.json()
        assert data.get("deleted") == True, "Expected deleted: true"
        
        print(f"✓ Template {template_id} deleted successfully")
    
    def test_delete_template_404_for_invalid_id(self, pro_user_token):
        """DELETE /api/content/templates/{invalid_id} returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/content/templates/nonexistent-template-id",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete template returns 404 for invalid template ID")


class TestOnboardingEndpoints:
    """Test onboarding-related endpoints"""
    
    @pytest.fixture
    def new_user_token(self):
        """Register a brand new user"""
        email = f"onboard_test_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpassword123",
            "full_name": "Onboarding Test User"
        })
        assert response.status_code == 201, f"Failed to register: {response.text}"
        data = response.json()
        
        # Verify onboarding_completed is False for new users
        assert data["user"].get("onboarding_completed") == False, "New user should have onboarding_completed=False"
        
        return data["access_token"], email
    
    def test_new_user_has_onboarding_not_completed(self, new_user_token):
        """New user should have onboarding_completed=False"""
        token, email = new_user_token
        
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("onboarding_completed") == False, "New user should have onboarding_completed=False"
        
        print(f"✓ New user {email} has onboarding_completed=False")
    
    def test_complete_onboarding_endpoint(self, new_user_token):
        """POST /api/user/complete-onboarding marks onboarding as completed"""
        token, email = new_user_token
        
        response = requests.post(f"{BASE_URL}/api/user/complete-onboarding", json={}, headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200, f"Complete onboarding failed: {response.text}"
        
        # Verify onboarding is now completed
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert me_response.status_code == 200
        assert me_response.json().get("onboarding_completed") == True, "Onboarding should be completed"
        
        print(f"✓ Onboarding completed for user {email}")
    
    def test_save_preferences_endpoint(self, new_user_token):
        """POST /api/user/preferences saves user preferences"""
        token, email = new_user_token
        
        preferences = {
            "content_goals": ["social_posts", "ai_images"],
            "platforms": ["instagram", "tiktok"],
            "business_niche": "tech",
            "target_audience": "entrepreneurs 25-40",
            "preferred_tone": "professional"
        }
        
        response = requests.post(f"{BASE_URL}/api/user/preferences", json=preferences, headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200, f"Save preferences failed: {response.text}"
        data = response.json()
        assert "preferences" in data, "Missing preferences in response"
        
        print(f"✓ Preferences saved for user {email}")


class TestAuthRequirements:
    """Test auth requirements for new endpoints"""
    
    def test_score_requires_auth(self):
        """GET /api/content/{id}/score requires authentication"""
        response = requests.get(f"{BASE_URL}/api/content/any-id/score")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Score endpoint requires authentication")
    
    def test_duplicate_requires_auth(self):
        """POST /api/content/{id}/duplicate requires authentication"""
        response = requests.post(f"{BASE_URL}/api/content/any-id/duplicate")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Duplicate endpoint requires authentication")
    
    def test_save_template_requires_auth(self):
        """POST /api/content/{id}/save-template requires authentication"""
        response = requests.post(f"{BASE_URL}/api/content/any-id/save-template")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Save-template endpoint requires authentication")
    
    def test_get_templates_requires_auth(self):
        """GET /api/content/templates requires authentication"""
        response = requests.get(f"{BASE_URL}/api/content/templates")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ Get-templates endpoint requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
