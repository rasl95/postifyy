"""
Phase 5C Growth Loops & Virality Tests
- Referral system: unique codes per user, +5 to referrer / +3 to friend on signup
- Watermark 'Created with Postify AI' on free user content
- Viral prompts at generation milestones (5, 10, 20)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from review_request
PRO_USER_EMAIL = "sharetest@test.com"
PRO_USER_PASSWORD = "password"
PRO_USER_REFERRAL_CODE = "EFEDB72E"

FREE_USER_EMAIL = "ref_friend@test.com"
FREE_USER_PASSWORD = "password"


class TestReferralCheck:
    """Test referral code validation - public endpoint (no auth)"""
    
    def test_check_valid_referral_code(self):
        """GET /api/referrals/check/{code} with valid code returns valid:true"""
        response = requests.get(f"{BASE_URL}/api/referrals/check/{PRO_USER_REFERRAL_CODE}")
        print(f"Check valid referral code response: {response.status_code} - {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == True
        assert "referrer_name" in data
        print(f"Valid referral code confirmed: {PRO_USER_REFERRAL_CODE}")
    
    def test_check_invalid_referral_code(self):
        """GET /api/referrals/check/{code} with invalid code returns 404"""
        fake_code = "INVALID123"
        response = requests.get(f"{BASE_URL}/api/referrals/check/{fake_code}")
        print(f"Check invalid referral code response: {response.status_code}")
        
        assert response.status_code == 404


class TestReferralSystem:
    """Test referral system flow"""
    
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
    def initial_referral_stats(self, pro_user_token):
        """Capture initial referral stats for comparison"""
        response = requests.get(
            f"{BASE_URL}/api/referrals/stats",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        assert response.status_code == 200
        return response.json()
    
    def test_referrals_stats_endpoint(self, pro_user_token, initial_referral_stats):
        """GET /api/referrals/stats returns referral_code, total_referrals, bonus_credits, referrals history"""
        print(f"Referral stats response: {initial_referral_stats}")
        
        # Verify required fields
        assert "referral_code" in initial_referral_stats
        assert "total_referrals" in initial_referral_stats
        assert "bonus_credits" in initial_referral_stats
        assert "referrals" in initial_referral_stats
        assert "rewards" in initial_referral_stats
        
        # Verify referral code matches expected
        assert initial_referral_stats["referral_code"] == PRO_USER_REFERRAL_CODE
        print(f"Referral stats verified: code={initial_referral_stats['referral_code']}, total={initial_referral_stats['total_referrals']}")
    
    def test_login_includes_referral_info(self):
        """Login response includes referral_code and referral_bonus_credits"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        assert response.status_code == 200
        
        data = response.json()
        user = data.get("user", {})
        
        assert "referral_code" in user, "Login response missing referral_code"
        assert "referral_bonus_credits" in user, "Login response missing referral_bonus_credits"
        
        print(f"Login response includes referral info: code={user.get('referral_code')}, bonus={user.get('referral_bonus_credits')}")
    
    def test_register_with_referral_code_awards_credits(self, pro_user_token, initial_referral_stats):
        """POST /api/auth/register with referral_code awards +5 to referrer and +3 to new user"""
        # Generate unique email for test user
        test_email = f"TEST_referred_{uuid.uuid4().hex[:8]}@test.com"
        
        # Register new user with referral code
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "full_name": "Test Referred User",
            "referral_code": PRO_USER_REFERRAL_CODE
        })
        
        print(f"Register with referral code response: {response.status_code}")
        assert response.status_code == 201, f"Registration failed: {response.text}"
        
        reg_data = response.json()
        new_user = reg_data.get("user", {})
        
        # Verify new user got +3 bonus credits
        assert new_user.get("referral_bonus_credits") == 3, f"New user should get +3 credits, got {new_user.get('referral_bonus_credits')}"
        print(f"New user received +3 bonus credits: {new_user.get('referral_bonus_credits')}")
        
        # Verify new user has their own referral code
        assert "referral_code" in new_user, "New user should have their own referral code"
        print(f"New user got own referral code: {new_user.get('referral_code')}")
        
        # Check referrer's stats increased by +5
        updated_stats = requests.get(
            f"{BASE_URL}/api/referrals/stats",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        assert updated_stats.status_code == 200
        updated_data = updated_stats.json()
        
        # Verify referrer got +5 bonus credits and total_referrals increased
        expected_bonus = initial_referral_stats.get("bonus_credits", 0) + 5
        expected_referrals = initial_referral_stats.get("total_referrals", 0) + 1
        
        assert updated_data.get("bonus_credits") == expected_bonus, f"Referrer should have {expected_bonus} bonus credits, got {updated_data.get('bonus_credits')}"
        assert updated_data.get("total_referrals") == expected_referrals, f"Referrer should have {expected_referrals} referrals, got {updated_data.get('total_referrals')}"
        
        print(f"Referrer stats updated: bonus_credits={updated_data.get('bonus_credits')}, total_referrals={updated_data.get('total_referrals')}")
        
        # Verify referral count increased (emails may be masked for privacy)
        referrals_list = updated_data.get("referrals", [])
        assert len(referrals_list) == expected_referrals, f"Referral history should have {expected_referrals} entries, got {len(referrals_list)}"
        print(f"Referral history has {len(referrals_list)} entries (emails masked for privacy)")


class TestWatermark:
    """Test watermark on free user content"""
    
    @pytest.fixture(scope="class")
    def free_user_token(self):
        """Login or create a free user"""
        # First try to login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": FREE_USER_EMAIL,
            "password": FREE_USER_PASSWORD
        })
        
        if response.status_code == 200:
            return response.json()["access_token"]
        
        # If login fails, register
        test_email = f"TEST_free_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "full_name": "Test Free User"
        })
        assert response.status_code == 201
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def pro_user_token(self):
        """Login as Pro user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_generate_free_user_returns_watermark_true(self, free_user_token):
        """POST /api/generate returns watermark:true for free users"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "content_type": "social_post",
                "topic": "Test watermark feature",
                "tone": "neutral",
                "platform": "instagram"
            },
            headers={"Authorization": f"Bearer {free_user_token}"}
        )
        
        print(f"Generate (free user) response: {response.status_code}")
        
        # May be 403 if limit reached, which is okay for this test
        if response.status_code == 403:
            print("Free user limit reached - skipping watermark test for free user")
            pytest.skip("Free user generation limit reached")
        
        assert response.status_code == 200, f"Generation failed: {response.text}"
        data = response.json()
        
        assert "watermark" in data, "Response should include watermark field"
        assert data.get("watermark") == True, f"Free user should have watermark:true, got {data.get('watermark')}"
        print(f"Free user generation includes watermark:true ✓")
    
    def test_generate_pro_user_returns_watermark_false(self, pro_user_token):
        """POST /api/generate returns watermark:false for pro users"""
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={
                "content_type": "social_post",
                "topic": "Test watermark pro",
                "tone": "neutral",
                "platform": "instagram"
            },
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        print(f"Generate (pro user) response: {response.status_code}")
        assert response.status_code == 200, f"Generation failed: {response.text}"
        
        data = response.json()
        assert "watermark" in data, "Response should include watermark field"
        assert data.get("watermark") == False, f"Pro user should have watermark:false, got {data.get('watermark')}"
        print(f"Pro user generation has watermark:false ✓")


class TestGenerationCount:
    """Test generation count endpoint for viral prompts"""
    
    @pytest.fixture(scope="class")
    def pro_user_token(self):
        """Login as Pro user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_generation_count_endpoint(self, pro_user_token):
        """GET /api/user/generation-count returns total generations"""
        response = requests.get(
            f"{BASE_URL}/api/user/generation-count",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        print(f"Generation count response: {response.status_code} - {response.json()}")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_generations" in data, "Response should include total_generations"
        assert isinstance(data["total_generations"], int), "total_generations should be integer"
        
        print(f"Total generations for pro user: {data['total_generations']}")
    
    def test_generation_count_requires_auth(self):
        """GET /api/user/generation-count requires authentication"""
        response = requests.get(f"{BASE_URL}/api/user/generation-count")
        
        print(f"Generation count without auth: {response.status_code}")
        assert response.status_code in [401, 403], "Should require authentication"


class TestReferralRewards:
    """Test referral reward configuration"""
    
    @pytest.fixture(scope="class")
    def pro_user_token(self):
        """Login as Pro user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_USER_EMAIL,
            "password": PRO_USER_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_referral_stats_includes_rewards_config(self, pro_user_token):
        """GET /api/referrals/stats includes rewards configuration"""
        response = requests.get(
            f"{BASE_URL}/api/referrals/stats",
            headers={"Authorization": f"Bearer {pro_user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify rewards config
        assert "rewards" in data, "Response should include rewards config"
        rewards = data["rewards"]
        
        assert "referrer" in rewards, "Rewards should specify referrer bonus"
        assert "referred" in rewards, "Rewards should specify referred bonus"
        assert rewards["referrer"] == 5, f"Referrer should get +5, got {rewards['referrer']}"
        assert rewards["referred"] == 3, f"Referred should get +3, got {rewards['referred']}"
        
        print(f"Rewards config verified: referrer=+{rewards['referrer']}, referred=+{rewards['referred']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
