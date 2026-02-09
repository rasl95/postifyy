#!/usr/bin/env python3
"""
Postify AI Backend API Testing
Tests all API endpoints systematically using public URL
"""

import requests
import json
import sys
from datetime import datetime
import uuid

class PostifyAPITester:
    def __init__(self, base_url="https://postify-ai-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.test_user_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        self.test_user_password = "TestPass123!"
        self.test_user_name = "Test User"
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        request_headers = {'Content-Type': 'application/json'}
        
        # Add authorization header if token available
        if self.token:
            request_headers['Authorization'] = f'Bearer {self.token}'
        
        # Add any custom headers
        if headers:
            request_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            # Use longer timeout for potentially slow endpoints
            timeout = 30 if 'image' in endpoint or 'stripe' in endpoint else 10
            
            if method == 'GET':
                response = requests.get(url, headers=request_headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers, timeout=timeout)

            success = response.status_code == expected_status
            
            # Log response details
            print(f"   Status: {response.status_code} (expected: {expected_status})")
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - {name}")
                try:
                    response_data = response.json()
                    self.results.append({
                        "test": name,
                        "status": "PASSED",
                        "expected_status": expected_status,
                        "actual_status": response.status_code,
                        "response_preview": str(response_data)[:200] + "..." if len(str(response_data)) > 200 else str(response_data)
                    })
                    return success, response_data
                except:
                    self.results.append({
                        "test": name,
                        "status": "PASSED",
                        "expected_status": expected_status,
                        "actual_status": response.status_code,
                        "response_preview": "Non-JSON response"
                    })
                    return success, {}
            else:
                print(f"❌ FAILED - {name}")
                print(f"   Expected status: {expected_status}, got: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error response: {error_data}")
                except:
                    print(f"   Response text: {response.text[:300]}...")
                
                self.results.append({
                    "test": name,
                    "status": "FAILED",
                    "expected_status": expected_status,
                    "actual_status": response.status_code,
                    "error": response.text[:200] + "..." if len(response.text) > 200 else response.text
                })
                return False, {}

        except Exception as e:
            print(f"❌ ERROR - {name}: {str(e)}")
            self.results.append({
                "test": name,
                "status": "ERROR",
                "error": str(e)
            })
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        print("\n" + "="*50)
        print("TESTING USER AUTHENTICATION")
        print("="*50)
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            201,
            data={
                "email": self.test_user_email,
                "password": self.test_user_password,
                "full_name": self.test_user_name
            }
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"✅ Registration successful - Token acquired")
            return True
        else:
            print(f"❌ Registration failed - No token received")
            return False

    def test_user_login(self):
        """Test user login with registered credentials"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": self.test_user_email,
                "password": self.test_user_password
            }
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"✅ Login successful - Token refreshed")
            return True
        else:
            print(f"❌ Login failed")
            return False

    def test_get_user_profile(self):
        """Test getting user profile with JWT token"""
        success, response = self.run_test(
            "Get User Profile (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        
        if success and 'email' in response:
            print(f"✅ User profile retrieved: {response.get('email', 'N/A')}")
            return True
        else:
            print(f"❌ Failed to get user profile")
            return False

    def test_templates_endpoint(self):
        """Test templates endpoint (should work without auth)"""
        print("\n" + "="*50)
        print("TESTING CONTENT ENDPOINTS")
        print("="*50)
        
        success, response = self.run_test(
            "Get Templates",
            "GET",
            "templates",
            200
        )
        
        if success and 'templates' in response:
            templates = response['templates']
            print(f"✅ Templates retrieved: {len(templates)} categories")
            for category, items in templates.items():
                print(f"   - {category}: {len(items)} templates")
            return True
        else:
            print(f"❌ Templates endpoint failed")
            return False

    def test_content_generation(self):
        """Test content generation endpoint"""
        success, response = self.run_test(
            "Generate Social Post",
            "POST",
            "generate",
            200,
            data={
                "content_type": "social_post",
                "topic": "Test topic for Postify AI",
                "target_audience": "content creators",
                "tone": "neutral",
                "platform": "instagram",
                "include_hashtags": True,
                "language": "en"
            }
        )
        
        if success and 'content' in response:
            generated_content = response.get('content', '')
            tokens_used = response.get('tokens_used', 0)
            print(f"✅ Content generated successfully")
            print(f"   Content preview: {generated_content[:100]}...")
            print(f"   Tokens used: {tokens_used}")
            return True, response.get('id')
        else:
            print(f"❌ Content generation failed")
            return False, None

    def test_image_generation(self):
        """Test AI image generation with specific parameters"""
        success, response = self.run_test(
            "Generate AI Image",
            "POST",
            "generate-image",
            200,
            data={
                "prompt": "A vibrant sunset",
                "style": "realistic"
            }
        )
        
        if success and 'image_url' in response:
            image_url = response.get('image_url', '')
            print(f"✅ Image generated successfully")
            print(f"   Image URL: {image_url[:50]}...")
            return True
        else:
            print(f"❌ Image generation failed")
            return False

    def test_stripe_checkout(self):
        """Test Stripe checkout session creation"""
        success, response = self.run_test(
            "Create Stripe Checkout Session",
            "POST",
            "subscriptions/create-checkout",
            200,
            data={
                "plan": "pro",
                "billing_period": "monthly"
            }
        )
        
        if success and 'checkout_url' in response:
            checkout_url = response.get('checkout_url', '')
            print(f"✅ Stripe checkout session created")
            print(f"   Checkout URL: {checkout_url[:50]}...")
            return True
        else:
            print(f"❌ Stripe checkout creation failed")
            return False

    def test_user_preferences(self):
        """Test user preferences endpoints"""
        print("\n" + "="*50)
        print("TESTING USER PREFERENCES")
        print("="*50)
        
        # Test saving preferences
        success, response = self.run_test(
            "Save User Preferences",
            "POST",
            "user/preferences",
            200,
            data={
                "content_goals": ["social_posts", "ai_images"],
                "platforms": ["instagram", "tiktok"],
                "business_niche": "marketing",
                "target_audience": "content creators",
                "preferred_tone": "neutral"
            }
        )
        
        if success:
            print(f"✅ Preferences saved")
        else:
            print(f"❌ Failed to save preferences")
            return False
            
        # Test getting preferences
        success, response = self.run_test(
            "Get User Preferences",
            "GET",
            "user/preferences",
            200
        )
        
        if success and 'preferences' in response:
            print(f"✅ Preferences retrieved")
            return True
        else:
            print(f"❌ Failed to get preferences")
            return False

    def test_drafts_functionality(self):
        """Test drafts save/retrieve functionality"""
        print("\n" + "="*50)
        print("TESTING DRAFTS FUNCTIONALITY")
        print("="*50)
        
        # Test saving a draft
        success, response = self.run_test(
            "Save Draft",
            "POST",
            "drafts",
            200,
            data={
                "draft_type": "content",
                "draft_data": {
                    "content_type": "social_post",
                    "topic": "Test draft topic",
                    "tone": "neutral"
                }
            }
        )
        
        if success:
            print(f"✅ Draft saved")
        else:
            print(f"❌ Failed to save draft")
            return False
            
        # Test retrieving a draft
        success, response = self.run_test(
            "Get Draft",
            "GET",
            "drafts/content",
            200
        )
        
        if success:
            print(f"✅ Draft retrieved")
            return True
        else:
            print(f"❌ Failed to get draft")
            return False

    def test_share_first_post_functionality(self):
        """Test share first post feature with bonus credits"""
        print("\n" + "="*50)
        print("TESTING SHARE FIRST POST FUNCTIONALITY")
        print("="*50)
        
        # First, check the initial share status (should be false for new user)
        success, response = self.run_test(
            "Get Initial Share Status",
            "GET",
            "share/first-post/status",
            200
        )
        
        if success:
            has_shared = response.get('has_shared', True)  # Should be False for new user
            bonus_claimed = response.get('bonus_claimed', True)  # Should be False for new user
            print(f"✅ Initial share status - has_shared: {has_shared}, bonus_claimed: {bonus_claimed}")
            
            if has_shared or bonus_claimed:
                print(f"⚠️ WARNING: New user already has share status set (has_shared: {has_shared}, bonus_claimed: {bonus_claimed})")
        else:
            print(f"❌ Failed to get initial share status")
            return False
            
        # Test sharing first post and claiming bonus
        success, response = self.run_test(
            "Share First Post (Claim Bonus)",
            "POST",
            "share/first-post",
            200,
            data={
                "platform": "twitter",
                "generation_id": "test_gen_123",
                "content_preview": "Test content for AI marketing tips sharing functionality"
            }
        )
        
        if success:
            bonus_granted = response.get('bonus_granted', False)
            bonus_amount = response.get('bonus_amount', 0)
            print(f"✅ First share completed - bonus_granted: {bonus_granted}, bonus_amount: {bonus_amount}")
            
            if not bonus_granted or bonus_amount != 3:
                print(f"❌ Expected bonus_granted=True and bonus_amount=3, got bonus_granted={bonus_granted}, bonus_amount={bonus_amount}")
                return False
        else:
            print(f"❌ Failed to share first post")
            return False
            
        # Test sharing again (should NOT grant bonus second time)
        success, response = self.run_test(
            "Share First Post Again (No Bonus)",
            "POST",
            "share/first-post",
            200,
            data={
                "platform": "linkedin",
                "generation_id": "test_gen_456",
                "content_preview": "Second share test content"
            }
        )
        
        if success:
            bonus_granted = response.get('bonus_granted', True)  # Should be False on second share
            bonus_amount = response.get('bonus_amount', 1)  # Should be 0 on second share
            print(f"✅ Second share completed - bonus_granted: {bonus_granted}, bonus_amount: {bonus_amount}")
            
            if bonus_granted or bonus_amount != 0:
                print(f"❌ Expected no bonus on second share, got bonus_granted={bonus_granted}, bonus_amount={bonus_amount}")
                return False
        else:
            print(f"❌ Failed second share")
            return False
            
        # Check final share status (should show has_shared=True, bonus_claimed=True)
        success, response = self.run_test(
            "Get Final Share Status",
            "GET",
            "share/first-post/status",
            200
        )
        
        if success:
            has_shared = response.get('has_shared', False)
            bonus_claimed = response.get('bonus_claimed', False)
            print(f"✅ Final share status - has_shared: {has_shared}, bonus_claimed: {bonus_claimed}")
            
            if not has_shared or not bonus_claimed:
                print(f"❌ Expected has_shared=True and bonus_claimed=True, got has_shared={has_shared}, bonus_claimed={bonus_claimed}")
                return False
                
            return True
        else:
            print(f"❌ Failed to get final share status")
            return False

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Postify AI Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print(f"📧 Test user: {self.test_user_email}")
        print(f"⏰ Started at: {datetime.now().isoformat()}")
        
        # Test sequence
        test_sequence = [
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Get User Profile", self.test_get_user_profile),
            ("Templates Endpoint", self.test_templates_endpoint),
            ("Content Generation", lambda: self.test_content_generation()[0]),
            ("Image Generation", self.test_image_generation),
            ("Stripe Checkout", self.test_stripe_checkout),
            ("User Preferences", self.test_user_preferences),
            ("Drafts Functionality", self.test_drafts_functionality),
        ]
        
        failed_tests = []
        
        for test_name, test_func in test_sequence:
            try:
                result = test_func()
                if not result:
                    failed_tests.append(test_name)
            except Exception as e:
                print(f"❌ EXCEPTION in {test_name}: {str(e)}")
                failed_tests.append(test_name)
        
        # Print final results
        print("\n" + "="*70)
        print("🏁 FINAL TEST RESULTS")
        print("="*70)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"✅ Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if failed_tests:
            print(f"\n❌ Failed tests:")
            for failed in failed_tests:
                print(f"   - {failed}")
        else:
            print(f"\n🎉 All tests passed!")
        
        # Return success status
        return len(failed_tests) == 0, self.results

def main():
    """Main function to run all tests"""
    tester = PostifyAPITester()
    success, results = tester.run_all_tests()
    
    # Save results to file
    results_file = f"/app/test_reports/backend_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    try:
        with open(results_file, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "base_url": tester.base_url,
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": f"{(tester.tests_passed/tester.tests_run)*100:.1f}%",
                "results": results
            }, f, indent=2)
        print(f"\n📄 Test results saved to: {results_file}")
    except Exception as e:
        print(f"⚠️ Could not save results file: {e}")
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()