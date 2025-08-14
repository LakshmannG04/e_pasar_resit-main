#!/usr/bin/env python3
"""
E-Pasar Agricultural Marketplace - AI Features Testing
Tests the three key AI-powered features mentioned in the review request:
1. Category Verification System - POST /products/suggest-category
2. Image Generation System - POST /products/generate-image & POST /products/image-options
3. Product Recommendation System - All recommendation endpoints
"""

import requests
import sys
import json
from datetime import datetime

class EPasarAITester:
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
            print(f"🔗 Testing URL: {url}")
            
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
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}", response_json)
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

    def create_test_user(self):
        """Login with existing test seller user"""
        print("\n👤 Logging in with test seller user...")
        
        # Try to login with existing seller_test user
        return self.test_login("seller_test", "seller123")

    def test_ai_category_verification(self):
        """Test AI Category Verification System"""
        print("\n🤖 Testing AI Category Verification System...")
        
        # Test 1: Fresh Red Apple (should suggest Fruits)
        test_data_apple = {
            "productName": "Fresh Red Apple",
            "description": "Sweet and crunchy apple perfect for snacking"
        }
        
        success, response = self.run_test(
            "Category Verification - Fresh Red Apple",
            "POST",
            "products/suggest-category",
            200,
            data=test_data_apple
        )
        
        if success and 'data' in response:
            data = response['data']
            if 'suggestedCategory' in data and 'confidence' in data:
                category_name = data.get('categoryName', 'Unknown')
                confidence = data.get('confidence', 0)
                matched_keywords = data.get('matchedKeywords', [])
                
                print(f"   📊 Suggested Category: {category_name} (ID: {data['suggestedCategory']})")
                print(f"   📊 Confidence Score: {confidence}%")
                print(f"   📊 Matched Keywords: {', '.join(matched_keywords)}")
                
                # Verify it suggests Fruits category (ID: 1)
                if data['suggestedCategory'] == 1 and confidence > 50:
                    self.log_test("Apple Category Accuracy", True, f"Correctly suggested Fruits with {confidence}% confidence")
                else:
                    self.log_test("Apple Category Accuracy", False, f"Expected Fruits category with high confidence, got {category_name} with {confidence}%")
            else:
                self.log_test("Category Response Format", False, "Missing required fields in category suggestion response")
        
        # Test 2: Organic Carrot (should suggest Vegetables)
        test_data_carrot = {
            "productName": "Organic Carrot",
            "description": "Fresh organic carrots grown locally, perfect for cooking and salads"
        }
        
        success, response = self.run_test(
            "Category Verification - Organic Carrot",
            "POST",
            "products/suggest-category",
            200,
            data=test_data_carrot
        )
        
        if success and 'data' in response:
            data = response['data']
            if 'suggestedCategory' in data:
                category_name = data.get('categoryName', 'Unknown')
                confidence = data.get('confidence', 0)
                
                print(f"   📊 Suggested Category: {category_name} (ID: {data['suggestedCategory']})")
                print(f"   📊 Confidence Score: {confidence}%")
                
                # Verify it suggests Vegetables category (ID: 2)
                if data['suggestedCategory'] == 2 and confidence > 50:
                    self.log_test("Carrot Category Accuracy", True, f"Correctly suggested Vegetables with {confidence}% confidence")
                else:
                    self.log_test("Carrot Category Accuracy", False, f"Expected Vegetables category with high confidence, got {category_name} with {confidence}%")

        # Test 3: Get available categories info
        success, response = self.run_test(
            "Get Categories Information",
            "GET",
            "products/categories-info",
            200
        )
        
        if success and 'data' in response:
            categories = response['data']
            if isinstance(categories, list) and len(categories) > 0:
                print(f"   📊 Available Categories: {len(categories)}")
                for cat in categories:
                    print(f"      - {cat.get('name', 'Unknown')} (ID: {cat.get('id', 'N/A')})")
                self.log_test("Categories Info Retrieval", True, f"Retrieved {len(categories)} categories with keywords")
            else:
                self.log_test("Categories Info Format", False, "Categories info response is not in expected format")

    def test_ai_image_generation(self):
        """Test AI Image Generation System"""
        print("\n🖼️ Testing AI Image Generation System...")
        
        # Test 1: Generate single image for Organic Carrot
        test_data_single = {
            "productName": "Organic Carrot",
            "category": "Vegetables"
        }
        
        success, response = self.run_test(
            "Generate Single Image - Organic Carrot",
            "POST",
            "products/generate-image",
            200,
            data=test_data_single
        )
        
        if success and 'data' in response:
            data = response['data']
            if 'imagePath' in data and 'imageInfo' in data:
                image_path = data['imagePath']
                image_info = data['imageInfo']
                
                print(f"   📸 Generated Image: {image_path}")
                print(f"   📸 Photographer: {image_info.get('photographer', 'Unknown')}")
                print(f"   📸 Source: {image_info.get('source', 'Unknown')}")
                
                # Check if it's a real Unsplash image or demo
                if image_info.get('source') == 'Unsplash API':
                    self.log_test("Real Image Generation", True, f"Successfully generated real image from Unsplash by {image_info.get('photographer')}")
                elif image_info.get('source') == 'Demo Mode':
                    self.log_test("Demo Image Generation", True, f"Fallback demo image generated (Unsplash API unavailable)")
                    print(f"   ⚠️ Note: {image_info.get('note', 'Demo mode active')}")
                else:
                    self.log_test("Image Generation Response", False, "Unexpected image generation response format")
            else:
                self.log_test("Image Generation Format", False, "Missing required fields in image generation response")
        
        # Test 2: Get multiple image options
        test_data_options = {
            "productName": "Fresh Organic Tomatoes",
            "category": "Vegetables",
            "count": 3
        }
        
        success, response = self.run_test(
            "Get Multiple Image Options - Tomatoes",
            "POST",
            "products/image-options",
            200,
            data=test_data_options
        )
        
        if success and 'data' in response:
            image_options = response['data']
            if isinstance(image_options, list):
                print(f"   📸 Retrieved {len(image_options)} image options")
                for i, option in enumerate(image_options[:3]):  # Show first 3
                    print(f"      Option {i+1}: {option.get('description', 'No description')} by {option.get('photographer', 'Unknown')}")
                
                if len(image_options) >= 3:
                    self.log_test("Multiple Image Options", True, f"Successfully retrieved {len(image_options)} image options")
                else:
                    self.log_test("Image Options Count", False, f"Expected at least 3 options, got {len(image_options)}")
            else:
                self.log_test("Image Options Format", False, "Image options response is not in expected list format")

    def test_product_recommendations(self):
        """Test Product Recommendation System"""
        print("\n🎯 Testing Product Recommendation System...")
        
        # First, get some products to work with
        success, products_response = self.run_test("Get Products for Recommendations", "GET", "products", 200)
        
        if not success or 'data' not in products_response or len(products_response['data']) == 0:
            self.log_test("Product Recommendations Setup", False, "No products available for recommendation testing")
            return
        
        products = products_response['data']
        product_id = products[0]['ProductID']
        
        # Test 1: Get trending recommendations
        success, response = self.run_test(
            "Get Trending Recommendations",
            "GET",
            "products/recommendations/trending?limit=5",
            200
        )
        
        if success and 'data' in response:
            data = response['data']
            if 'recommendations' in data and isinstance(data['recommendations'], list):
                recommendations = data['recommendations']
                print(f"   🔥 Trending Products: {len(recommendations)} items")
                print(f"   🔥 Recommendation Type: {data.get('recommendationType', 'Unknown')}")
                print(f"   🔥 Timeframe: {data.get('timeframe', 'Unknown')}")
                
                if len(recommendations) > 0:
                    self.log_test("Trending Recommendations", True, f"Retrieved {len(recommendations)} trending products")
                    # Show sample products
                    for i, prod in enumerate(recommendations[:3]):
                        print(f"      {i+1}. {prod.get('ProductName', 'Unknown')} - ${prod.get('Price', 'N/A')}")
                else:
                    self.log_test("Trending Recommendations Count", False, "No trending recommendations returned")
            else:
                self.log_test("Trending Recommendations Format", False, "Trending recommendations response format is incorrect")
        
        # Test 2: Get category-based recommendations (Category ID: 1 - Fruits)
        success, response = self.run_test(
            "Get Category Recommendations - Fruits",
            "GET",
            "products/recommendations/category/1?limit=5",
            200
        )
        
        if success and 'data' in response:
            data = response['data']
            if 'recommendations' in data:
                recommendations = data['recommendations']
                category_name = data.get('category', 'Unknown')
                
                print(f"   🍎 Category: {category_name}")
                print(f"   🍎 Products: {len(recommendations)} items")
                
                if len(recommendations) > 0:
                    self.log_test("Category Recommendations", True, f"Retrieved {len(recommendations)} products from {category_name} category")
                else:
                    self.log_test("Category Recommendations Count", False, f"No recommendations found for {category_name} category")
            else:
                self.log_test("Category Recommendations Format", False, "Category recommendations response format is incorrect")
        
        # Test 3: Get user-based recommendations (requires authentication)
        if self.token:
            success, response = self.run_test(
                "Get User Recommendations",
                "GET",
                "products/recommendations/user?limit=5",
                200
            )
            
            if success and 'data' in response:
                data = response['data']
                if 'recommendations' in data:
                    recommendations = data['recommendations']
                    based_on = data.get('basedOn', 'Unknown')
                    
                    print(f"   👤 User Recommendations: {len(recommendations)} items")
                    print(f"   👤 Based On: {based_on}")
                    
                    if len(recommendations) > 0:
                        self.log_test("User Recommendations", True, f"Retrieved {len(recommendations)} personalized recommendations based on {based_on}")
                    else:
                        self.log_test("User Recommendations Count", False, "No personalized recommendations returned")
                else:
                    self.log_test("User Recommendations Format", False, "User recommendations response format is incorrect")
        else:
            self.log_test("User Recommendations Auth", False, "Cannot test user recommendations without authentication")
        
        # Test 4: Get product-based recommendations
        success, response = self.run_test(
            "Get Product-Based Recommendations",
            "GET",
            f"products/recommendations/product/{product_id}?limit=5",
            200
        )
        
        if success and 'data' in response:
            data = response['data']
            if 'recommendations' in data and 'baseProduct' in data:
                recommendations = data['recommendations']
                base_product = data['baseProduct']
                
                print(f"   🔗 Base Product: {base_product.get('ProductName', 'Unknown')}")
                print(f"   🔗 Similar Products: {len(recommendations)} items")
                
                if len(recommendations) > 0:
                    self.log_test("Product-Based Recommendations", True, f"Retrieved {len(recommendations)} similar products")
                else:
                    self.log_test("Product-Based Recommendations Count", False, "No similar products found")
            else:
                self.log_test("Product-Based Recommendations Format", False, "Product-based recommendations response format is incorrect")

    def run_ai_tests(self):
        """Run all AI feature tests"""
        print("🚀 Starting E-Pasar AI Features Testing")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Create/login test user for authenticated endpoints
        print("\n🔐 Setting up authentication...")
        login_success, user_auth = self.create_test_user()
        
        if login_success:
            print(f"✅ Authentication successful - UserAuth: {user_auth}")
        else:
            print("⚠️ Authentication failed, testing only public endpoints...")
        
        # Test AI Category Verification System
        if login_success:  # Requires Seller authentication
            self.test_ai_category_verification()
        else:
            print("\n⚠️ Skipping Category Verification tests (requires Seller authentication)")
        
        # Test AI Image Generation System
        if login_success:  # Requires Seller authentication
            self.test_ai_image_generation()
        else:
            print("\n⚠️ Skipping Image Generation tests (requires Seller authentication)")
        
        # Test Product Recommendation System
        self.test_product_recommendations()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 AI Features Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
        
        # Print summary by feature
        print("\n📋 Feature Summary:")
        category_tests = [r for r in self.test_results if 'Category' in r['test']]
        image_tests = [r for r in self.test_results if 'Image' in r['test']]
        recommendation_tests = [r for r in self.test_results if 'Recommendation' in r['test']]
        
        if category_tests:
            passed_cat = len([t for t in category_tests if t['success']])
            print(f"   🤖 Category Verification: {passed_cat}/{len(category_tests)} tests passed")
        
        if image_tests:
            passed_img = len([t for t in image_tests if t['success']])
            print(f"   🖼️ Image Generation: {passed_img}/{len(image_tests)} tests passed")
        
        if recommendation_tests:
            passed_rec = len([t for t in recommendation_tests if t['success']])
            print(f"   🎯 Recommendations: {passed_rec}/{len(recommendation_tests)} tests passed")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = EPasarAITester("http://localhost:8001")
    
    try:
        success = tester.run_ai_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())