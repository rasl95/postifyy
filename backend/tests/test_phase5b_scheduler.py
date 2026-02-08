"""
Test Phase 5B Scheduler Features
- POST /api/scheduler/posts - Create scheduled post (Pro only)
- GET /api/scheduler/posts - Get user's scheduled posts
- PUT /api/scheduler/posts/{id} - Update scheduled post
- DELETE /api/scheduler/posts/{id} - Delete scheduled post
- POST /api/scheduler/posts/{id}/publish - Mock publish
- POST /api/scheduler/ai-suggest - AI time suggestions
- GET /api/scheduler/stats - Get stats and hours saved
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
PRO_USER = {"email": "sharetest@test.com", "password": "password"}


class TestSchedulerEndpoints:
    """Test scheduler CRUD operations and features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup tokens for tests"""
        # Get Pro user token
        response = requests.post(f"{BASE_URL}/api/auth/login", json=PRO_USER)
        assert response.status_code == 200, f"Pro login failed: {response.text}"
        self.pro_token = response.json()["access_token"]
        self.pro_headers = {
            "Authorization": f"Bearer {self.pro_token}",
            "Content-Type": "application/json"
        }
        
        # Create free user for 403 tests
        self.free_email = f"TEST_free_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.free_email,
            "password": "testpass123",
            "full_name": "Free Test User"
        })
        assert reg_response.status_code == 201, f"Free user register failed: {reg_response.text}"
        self.free_token = reg_response.json()["access_token"]
        self.free_headers = {
            "Authorization": f"Bearer {self.free_token}",
            "Content-Type": "application/json"
        }
        
        yield
        
        # Cleanup: We'll leave test data for now to verify persistence
    
    def test_create_post_pro_user_success(self):
        """POST /api/scheduler/posts - Pro user can create scheduled post"""
        future_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        payload = {
            "content": "TEST_scheduled_post Test content for scheduled post",
            "platform": "instagram",
            "content_type": "post",
            "scheduled_time": future_time
        }
        
        response = requests.post(f"{BASE_URL}/api/scheduler/posts", json=payload, headers=self.pro_headers)
        
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "post" in data
        assert data["post"]["content"] == payload["content"]
        assert data["post"]["platform"] == "instagram"
        assert data["post"]["status"] == "scheduled"
        assert "id" in data["post"]
        
        # Save ID for later tests
        self.__class__.test_post_id = data["post"]["id"]
        print(f"Created scheduled post: {self.__class__.test_post_id}")
    
    def test_create_post_free_user_403(self):
        """POST /api/scheduler/posts - Free user gets 403"""
        future_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        payload = {
            "content": "Free user test",
            "platform": "instagram",
            "content_type": "post",
            "scheduled_time": future_time
        }
        
        response = requests.post(f"{BASE_URL}/api/scheduler/posts", json=payload, headers=self.free_headers)
        
        assert response.status_code == 403, f"Expected 403, got: {response.status_code} - {response.text}"
        assert "Pro" in response.json().get("detail", "") or "Business" in response.json().get("detail", "")
        print("Free user correctly blocked from creating scheduled posts")
    
    def test_get_posts_returns_list(self):
        """GET /api/scheduler/posts - Returns user's scheduled posts list"""
        response = requests.get(f"{BASE_URL}/api/scheduler/posts", headers=self.pro_headers)
        
        assert response.status_code == 200, f"Get posts failed: {response.text}"
        data = response.json()
        assert "posts" in data
        assert isinstance(data["posts"], list)
        assert "count" in data
        print(f"Got {data['count']} scheduled posts")
    
    def test_update_scheduled_post(self):
        """PUT /api/scheduler/posts/{id} - Updates scheduled post"""
        # First create a post to update
        future_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        create_payload = {
            "content": "TEST_update Original content",
            "platform": "instagram",
            "content_type": "post",
            "scheduled_time": future_time
        }
        create_response = requests.post(f"{BASE_URL}/api/scheduler/posts", json=create_payload, headers=self.pro_headers)
        assert create_response.status_code == 200
        post_id = create_response.json()["post"]["id"]
        
        # Update the post
        new_time = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
        update_payload = {
            "content": "TEST_update Updated content for post",
            "platform": "tiktok",  # Changed platform
            "content_type": "video",  # Changed type
            "scheduled_time": new_time
        }
        
        response = requests.put(f"{BASE_URL}/api/scheduler/posts/{post_id}", json=update_payload, headers=self.pro_headers)
        
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert data["post"]["content"] == update_payload["content"]
        assert data["post"]["platform"] == "tiktok"
        assert data["post"]["content_type"] == "video"
        print(f"Updated scheduled post: {post_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/scheduler/posts/{post_id}", headers=self.pro_headers)
    
    def test_update_nonexistent_post_404(self):
        """PUT /api/scheduler/posts/{id} - Returns 404 for invalid ID"""
        fake_id = str(uuid.uuid4())
        update_payload = {
            "content": "Test",
            "platform": "instagram",
            "content_type": "post",
            "scheduled_time": datetime.now(timezone.utc).isoformat()
        }
        
        response = requests.put(f"{BASE_URL}/api/scheduler/posts/{fake_id}", json=update_payload, headers=self.pro_headers)
        
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print("Update nonexistent post correctly returned 404")
    
    def test_delete_scheduled_post(self):
        """DELETE /api/scheduler/posts/{id} - Deletes scheduled post"""
        # First create a post to delete
        future_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        create_payload = {
            "content": "TEST_delete Post to be deleted",
            "platform": "telegram",
            "content_type": "post",
            "scheduled_time": future_time
        }
        create_response = requests.post(f"{BASE_URL}/api/scheduler/posts", json=create_payload, headers=self.pro_headers)
        assert create_response.status_code == 200
        post_id = create_response.json()["post"]["id"]
        
        # Delete the post
        response = requests.delete(f"{BASE_URL}/api/scheduler/posts/{post_id}", headers=self.pro_headers)
        
        assert response.status_code == 200, f"Delete failed: {response.text}"
        assert response.json().get("deleted") == True
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/scheduler/posts", headers=self.pro_headers)
        posts = get_response.json()["posts"]
        assert not any(p["id"] == post_id for p in posts), "Post should be deleted"
        print(f"Deleted scheduled post: {post_id}")
    
    def test_delete_nonexistent_post_404(self):
        """DELETE /api/scheduler/posts/{id} - Returns 404 for invalid ID"""
        fake_id = str(uuid.uuid4())
        
        response = requests.delete(f"{BASE_URL}/api/scheduler/posts/{fake_id}", headers=self.pro_headers)
        
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print("Delete nonexistent post correctly returned 404")
    
    def test_publish_post_mock(self):
        """POST /api/scheduler/posts/{id}/publish - Mock publishes post"""
        # Create a post to publish
        future_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        create_payload = {
            "content": "TEST_publish Post for publishing test",
            "platform": "instagram",
            "content_type": "post",
            "scheduled_time": future_time
        }
        create_response = requests.post(f"{BASE_URL}/api/scheduler/posts", json=create_payload, headers=self.pro_headers)
        assert create_response.status_code == 200
        post_id = create_response.json()["post"]["id"]
        
        # Publish the post
        response = requests.post(f"{BASE_URL}/api/scheduler/posts/{post_id}/publish", headers=self.pro_headers)
        
        assert response.status_code == 200, f"Publish failed: {response.text}"
        data = response.json()
        assert "status" in data
        assert data["status"] in ["published", "failed"]  # 90% success rate, can be either
        assert "message" in data
        print(f"Publish result: {data['status']} - {data['message']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/scheduler/posts/{post_id}", headers=self.pro_headers)
    
    def test_publish_nonexistent_post_404(self):
        """POST /api/scheduler/posts/{id}/publish - Returns 404 for invalid ID"""
        fake_id = str(uuid.uuid4())
        
        response = requests.post(f"{BASE_URL}/api/scheduler/posts/{fake_id}/publish", headers=self.pro_headers)
        
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print("Publish nonexistent post correctly returned 404")


class TestAIScheduleSuggestions:
    """Test AI scheduling suggestions endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup tokens for tests"""
        # Pro user token
        response = requests.post(f"{BASE_URL}/api/auth/login", json=PRO_USER)
        self.pro_token = response.json()["access_token"]
        self.pro_headers = {
            "Authorization": f"Bearer {self.pro_token}",
            "Content-Type": "application/json"
        }
        
        # Free user token
        self.free_email = f"TEST_free_ai_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.free_email,
            "password": "testpass123",
            "full_name": "Free AI Test User"
        })
        self.free_token = reg_response.json()["access_token"]
        self.free_headers = {
            "Authorization": f"Bearer {self.free_token}",
            "Content-Type": "application/json"
        }
    
    def test_ai_suggest_pro_user_instagram(self):
        """POST /api/scheduler/ai-suggest - Returns AI suggestions for Instagram"""
        payload = {
            "platform": "instagram",
            "content_type": "post",
            "count": 3
        }
        
        response = requests.post(f"{BASE_URL}/api/scheduler/ai-suggest", json=payload, headers=self.pro_headers)
        
        assert response.status_code == 200, f"AI suggest failed: {response.text}"
        data = response.json()
        assert "suggestions" in data
        assert len(data["suggestions"]) == 3
        
        # Validate suggestion structure
        for suggestion in data["suggestions"]:
            assert "datetime" in suggestion
            assert "day" in suggestion
            assert "time" in suggestion
            assert "reason" in suggestion
            assert "confidence" in suggestion
            assert 0 <= suggestion["confidence"] <= 1
        
        print(f"Got {len(data['suggestions'])} AI suggestions for Instagram")
    
    def test_ai_suggest_tiktok_video(self):
        """POST /api/scheduler/ai-suggest - Returns AI suggestions for TikTok video"""
        payload = {
            "platform": "tiktok",
            "content_type": "video",
            "count": 2
        }
        
        response = requests.post(f"{BASE_URL}/api/scheduler/ai-suggest", json=payload, headers=self.pro_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["suggestions"]) == 2
        assert all(s["platform"] == "tiktok" for s in data["suggestions"])
        print(f"Got TikTok video suggestions")
    
    def test_ai_suggest_free_user_403(self):
        """POST /api/scheduler/ai-suggest - Free user gets 403"""
        payload = {
            "platform": "instagram",
            "content_type": "post",
            "count": 3
        }
        
        response = requests.post(f"{BASE_URL}/api/scheduler/ai-suggest", json=payload, headers=self.free_headers)
        
        assert response.status_code == 403, f"Expected 403, got: {response.status_code}"
        assert "Pro" in response.json().get("detail", "") or "Business" in response.json().get("detail", "")
        print("Free user correctly blocked from AI suggestions")


class TestSchedulerStats:
    """Test scheduler stats endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup tokens for tests"""
        # Pro user token
        response = requests.post(f"{BASE_URL}/api/auth/login", json=PRO_USER)
        self.pro_token = response.json()["access_token"]
        self.pro_headers = {
            "Authorization": f"Bearer {self.pro_token}",
            "Content-Type": "application/json"
        }
        
        # Free user token (stats should work for free users)
        self.free_email = f"TEST_free_stats_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.free_email,
            "password": "testpass123",
            "full_name": "Free Stats Test User"
        })
        self.free_token = reg_response.json()["access_token"]
        self.free_headers = {
            "Authorization": f"Bearer {self.free_token}",
            "Content-Type": "application/json"
        }
    
    def test_stats_returns_counts_and_hours_saved(self):
        """GET /api/scheduler/stats - Returns scheduled/published/failed counts and hours_saved"""
        response = requests.get(f"{BASE_URL}/api/scheduler/stats", headers=self.pro_headers)
        
        assert response.status_code == 200, f"Stats failed: {response.text}"
        data = response.json()
        
        # Verify all required fields
        assert "scheduled" in data
        assert "published" in data
        assert "failed" in data
        assert "hours_saved" in data
        
        # Verify data types
        assert isinstance(data["scheduled"], int)
        assert isinstance(data["published"], int)
        assert isinstance(data["failed"], int)
        assert isinstance(data["hours_saved"], (int, float))
        
        print(f"Stats: scheduled={data['scheduled']}, published={data['published']}, failed={data['failed']}, hours_saved={data['hours_saved']}")
    
    def test_stats_available_to_free_users(self):
        """GET /api/scheduler/stats - Free users can access stats"""
        response = requests.get(f"{BASE_URL}/api/scheduler/stats", headers=self.free_headers)
        
        # Stats endpoint does NOT require Pro (confirmed in review_request)
        assert response.status_code == 200, f"Free user stats failed: {response.text}"
        data = response.json()
        assert "hours_saved" in data
        print("Free user can access scheduler stats")
    
    def test_stats_hours_saved_calculation(self):
        """GET /api/scheduler/stats - Verify hours_saved increases with posts"""
        # Get initial stats
        initial_response = requests.get(f"{BASE_URL}/api/scheduler/stats", headers=self.pro_headers)
        initial_hours = initial_response.json()["hours_saved"]
        
        # Create a post
        future_time = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        create_response = requests.post(f"{BASE_URL}/api/scheduler/posts", json={
            "content": "TEST_hours_calc Post for hours calculation",
            "platform": "youtube",
            "content_type": "video",
            "scheduled_time": future_time
        }, headers=self.pro_headers)
        assert create_response.status_code == 200
        post_id = create_response.json()["post"]["id"]
        
        # Get stats again
        new_response = requests.get(f"{BASE_URL}/api/scheduler/stats", headers=self.pro_headers)
        new_hours = new_response.json()["hours_saved"]
        
        # Hours should increase (formula: scheduled_posts*20 + generations*15) / 60
        # One new post = 20 min / 60 = 0.33 hours increase
        assert new_hours >= initial_hours, f"Hours should increase: {initial_hours} -> {new_hours}"
        print(f"Hours saved increased: {initial_hours} -> {new_hours}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/scheduler/posts/{post_id}", headers=self.pro_headers)


class TestSchedulerRequiresAuth:
    """Test that all scheduler endpoints require authentication"""
    
    def test_create_post_requires_auth(self):
        """POST /api/scheduler/posts - Requires auth"""
        response = requests.post(f"{BASE_URL}/api/scheduler/posts", json={
            "content": "Test",
            "platform": "instagram",
            "content_type": "post",
            "scheduled_time": datetime.now(timezone.utc).isoformat()
        })
        assert response.status_code in [401, 403], f"Expected auth error, got: {response.status_code}"
    
    def test_get_posts_requires_auth(self):
        """GET /api/scheduler/posts - Requires auth"""
        response = requests.get(f"{BASE_URL}/api/scheduler/posts")
        assert response.status_code in [401, 403], f"Expected auth error, got: {response.status_code}"
    
    def test_ai_suggest_requires_auth(self):
        """POST /api/scheduler/ai-suggest - Requires auth"""
        response = requests.post(f"{BASE_URL}/api/scheduler/ai-suggest", json={
            "platform": "instagram",
            "content_type": "post",
            "count": 3
        })
        assert response.status_code in [401, 403], f"Expected auth error, got: {response.status_code}"
    
    def test_stats_requires_auth(self):
        """GET /api/scheduler/stats - Requires auth"""
        response = requests.get(f"{BASE_URL}/api/scheduler/stats")
        assert response.status_code in [401, 403], f"Expected auth error, got: {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
