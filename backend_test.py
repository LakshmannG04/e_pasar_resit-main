#!/usr/bin/env python3
"""
E-Pasar Agricultural Marketplace - Backend API Testing
Tests all the new features mentioned in the review request:
1. AI Category Verification
2. AI Image Generation 
3. Enhanced Communication System
4. Product View Counter
"""

import requests
import sys
import json
from datetime import datetime

class EPasarAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, message, response_data=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: {message}")
        else:
            print(f"❌ {name}: {message}")
        
        self.test_results.append({
            'test': name,
            'success': success,
            'message': message,
            'data': response_data
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            
            try:
                response_json = response.json()
            except:
                response_json = {"raw_response": response.text}

            if success:
                self.log_test(name, True, f"Status: {response.status_code}", response_json)
                return True, response_json
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}", response_json)
                return False, response_json

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_login(self, username, password):
        """Test login and get token"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "login",
            200,
            data={"username": username, "password": password}
        )
        
        if success and 'data' in response and 'token' in response['data']:
            self.token = response['data']['token']
            self.user_id = response['data'].get('userID')
            user_auth = response['data'].get('userAuth')
            print(f"✅ Login successful - UserAuth: {user_auth}, UserID: {self.user_id}")
            return True, user_auth
        return False, None

    def test_basic_endpoints(self):
        """Test basic system endpoints"""
        print("\n🔍 Testing Basic System Endpoints...")
        
        # Test products endpoint
        self.run_test("Get All Products", "GET", "products", 200)
        
        # Test categories endpoint
        self.run_test("Get Categories", "GET", "category", 200)

    def test_ai_category_verification(self):
        """Test AI Category Verification feature"""
        print("\n🤖 Testing AI Category Verification...")
        
        # Test category suggestion
        test_data = {
            "productName": "Fresh Organic Tomatoes",
            "description": "Locally grown organic tomatoes, perfect for cooking and salads. Rich in vitamins and minerals."
        }
        
        self.run_test(
            "AI Category Suggestion",
            "POST",
            "products/suggest-category",
            200,
            data=test_data
        )
        
        # Test categories info endpoint
        self.run_test(
            "Get Categories Info",
            "GET",
            "products/categories-info",
            200
        )

    def test_ai_image_generation(self):
        """Test AI Image Generation feature"""
        print("\n🖼️ Testing AI Image Generation...")
        
        # Test single image generation
        test_data = {
            "productName": "Fresh Organic Carrots",
            "category": "Vegetables"
        }
        
        self.run_test(
            "Generate Single Image",
            "POST",
            "products/generate-image",
            200,
            data=test_data
        )
        
        # Test multiple image options
        test_data = {
            "productName": "Fresh Organic Carrots",
            "category": "Vegetables",
            "count": 3
        }
        
        self.run_test(
            "Get Image Options",
            "POST",
            "products/image-options",
            200,
            data=test_data
        )

    def test_product_view_counter(self):
        """Test Product View Counter feature"""
        print("\n👁️ Testing Product View Counter...")
        
        # First get a product ID
        success, products_response = self.run_test("Get Products for View Test", "GET", "products", 200)
        
        if success and 'data' in products_response and len(products_response['data']) > 0:
            product_id = products_response['data'][0]['ProductID']
            
            # Test track view
            self.run_test(
                "Track Product View",
                "POST",
                f"products/track-view/{product_id}",
                200
            )
            
            # Test view statistics
            self.run_test(
                "Get View Statistics",
                "GET",
                f"products/view-stats/{product_id}",
                200
            )
            
            # Test popular products
            self.run_test(
                "Get Popular Products",
                "GET",
                "products/popular?limit=5",
                200
            )
        else:
            self.log_test("Product View Counter", False, "No products available for testing")

    def test_communication_system(self):
        """Test Enhanced Communication System - Seller Communication Focus"""
        print("\n💬 Testing Enhanced Communication System (Seller Focus)...")
        
        # Test get conversations
        success, conversations_response = self.run_test(
            "Get My Conversations",
            "GET",
            "communication/my-conversations",
            200
        )
        
        # Test unread count
        self.run_test(
            "Get Unread Count",
            "GET",
            "communication/unread-count",
            200
        )
        
        # Test search users functionality
        self.run_test(
            "Search Users by Username",
            "GET",
            "communication/search-users?username=test",
            200
        )
        
        # Test search users with empty query (should fail)
        self.run_test(
            "Search Users Empty Query",
            "GET",
            "communication/search-users?username=",
            400
        )
        
        # Test create conversation/dispute
        test_conversation_data = {
            "title": "Test Seller Communication",
            "description": "Testing the new seller communication system functionality",
            "targetUsername": "admin_test",  # Try to create conversation with admin
            "priority": "Medium"
        }
        
        success, create_response = self.run_test(
            "Create New Conversation",
            "POST",
            "communication/create-dispute",
            200,
            data=test_conversation_data
        )
        
        # If conversation was created successfully, test messaging
        if success and 'data' in create_response:
            conversation_id = create_response['data']['DisputeID']
            
            # Test get messages for the conversation
            self.run_test(
                "Get Conversation Messages",
                "GET",
                f"communication/conversation/{conversation_id}/messages",
                200
            )
            
            # Test send message
            message_data = {
                "message": "Hello! This is a test message from the seller communication system.",
                "messageType": "message"
            }
            
            self.run_test(
                "Send Message in Conversation",
                "POST",
                f"communication/conversation/{conversation_id}/send-message",
                200,
                data=message_data
            )
            
            # Test get messages again to verify message was sent
            self.run_test(
                "Get Updated Conversation Messages",
                "GET",
                f"communication/conversation/{conversation_id}/messages",
                200
            )
        else:
            self.log_test("Conversation Messaging Tests", False, "Could not create test conversation, skipping message tests")

    def test_comprehensive_api_endpoints(self):
        """Test comprehensive API endpoints"""
        print("\n🔧 Testing Comprehensive API Endpoints...")
        
        # Test cart functionality
        self.run_test("Get Cart", "GET", "cart/view", 404)  # Empty cart expected
        
        # Test orders
        self.run_test("Get User Orders", "GET", "orders/user", 400)  # No orders expected
        
        # Test categories
        self.run_test("Get Categories", "GET", "category", 200)
        
        # Test product image endpoint
        success, products_response = self.run_test("Get Products for Image Test", "GET", "products", 200)
        if success and 'data' in products_response and len(products_response['data']) > 0:
            product_id = products_response['data'][0]['ProductID']
            self.run_test(
                "Get Product Image",
                "GET",
                f"products/image/{product_id}",
                200
            )
        
        # Test recommendation endpoints
        self.run_test("Get User Recommendations", "GET", "products/recommendations/user?limit=5", 200)
        self.run_test("Get Trending Recommendations", "GET", "products/recommendations/trending?limit=5", 200)
        
        # Test specific product endpoint
        if success and 'data' in products_response and len(products_response['data']) > 0:
            product_id = products_response['data'][0]['ProductID']
            self.run_test(
                "Get Single Product",
                "GET",
                f"products/product/{product_id}",
                200
            )
            
            # Test product recommendations
            self.run_test(
                "Get Product Recommendations",
                "GET",
                f"products/recommendations/product/{product_id}?limit=5",
                200
            )

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting E-Pasar Backend API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity
        self.test_basic_endpoints()
        
        # Test login with provided credentials
        print("\n🔐 Testing Authentication...")
        login_success = self.test_login("seller_test", "seller123")
        
        if login_success:
            print("✅ Login successful, proceeding with authenticated tests...")
            
            # Test new AI features
            self.test_ai_category_verification()
            self.test_ai_image_generation()
            self.test_product_view_counter()
            self.test_communication_system()
            self.test_comprehensive_api_endpoints()
        else:
            print("❌ Login failed, testing only public endpoints...")
            # Test what we can without authentication
            self.test_product_view_counter()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    # Try localhost first, then check if there are other endpoints
    tester = EPasarAPITester("http://localhost:8001")
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())