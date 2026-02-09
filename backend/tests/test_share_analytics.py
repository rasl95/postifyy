"""
Test suite for Share Campaign Mini-Analytics Feature
Tests:
- GET /api/campaigns/public/{share_token} increments share_views counter
- GET /api/campaigns/public/{share_token} logs event to share_events collection
- GET /api/campaigns/{id}/share-stats returns total_views and 7-day daily_views array
- GET /api/campaigns/{id}/share-stats returns shared:false when sharing is disabled
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://history-display-bug.preview.emergentagent.com')

# Test credentials - Pro user with existing campaign that has share enabled
TEST_EMAIL = "sharetest@test.com"
TEST_PASSWORD = "password"
CAMPAIGN_ID = "e9be3f02-736f-43cb-bc1f-94b0547d13bb"
SHARE_TOKEN = "b07f3bed-8a4"


class TestShareAnalytics:
    """Tests for Mini-Analytics on Shared Campaigns"""
    
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
    def headers(self, auth_token):
        """Auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}

    def test_01_share_stats_returns_correct_structure(self, headers):
        """GET /api/campaigns/{id}/share-stats returns correct response structure"""
        response = requests.get(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share-stats",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate structure
        assert "shared" in data
        assert "total_views" in data
        assert "daily_views" in data
        
        # When sharing is enabled
        if data["shared"]:
            assert "share_token" in data
            assert data["share_token"] is not None
            assert isinstance(data["total_views"], int)
            assert isinstance(data["daily_views"], list)
            assert len(data["daily_views"]) == 7, "daily_views must have exactly 7 entries"
    
    def test_02_share_stats_daily_views_structure(self, headers):
        """Verify daily_views array has correct structure with date and views"""
        response = requests.get(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share-stats",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["shared"] == True
        daily_views = data["daily_views"]
        
        # Each entry should have date (YYYY-MM-DD) and views (int)
        for entry in daily_views:
            assert "date" in entry
            assert "views" in entry
            # Validate date format YYYY-MM-DD
            date_str = entry["date"]
            assert len(date_str) == 10
            assert date_str[4] == "-" and date_str[7] == "-"
            # Validate views is non-negative integer
            assert isinstance(entry["views"], int)
            assert entry["views"] >= 0
    
    def test_03_daily_views_includes_today(self, headers):
        """Verify today's date is included in daily_views array (last entry)"""
        response = requests.get(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share-stats",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        today = datetime.utcnow().strftime("%Y-%m-%d")
        daily_views = data["daily_views"]
        
        # Today should be the last entry
        last_entry_date = daily_views[-1]["date"]
        assert last_entry_date == today, f"Last entry should be today ({today}), got {last_entry_date}"
    
    def test_04_public_endpoint_increments_view_counter(self, headers):
        """GET /api/campaigns/public/{share_token} increments share_views counter in DB"""
        # Get current view count
        before_response = requests.get(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share-stats",
            headers=headers
        )
        assert before_response.status_code == 200
        views_before = before_response.json()["total_views"]
        
        # Visit public endpoint (increments counter)
        public_response = requests.get(f"{BASE_URL}/api/campaigns/public/{SHARE_TOKEN}")
        assert public_response.status_code == 200
        
        # Get updated view count
        after_response = requests.get(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share-stats",
            headers=headers
        )
        assert after_response.status_code == 200
        views_after = after_response.json()["total_views"]
        
        # View count should have incremented by 1
        assert views_after == views_before + 1, f"Expected views to increment from {views_before} to {views_before + 1}, got {views_after}"
    
    def test_05_public_endpoint_logs_to_share_events(self, headers):
        """GET /api/campaigns/public/{share_token} logs event to share_events collection"""
        # Get stats before
        before_response = requests.get(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share-stats",
            headers=headers
        )
        views_before = before_response.json()["total_views"]
        daily_today_before = before_response.json()["daily_views"][-1]["views"]
        
        # Visit public endpoint
        requests.get(f"{BASE_URL}/api/campaigns/public/{SHARE_TOKEN}")
        
        # Get stats after
        after_response = requests.get(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share-stats",
            headers=headers
        )
        views_after = after_response.json()["total_views"]
        daily_today_after = after_response.json()["daily_views"][-1]["views"]
        
        # Both total and today's daily should increment
        assert views_after == views_before + 1
        assert daily_today_after == daily_today_before + 1, \
            f"Today's daily views should increment from {daily_today_before} to {daily_today_before + 1}, got {daily_today_after}"
    
    def test_06_share_stats_returns_false_when_disabled(self, headers):
        """GET /api/campaigns/{id}/share-stats returns shared:false when sharing is disabled"""
        # First ensure sharing is enabled
        enable_resp = requests.post(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share",
            headers=headers
        )
        if not enable_resp.json()["shared"]:
            requests.post(f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share", headers=headers)
        
        # Disable sharing
        disable_resp = requests.post(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share",
            headers=headers
        )
        assert disable_resp.json()["shared"] == False
        
        # Check share-stats now returns shared:false
        stats_response = requests.get(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share-stats",
            headers=headers
        )
        assert stats_response.status_code == 200
        data = stats_response.json()
        
        assert data["shared"] == False
        assert data["total_views"] == 0
        assert data["daily_views"] == []
        
        # Re-enable sharing for other tests
        requests.post(f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share", headers=headers)
    
    def test_07_share_stats_requires_auth(self):
        """GET /api/campaigns/{id}/share-stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share-stats")
        assert response.status_code in [401, 403, 422]
    
    def test_08_share_stats_returns_404_for_nonexistent_campaign(self, headers):
        """GET /api/campaigns/{id}/share-stats returns 404 for non-existent campaign"""
        response = requests.get(
            f"{BASE_URL}/api/campaigns/nonexistent-campaign-id/share-stats",
            headers=headers
        )
        assert response.status_code == 404
    
    def test_09_final_state_verify_analytics(self, headers):
        """Final verification: ensure analytics data is correct"""
        # Ensure sharing is enabled
        enable_resp = requests.post(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share",
            headers=headers
        )
        if not enable_resp.json()["shared"]:
            enable_resp = requests.post(
                f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share",
                headers=headers
            )
        
        # Get share stats
        response = requests.get(
            f"{BASE_URL}/api/campaigns/{CAMPAIGN_ID}/share-stats",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify final state
        assert data["shared"] == True
        assert data["total_views"] > 0, "Should have tracked views from earlier tests"
        assert len(data["daily_views"]) == 7
        
        # Print for debugging
        print(f"\nFinal analytics state:")
        print(f"  Total views: {data['total_views']}")
        print(f"  Today's views: {data['daily_views'][-1]}")
        print(f"  Share token: {data['share_token']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
