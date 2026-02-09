"""
Test suite for Share Campaign Feature
Tests toggle_campaign_sharing and get_public_campaign endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://history-display-bug.preview.emergentagent.com')

# Test credentials - Pro user with existing campaign
TEST_EMAIL = "sharetest@test.com"
TEST_PASSWORD = "password"


class TestShareCampaignFeature:
    """Tests for Share Campaign functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def campaign_id(self, auth_token):
        """Get existing campaign ID for the test user"""
        response = requests.get(
            f"{BASE_URL}/api/campaigns",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed to get campaigns: {response.text}"
        campaigns = response.json()["campaigns"]
        assert len(campaigns) > 0, "No campaigns found for test user"
        return campaigns[0]["id"]
    
    def test_1_login_successful(self):
        """Test that test user can login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["subscription_plan"] == "pro"
    
    def test_2_enable_sharing_returns_share_token(self, auth_token, campaign_id):
        """POST /api/campaigns/{id}/share enables sharing and returns share_token"""
        # First, ensure sharing is disabled by toggling twice if needed
        response = requests.post(
            f"{BASE_URL}/api/campaigns/{campaign_id}/share",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # If sharing was already enabled, toggle again to enable it
        if not data["shared"]:
            response = requests.post(
                f"{BASE_URL}/api/campaigns/{campaign_id}/share",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            data = response.json()
        
        assert data["shared"] == True
        assert "share_token" in data
        assert data["share_token"] is not None
        assert len(data["share_token"]) > 5  # Token should be reasonable length
    
    def test_3_get_public_campaign_without_auth(self, auth_token, campaign_id):
        """GET /api/campaigns/public/{share_token} returns campaign data without auth"""
        # First ensure sharing is enabled
        share_response = requests.post(
            f"{BASE_URL}/api/campaigns/{campaign_id}/share",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if not share_response.json()["shared"]:
            share_response = requests.post(
                f"{BASE_URL}/api/campaigns/{campaign_id}/share",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
        share_token = share_response.json()["share_token"]
        
        # Get public campaign WITHOUT auth header
        response = requests.get(f"{BASE_URL}/api/campaigns/public/{share_token}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify campaign data is returned
        assert "campaign" in data
        campaign = data["campaign"]
        assert "name" in campaign
        assert "duration_days" in campaign
        assert "platforms" in campaign
        assert "total_posts" in campaign
        assert "content_mix" in campaign
    
    def test_4_public_campaign_excludes_user_email(self, auth_token, campaign_id):
        """GET /api/campaigns/public/{share_token} excludes user_email for privacy"""
        # Get share token
        share_response = requests.post(
            f"{BASE_URL}/api/campaigns/{campaign_id}/share",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if not share_response.json()["shared"]:
            share_response = requests.post(
                f"{BASE_URL}/api/campaigns/{campaign_id}/share",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
        share_token = share_response.json()["share_token"]
        
        # Get public campaign
        response = requests.get(f"{BASE_URL}/api/campaigns/public/{share_token}")
        assert response.status_code == 200
        campaign = response.json()["campaign"]
        
        # CRITICAL: user_email must NOT be in response
        assert "user_email" not in campaign, "user_email should be excluded from public response"
    
    def test_5_invalid_token_returns_404(self):
        """GET /api/campaigns/public/{invalid_token} returns 404"""
        response = requests.get(f"{BASE_URL}/api/campaigns/public/invalid_token_xyz123")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_6_disable_sharing(self, auth_token, campaign_id):
        """POST /api/campaigns/{id}/share toggles off sharing"""
        # First enable sharing
        response = requests.post(
            f"{BASE_URL}/api/campaigns/{campaign_id}/share",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if not response.json()["shared"]:
            response = requests.post(
                f"{BASE_URL}/api/campaigns/{campaign_id}/share",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
        share_token = response.json()["share_token"]
        
        # Now disable sharing
        disable_response = requests.post(
            f"{BASE_URL}/api/campaigns/{campaign_id}/share",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert disable_response.status_code == 200
        data = disable_response.json()
        assert data["shared"] == False
        assert data["share_token"] is None
    
    def test_7_public_returns_404_after_disable(self, auth_token, campaign_id):
        """After disabling sharing, public endpoint returns 404"""
        # First enable sharing to get a token
        response = requests.post(
            f"{BASE_URL}/api/campaigns/{campaign_id}/share",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if not response.json()["shared"]:
            response = requests.post(
                f"{BASE_URL}/api/campaigns/{campaign_id}/share",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
        share_token = response.json()["share_token"]
        
        # Verify it works
        public_response = requests.get(f"{BASE_URL}/api/campaigns/public/{share_token}")
        assert public_response.status_code == 200
        
        # Now disable sharing
        requests.post(
            f"{BASE_URL}/api/campaigns/{campaign_id}/share",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Public should now return 404
        public_response = requests.get(f"{BASE_URL}/api/campaigns/public/{share_token}")
        assert public_response.status_code == 404
    
    def test_8_unauthorized_user_cannot_toggle_share(self, campaign_id):
        """Non-owner cannot toggle sharing on another user's campaign"""
        # Try to share without auth
        response = requests.post(f"{BASE_URL}/api/campaigns/{campaign_id}/share")
        assert response.status_code in [401, 403, 422]  # Unauthorized
    
    def test_9_final_enable_sharing_for_frontend_test(self, auth_token, campaign_id):
        """Re-enable sharing for subsequent frontend tests"""
        # Toggle until sharing is enabled
        response = requests.post(
            f"{BASE_URL}/api/campaigns/{campaign_id}/share",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if not response.json()["shared"]:
            response = requests.post(
                f"{BASE_URL}/api/campaigns/{campaign_id}/share",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
        
        assert response.json()["shared"] == True
        print(f"Share token for frontend test: {response.json()['share_token']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
