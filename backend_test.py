#!/usr/bin/env python3
"""
E-Pasar Agricultural Marketplace - Enhanced Product Verification Testing
Tests the enhanced agricultural product verification system:
1. Forbidden Product Detection (Chair - should be REJECTED)
2. Low Agricultural Match Detection (Random Item - should be REJECTED)  
3. Valid Agricultural Product Approval (Fresh Organic Apples - should be APPROVED)
4. Product Creation with Forbidden Item (should be blocked)
5. Product Creation with Valid Agricultural Item (should succeed)
6. Enhanced suggest-category endpoint with approval status
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
            print(f"🔗 Testing URL: {url}")  # Debug URL
            
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
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:100]}", response_json)
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

    def test_enhanced_product_verification(self):
        """Test the enhanced agricultural product verification system"""
        print("\n🔍 Testing Enhanced Agricultural Product Verification System...")
        
        # Test 1: Forbidden Product (Chair) - Should be REJECTED
        print("\n--- Test 1: Forbidden Product (Chair) ---")
        forbidden_data = {
            "productName": "Office Chair",
            "description": "Comfortable swivel chair for office use"
        }
        
        success, response = self.run_test(
            "Forbidden Product Verification (Chair)",
            "POST",
            "products/verify-product",
            200,
            data=forbidden_data
        )
        
        if success and 'data' in response:
            verification_data = response['data']
            if not verification_data.get('approved', True):
                if verification_data.get('reason') == 'FORBIDDEN_PRODUCT':
                    forbidden_keywords = verification_data.get('forbiddenKeywords', [])
                    if 'chair' in forbidden_keywords:
                        self.log_test(
                            "Forbidden Keywords Detection", 
                            True, 
                            f"Correctly detected forbidden keywords: {forbidden_keywords}"
                        )
                    else:
                        self.log_test(
                            "Forbidden Keywords Detection", 
                            False, 
                            f"Expected 'chair' in forbidden keywords, got: {forbidden_keywords}"
                        )
                else:
                    self.log_test(
                        "Forbidden Product Rejection Reason", 
                        False, 
                        f"Expected FORBIDDEN_PRODUCT, got: {verification_data.get('reason')}"
                    )
            else:
                self.log_test(
                    "Forbidden Product Rejection", 
                    False, 
                    "Chair should have been rejected but was approved"
                )
        
        # Test 2: Low Agricultural Match - Should be REJECTED
        print("\n--- Test 2: Low Agricultural Match ---")
        low_match_data = {
            "productName": "Random Item",
            "description": "Some generic product description"
        }
        
        success, response = self.run_test(
            "Low Agricultural Match Verification",
            "POST",
            "products/verify-product",
            200,
            data=low_match_data
        )
        
        if success and 'data' in response:
            verification_data = response['data']
            if not verification_data.get('approved', True):
                if verification_data.get('reason') == 'LOW_AGRICULTURAL_MATCH':
                    confidence = verification_data.get('confidence', 100)
                    if confidence < 25:  # Below minimum threshold
                        self.log_test(
                            "Low Confidence Rejection", 
                            True, 
                            f"Correctly rejected with low confidence: {confidence}%"
                        )
                    else:
                        self.log_test(
                            "Low Confidence Rejection", 
                            False, 
                            f"Confidence too high for rejection: {confidence}%"
                        )
                else:
                    self.log_test(
                        "Low Match Rejection Reason", 
                        False, 
                        f"Expected LOW_AGRICULTURAL_MATCH, got: {verification_data.get('reason')}"
                    )
            else:
                self.log_test(
                    "Low Agricultural Match Rejection", 
                    False, 
                    "Random item should have been rejected but was approved"
                )
        
        # Test 3: Valid Agricultural Product - Should be APPROVED
        print("\n--- Test 3: Valid Agricultural Product ---")
        valid_data = {
            "productName": "Fresh Organic Apples",
            "description": "Sweet red apples freshly harvested from our orchard"
        }
        
        success, response = self.run_test(
            "Valid Agricultural Product Verification",
            "POST",
            "products/verify-product",
            200,
            data=valid_data
        )
        
        if success and 'data' in response:
            verification_data = response['data']
            if verification_data.get('approved', False):
                confidence = verification_data.get('confidence', 0)
                if confidence >= 25:  # Above minimum threshold
                    matched_keywords = verification_data.get('matchedKeywords', [])
                    expected_keywords = ['apple', 'fresh', 'organic', 'harvest', 'orchard']
                    found_keywords = [kw for kw in expected_keywords if kw in matched_keywords]
                    
                    self.log_test(
                        "Valid Product Approval", 
                        True, 
                        f"Correctly approved with {confidence}% confidence, matched keywords: {found_keywords}"
                    )
                    
                    # Check suggested category
                    suggested_category = verification_data.get('suggestedCategory')
                    if suggested_category == 1:  # Fruits category
                        self.log_test(
                            "Category Suggestion Accuracy", 
                            True, 
                            f"Correctly suggested Fruits category (ID: {suggested_category})"
                        )
                    else:
                        self.log_test(
                            "Category Suggestion Accuracy", 
                            False, 
                            f"Expected Fruits category (1), got: {suggested_category}"
                        )
                else:
                    self.log_test(
                        "Valid Product Confidence", 
                        False, 
                        f"Confidence too low for valid product: {confidence}%"
                    )
            else:
                self.log_test(
                    "Valid Agricultural Product Approval", 
                    False, 
                    "Fresh organic apples should have been approved but was rejected"
                )

    def test_product_creation_with_verification(self):
        """Test product creation with enhanced verification"""
        print("\n🏭 Testing Product Creation with Enhanced Verification...")
        
        # Test 4: Try to create product with forbidden item (Chair)
        print("\n--- Test 4: Product Creation with Forbidden Item ---")
        forbidden_product_data = {
            "productName": "Office Chair",
            "description": "Comfortable swivel chair for office use",
            "price": 150.00,
            "category": 1,  # Fruits category (wrong category for chair)
            "MOQ": 1,
            "availableQty": 10
        }
        
        success, response = self.run_test(
            "Create Product with Forbidden Item",
            "POST",
            "products",
            422,  # Should return 422 with detailed error
            data=forbidden_product_data
        )
        
        if success and response.get('status') == 422:
            error_details = response.get('details', {})
            if error_details.get('reason') == 'FORBIDDEN_PRODUCT':
                forbidden_keywords = error_details.get('forbiddenKeywords', [])
                self.log_test(
                    "Product Creation Blocked - Forbidden Item", 
                    True, 
                    f"Correctly blocked forbidden product with keywords: {forbidden_keywords}"
                )
            else:
                self.log_test(
                    "Product Creation Block Reason", 
                    False, 
                    f"Expected FORBIDDEN_PRODUCT reason, got: {error_details.get('reason')}"
                )
        
        # Test 5: Create product with valid agricultural item
        print("\n--- Test 5: Product Creation with Valid Agricultural Item ---")
        # Use timestamp to ensure unique product name
        timestamp = int(datetime.now().timestamp())
        valid_product_data = {
            "productName": f"Fresh Organic Tomatoes {timestamp}",
            "description": "Locally grown organic tomatoes, perfect for cooking and salads. Rich in vitamins and minerals.",
            "price": 5.99,
            "category": 2,  # Vegetables category
            "MOQ": 1,
            "availableQty": 50
        }
        
        success, response = self.run_test(
            "Create Product with Valid Agricultural Item",
            "POST",
            "products",
            200,
            data=valid_product_data
        )
        
        if success and 'data' in response:
            product_data = response['data']
            verification_info = product_data.get('verification', {})
            
            if verification_info.get('approved', False):
                confidence = verification_info.get('confidence', 0)
                matched_keywords = verification_info.get('matchedKeywords', [])
                
                self.log_test(
                    "Valid Product Creation Success", 
                    True, 
                    f"Product created successfully with {confidence}% confidence, keywords: {matched_keywords[:5]}"
                )
                
                # Store product ID for cleanup if needed
                self.created_product_id = product_data.get('ProductID')
            else:
                self.log_test(
                    "Valid Product Creation Verification", 
                    False, 
                    "Valid agricultural product was not approved during creation"
                )

    def test_enhanced_suggest_category(self):
        """Test the enhanced suggest-category endpoint with approval status"""
        print("\n🎯 Testing Enhanced Suggest-Category Endpoint...")
        
        # Test 6: Enhanced suggest-category with approval status
        test_data = {
            "productName": "Fresh Organic Carrots",
            "description": "Crunchy orange carrots grown organically on our farm"
        }
        
        success, response = self.run_test(
            "Enhanced Suggest-Category with Approval",
            "POST",
            "products/suggest-category",
            200,
            data=test_data
        )
        
        if success and 'data' in response:
            suggestion_data = response['data']
            
            # Check if approval status is included
            if 'approved' in suggestion_data:
                approved = suggestion_data.get('approved', False)
                confidence = suggestion_data.get('confidence', 0)
                suggested_category = suggestion_data.get('suggestedCategory')
                
                if approved and confidence >= 25:
                    self.log_test(
                        "Enhanced Suggest-Category Approval", 
                        True, 
                        f"Correctly approved with {confidence}% confidence, suggested category: {suggested_category}"
                    )
                    
                    # Check backward compatibility fields
                    legacy_fields = ['suggestedCategory', 'confidence', 'reason', 'categoryName']
                    missing_fields = [field for field in legacy_fields if field not in suggestion_data]
                    
                    if not missing_fields:
                        self.log_test(
                            "Backward Compatibility", 
                            True, 
                            "All legacy fields present for backward compatibility"
                        )
                    else:
                        self.log_test(
                            "Backward Compatibility", 
                            False, 
                            f"Missing legacy fields: {missing_fields}"
                        )
                else:
                    self.log_test(
                        "Enhanced Suggest-Category Approval", 
                        False, 
                        f"Valid carrots should be approved, got approved={approved}, confidence={confidence}%"
                    )
            else:
                self.log_test(
                    "Enhanced Suggest-Category Format", 
                    False, 
                    "Enhanced suggest-category should include approval status"
                )

    def test_confidence_threshold_enforcement(self):
        """Test that the minimum confidence threshold (25%) is properly enforced"""
        print("\n📊 Testing Confidence Threshold Enforcement...")
        
        # Test with borderline agricultural terms
        borderline_data = {
            "productName": "Green Thing",
            "description": "A green colored item"
        }
        
        success, response = self.run_test(
            "Borderline Confidence Test",
            "POST",
            "products/verify-product",
            200,
            data=borderline_data
        )
        
        if success and 'data' in response:
            verification_data = response['data']
            confidence = verification_data.get('confidence', 0)
            approved = verification_data.get('approved', True)
            
            # Should be rejected due to low confidence
            if confidence < 25 and not approved:
                self.log_test(
                    "Minimum Confidence Threshold Enforcement", 
                    True, 
                    f"Correctly rejected low confidence product: {confidence}%"
                )
            elif confidence >= 25 and approved:
                self.log_test(
                    "Minimum Confidence Threshold Enforcement", 
                    True, 
                    f"Correctly approved product above threshold: {confidence}%"
                )
            else:
                self.log_test(
                    "Minimum Confidence Threshold Enforcement", 
                    False, 
                    f"Threshold enforcement inconsistent: confidence={confidence}%, approved={approved}"
                )

    def run_all_verification_tests(self):
        """Run all enhanced verification tests"""
        print("🚀 Starting Enhanced Agricultural Product Verification Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Login as seller to test protected endpoints
        print("\n🔐 Authenticating as Seller...")
        login_success, user_auth = self.test_login("seller_test", "seller123")
        
        if not login_success:
            print("❌ Failed to authenticate as seller. Cannot test protected endpoints.")
            return False
        
        print(f"✅ Authenticated as {user_auth}")
        
        # Run all verification tests
        self.test_enhanced_product_verification()
        self.test_product_creation_with_verification()
        self.test_enhanced_suggest_category()
        self.test_confidence_threshold_enforcement()
        
        # Print final results
        print("\n" + "=" * 80)
        print(f"📊 Enhanced Verification Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
        else:
            print("\n🎉 All enhanced verification tests passed!")
        
        return len(failed_tests) == 0

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

    def test_buyer_authentication_flow(self):
        """Test buyer authentication and communication access"""
        print("\n🔐 Testing Buyer Authentication Flow...")
        
        # Test buyer login
        login_success, user_auth = self.test_login("buyer_test", "buyer123")
        
        if not login_success:
            self.log_test("Buyer Authentication", False, "Failed to login with buyer_test credentials")
            return False
            
        if user_auth != "Buyer":
            self.log_test("Buyer Role Verification", False, f"Expected 'Buyer' role, got '{user_auth}'")
            return False
            
        self.log_test("Buyer Role Verification", True, f"User authenticated as {user_auth}")
        
        # Test profile access
        success, profile_response = self.run_test(
            "Get Buyer Profile",
            "GET",
            "profile",
            200
        )
        
        if success:
            profile_data = profile_response.get('data', {})
            self.log_test("Profile Access", True, f"Profile loaded for user: {profile_data.get('Username', 'Unknown')}")
        
        return True
        """Test Enhanced Communication System - Buyer Communication Focus"""
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

    def test_seller_information_feature(self):
        """Test Seller Information Feature on Product Pages"""
        print("\n👤 Testing Seller Information Feature...")
        
        # Save current token and test without authentication first
        saved_token = self.token
        self.token = None
        
        # Test specific product with seller information (ProductID: 1)
        success, product_response = self.run_test(
            "Get Product with Seller Info (ProductID: 1) - No Auth",
            "GET",
            "products/product/1",
            200
        )
        
        # Restore token
        self.token = saved_token
        
        if success and 'data' in product_response:
            product_data = product_response['data']
            
            # Verify seller information is present
            if 'Seller' in product_data and product_data['Seller']:
                seller_info = product_data['Seller']
                
                # Check required seller fields
                required_fields = ['UserID', 'Username', 'FirstName', 'LastName', 'UserAuth']
                missing_fields = []
                
                for field in required_fields:
                    if field not in seller_info or seller_info[field] is None:
                        missing_fields.append(field)
                
                if not missing_fields:
                    self.log_test(
                        "Seller Information Completeness", 
                        True, 
                        f"All seller fields present: Username={seller_info['Username']}, Name={seller_info['FirstName']} {seller_info['LastName']}, Role={seller_info['UserAuth']}"
                    )
                    
                    # Verify expected test data
                    if (seller_info['Username'] == 'seller_test' and 
                        seller_info['FirstName'] == 'Test' and 
                        seller_info['LastName'] == 'Seller' and 
                        seller_info['UserAuth'] == 'Seller'):
                        self.log_test(
                            "Test Seller Data Verification", 
                            True, 
                            "Test seller data matches expected values"
                        )
                    else:
                        self.log_test(
                            "Test Seller Data Verification", 
                            False, 
                            f"Seller data mismatch: {seller_info}"
                        )
                else:
                    self.log_test(
                        "Seller Information Completeness", 
                        False, 
                        f"Missing seller fields: {missing_fields}"
                    )
            else:
                self.log_test(
                    "Seller Information Presence", 
                    False, 
                    "No seller information found in product response"
                )
        else:
            self.log_test(
                "Product API Response", 
                False, 
                "Failed to get product data for seller info test"
            )

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
        
        # Test buyer authentication flow
        print("\n🔐 Testing Buyer Authentication...")
        buyer_auth_success = self.test_buyer_authentication_flow()
        
        if buyer_auth_success:
            print("✅ Buyer authentication successful, proceeding with buyer-specific tests...")
            
            # Test buyer communication access
            self.test_communication_system()
            
            # Test basic endpoints that buyers should access
            self.test_basic_endpoints()
            self.test_product_view_counter()
            
            # Test seller information feature
            self.test_seller_information_feature()
        else:
            print("❌ Buyer authentication failed, testing only public endpoints...")
            # Test what we can without authentication
            self.test_basic_endpoints()
            self.test_product_view_counter()
            self.test_seller_information_feature()
        
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
    """Main test execution for enhanced verification system"""
    # Try localhost first, then check if there are other endpoints
    tester = EPasarAPITester("http://localhost:8001")
    
    try:
        success = tester.run_all_verification_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())