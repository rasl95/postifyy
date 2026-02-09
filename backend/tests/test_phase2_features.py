"""
Postify AI - Phase 2 Features Tests
Tests for: Analytics tracking, Favorites folders, Favorites search, QuickActions
Test user: phase2_1770307057@test.com / Test123!@# (Pro plan)
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://history-display-bug.preview.emergentagent.com')

# Test credentials for Pro user
PRO_USER_EMAIL = "phase2_1770307057@test.com"
PRO_USER_PASSWORD = "Test123!@#"


class TestProUserAuth:
    """Test authentication for Pro user"""
    
    @pytest.fixture(scope="class")
    def pro_token(self):
        """Get token for Pro user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Pro user login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_pro_user_login(self, pro_token):
        """Test Pro user can login successfully"""
        assert pro_token is not None
        assert len(pro_token) > 0
    
    def test_pro_user_has_pro_plan(self, pro_token):
        """Test Pro user has correct subscription plan"""
        response = requests.get(f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["subscription_plan"] == "pro"


class TestAnalyticsTrack:
    """Test POST /api/analytics/track endpoint"""
    
    @pytest.fixture(scope="class")
    def pro_token(self):
        """Get token for Pro user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Pro user login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_track_content_generated_event(self, pro_token):
        """Test tracking content_generated event"""
        response = requests.post(f"{BASE_URL}/api/analytics/track",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={
                "event": "content_generated",
                "properties": {
                    "content_type": "social_post",
                    "tone": "selling",
                    "platform": "instagram",
                    "tokens": 150
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["tracked"] == True
    
    def test_track_template_selected_event(self, pro_token):
        """Test tracking template_selected event"""
        response = requests.post(f"{BASE_URL}/api/analytics/track",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={
                "event": "template_selected",
                "properties": {
                    "template_id": "product_promo"
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["tracked"] == True
    
    def test_track_favorite_added_event(self, pro_token):
        """Test tracking favorite_added event"""
        response = requests.post(f"{BASE_URL}/api/analytics/track",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={
                "event": "favorite_added",
                "properties": {
                    "content_id": "test-content-123",
                    "folder_id": None
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["tracked"] == True
    
    def test_track_upgrade_clicked_event(self, pro_token):
        """Test tracking upgrade_clicked event"""
        response = requests.post(f"{BASE_URL}/api/analytics/track",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={
                "event": "upgrade_clicked",
                "properties": {
                    "source": "favorites_button",
                    "current_plan": "free"
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["tracked"] == True
    
    def test_track_without_auth_fails(self):
        """Test tracking without auth returns 401/403"""
        response = requests.post(f"{BASE_URL}/api/analytics/track",
            json={
                "event": "test_event",
                "properties": {}
            }
        )
        assert response.status_code in [401, 403]


class TestAnalyticsSummary:
    """Test GET /api/analytics/summary endpoint"""
    
    @pytest.fixture(scope="class")
    def pro_token(self):
        """Get token for Pro user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Pro user login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_get_analytics_summary(self, pro_token):
        """Test getting analytics summary"""
        response = requests.get(f"{BASE_URL}/api/analytics/summary",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "total" in data
        assert "this_month" in data
        assert "content_types" in data
        assert "recent_activity" in data
        
        # Check total structure
        assert "content" in data["total"]
        assert "images" in data["total"]
        assert "favorites" in data["total"]
        
        # Check this_month structure
        assert "content" in data["this_month"]
        assert "images" in data["this_month"]
        
        # Check recent_activity structure
        assert "last_7_days" in data["recent_activity"]
    
    def test_analytics_summary_without_auth_fails(self):
        """Test analytics summary without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/analytics/summary")
        assert response.status_code in [401, 403]


class TestFavoritesFolders:
    """Test Favorites Folders CRUD endpoints"""
    
    @pytest.fixture(scope="class")
    def pro_token(self):
        """Get token for Pro user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Pro user login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_get_favorites_folders(self, pro_token):
        """Test GET /api/favorites/folders"""
        response = requests.get(f"{BASE_URL}/api/favorites/folders",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "folders" in data
        assert "uncategorized_count" in data
        assert isinstance(data["folders"], list)
        assert isinstance(data["uncategorized_count"], int)
    
    def test_create_favorites_folder(self, pro_token):
        """Test POST /api/favorites/folders - Create folder"""
        folder_name = f"TEST_Folder_{int(time.time())}"
        response = requests.post(f"{BASE_URL}/api/favorites/folders",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={
                "name": folder_name,
                "color": "#FF3B30"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check folder was created
        assert "folder" in data
        assert data["folder"]["name"] == folder_name
        assert data["folder"]["color"] == "#FF3B30"
        assert "id" in data["folder"]
        
        # Store folder ID for cleanup
        return data["folder"]["id"]
    
    def test_rename_favorites_folder(self, pro_token):
        """Test PUT /api/favorites/folders/{id} - Rename folder"""
        # First create a folder
        folder_name = f"TEST_Rename_{int(time.time())}"
        create_response = requests.post(f"{BASE_URL}/api/favorites/folders",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={"name": folder_name, "color": "#6366F1"}
        )
        assert create_response.status_code == 200
        folder_id = create_response.json()["folder"]["id"]
        
        # Rename the folder
        new_name = f"TEST_Renamed_{int(time.time())}"
        rename_response = requests.put(f"{BASE_URL}/api/favorites/folders/{folder_id}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={"name": new_name}
        )
        assert rename_response.status_code == 200
        assert rename_response.json()["message"] == "Folder renamed"
        
        # Verify rename by getting folders
        get_response = requests.get(f"{BASE_URL}/api/favorites/folders",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        folders = get_response.json()["folders"]
        renamed_folder = next((f for f in folders if f["id"] == folder_id), None)
        assert renamed_folder is not None
        assert renamed_folder["name"] == new_name
        
        # Cleanup - delete the folder
        requests.delete(f"{BASE_URL}/api/favorites/folders/{folder_id}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
    
    def test_delete_favorites_folder(self, pro_token):
        """Test DELETE /api/favorites/folders/{id} - Delete folder"""
        # First create a folder
        folder_name = f"TEST_Delete_{int(time.time())}"
        create_response = requests.post(f"{BASE_URL}/api/favorites/folders",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={"name": folder_name, "color": "#10B981"}
        )
        assert create_response.status_code == 200
        folder_id = create_response.json()["folder"]["id"]
        
        # Delete the folder
        delete_response = requests.delete(f"{BASE_URL}/api/favorites/folders/{folder_id}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert delete_response.status_code == 200
        assert delete_response.json()["message"] == "Folder deleted"
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/favorites/folders",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        folders = get_response.json()["folders"]
        deleted_folder = next((f for f in folders if f["id"] == folder_id), None)
        assert deleted_folder is None
    
    def test_rename_nonexistent_folder_returns_404(self, pro_token):
        """Test renaming non-existent folder returns 404"""
        response = requests.put(f"{BASE_URL}/api/favorites/folders/nonexistent-id",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={"name": "New Name"}
        )
        assert response.status_code == 404
    
    def test_delete_nonexistent_folder_returns_404(self, pro_token):
        """Test deleting non-existent folder returns 404"""
        response = requests.delete(f"{BASE_URL}/api/favorites/folders/nonexistent-id",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 404


class TestFavoritesSearch:
    """Test GET /api/favorites/search endpoint"""
    
    @pytest.fixture(scope="class")
    def pro_token(self):
        """Get token for Pro user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Pro user login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_search_favorites_basic(self, pro_token):
        """Test basic favorites search"""
        response = requests.get(f"{BASE_URL}/api/favorites/search?q=test",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "items" in data
        assert "query" in data
        assert data["query"] == "test"
        assert isinstance(data["items"], list)
    
    def test_search_favorites_with_empty_query(self, pro_token):
        """Test search with empty query"""
        response = requests.get(f"{BASE_URL}/api/favorites/search?q=",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_search_favorites_with_special_characters(self, pro_token):
        """Test search with special characters"""
        response = requests.get(f"{BASE_URL}/api/favorites/search?q=продукт",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_search_favorites_without_auth_fails(self):
        """Test search without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/favorites/search?q=test")
        assert response.status_code in [401, 403]


class TestFavoritesMove:
    """Test PUT /api/favorites/{id}/move endpoint"""
    
    @pytest.fixture(scope="class")
    def pro_token(self):
        """Get token for Pro user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Pro user login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_move_favorite_to_folder(self, pro_token):
        """Test moving favorite to a folder"""
        # First, get existing favorites
        fav_response = requests.get(f"{BASE_URL}/api/favorites",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        
        if fav_response.status_code != 200 or not fav_response.json().get("items"):
            pytest.skip("No favorites available to test move")
        
        favorites = fav_response.json()["items"]
        if not favorites:
            pytest.skip("No favorites available to test move")
        
        favorite_id = favorites[0]["id"]
        
        # Create a folder to move to
        folder_response = requests.post(f"{BASE_URL}/api/favorites/folders",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={"name": f"TEST_Move_{int(time.time())}", "color": "#EC4899"}
        )
        
        if folder_response.status_code != 200:
            pytest.skip("Could not create folder for move test")
        
        folder_id = folder_response.json()["folder"]["id"]
        
        # Move favorite to folder
        move_response = requests.put(f"{BASE_URL}/api/favorites/{favorite_id}/move",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={"folder_id": folder_id}
        )
        assert move_response.status_code == 200
        assert "Moved" in move_response.json()["message"]
        
        # Move back to uncategorized
        move_back_response = requests.put(f"{BASE_URL}/api/favorites/{favorite_id}/move",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={"folder_id": None}
        )
        assert move_back_response.status_code == 200
        
        # Cleanup - delete the folder
        requests.delete(f"{BASE_URL}/api/favorites/folders/{folder_id}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )


class TestFreeUserFoldersAccess:
    """Test that Free users cannot access folders endpoints"""
    
    @pytest.fixture
    def free_user_token(self):
        """Get token for free user"""
        import random
        test_email = f"test_folders_free_{int(time.time())}_{random.randint(1000,9999)}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Free Test User"
        })
        if response.status_code != 200:
            pytest.skip(f"Registration failed: {response.text}")
        return response.json()["access_token"]
    
    def test_get_folders_blocked_for_free_user(self, free_user_token):
        """Test GET /api/favorites/folders returns 403 for Free user"""
        response = requests.get(f"{BASE_URL}/api/favorites/folders",
            headers={"Authorization": f"Bearer {free_user_token}"}
        )
        assert response.status_code == 403
    
    def test_create_folder_blocked_for_free_user(self, free_user_token):
        """Test POST /api/favorites/folders returns 403 for Free user"""
        response = requests.post(f"{BASE_URL}/api/favorites/folders",
            headers={"Authorization": f"Bearer {free_user_token}"},
            json={"name": "Test Folder", "color": "#FF3B30"}
        )
        assert response.status_code == 403
    
    def test_search_favorites_blocked_for_free_user(self, free_user_token):
        """Test GET /api/favorites/search returns 403 for Free user"""
        response = requests.get(f"{BASE_URL}/api/favorites/search?q=test",
            headers={"Authorization": f"Bearer {free_user_token}"}
        )
        assert response.status_code == 403


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def pro_token(self):
        """Get token for Pro user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Pro user login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_cleanup_test_folders(self, pro_token):
        """Cleanup TEST_ prefixed folders"""
        response = requests.get(f"{BASE_URL}/api/favorites/folders",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        
        if response.status_code == 200:
            folders = response.json().get("folders", [])
            for folder in folders:
                if folder["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/favorites/folders/{folder['id']}",
                        headers={"Authorization": f"Bearer {pro_token}"}
                    )
        
        assert True  # Cleanup always passes


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
