#!/usr/bin/env python3
"""
E-Pasar Agricultural Marketplace - New Products Testing
Tests the 8 new agricultural products mentioned in the review request:
- Fruits (2): Fresh Red Apples, Sweet Valencia Oranges  
- Vegetables (2): Organic Baby Carrots, Fresh Baby Spinach
- Seeds (2): Premium Sunflower Seeds, Organic Chia Seeds
- Spices (2): Ceylon Cinnamon Sticks, Golden Turmeric Powder
"""

import requests
import sys
import json
from datetime import datetime

class NewProductsTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Expected products based on review request
        self.expected_products = [
            {"name": "Fresh Red Apples", "category": "Fruits"},
            {"name": "Sweet Valencia Oranges", "category": "Fruits"},
            {"name": "Organic Baby Carrots", "category": "Vegetables"},
            {"name": "Fresh Baby Spinach", "category": "Vegetables"},
            {"name": "Premium Sunflower Seeds", "category": "Seeds"},
            {"name": "Organic Chia Seeds", "category": "Seeds"},
            {"name": "Ceylon Cinnamon Sticks", "category": "Spices"},
            {"name": "Golden Turmeric Powder", "category": "Spices"}
        ]

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

    def test_products_endpoint(self):
        """Test the main products endpoint"""
        print("\n🔍 Testing Products Endpoint...")
        
        try:
            response = requests.get(f"{self.base_url}/products")
            
            if response.status_code == 200:
                data = response.json()
                products = data.get('data', [])
                
                self.log_test(
                    "Products Endpoint Status", 
                    True, 
                    f"Status: {response.status_code}, Found {len(products)} products",
                    {"product_count": len(products), "products": products}
                )
                
                # Check if we have exactly 8 products
                if len(products) == 8:
                    self.log_test("Product Count", True, "Exactly 8 products found as expected")
                else:
                    self.log_test("Product Count", False, f"Expected 8 products, found {len(products)}")
                
                return True, products
            else:
                self.log_test("Products Endpoint Status", False, f"Status: {response.status_code}")
                return False, []
                
        except Exception as e:
            self.log_test("Products Endpoint Status", False, f"Request failed: {str(e)}")
            return False, []

    def test_product_names(self, products):
        """Test if the expected product names are present"""
        print("\n📝 Testing Product Names...")
        
        if not products:
            self.log_test("Product Names", False, "No products to test")
            return
        
        found_products = []
        product_names = [p.get('ProductName', '') for p in products]
        
        for expected in self.expected_products:
            found = False
            for product_name in product_names:
                if expected['name'].lower() in product_name.lower() or product_name.lower() in expected['name'].lower():
                    found = True
                    found_products.append(expected['name'])
                    break
            
            if found:
                self.log_test(f"Product: {expected['name']}", True, "Found in product list")
            else:
                self.log_test(f"Product: {expected['name']}", False, "Not found in product list")
        
        print(f"\n📊 Product Names Summary: {len(found_products)}/8 expected products found")
        print(f"Actual product names: {product_names}")

    def test_categories_endpoint(self):
        """Test the categories endpoint"""
        print("\n🏷️ Testing Categories Endpoint...")
        
        try:
            response = requests.get(f"{self.base_url}/category")
            
            if response.status_code == 200:
                data = response.json()
                categories = data.get('data', [])
                
                self.log_test(
                    "Categories Endpoint", 
                    True, 
                    f"Status: {response.status_code}, Found {len(categories)} categories",
                    {"categories": categories}
                )
                
                # Check for expected categories
                expected_categories = ["Fruits", "Vegetables", "Seeds", "Spices"]
                category_names = [c.get('CategoryName', '') for c in categories]
                
                for expected_cat in expected_categories:
                    if any(expected_cat.lower() in cat.lower() for cat in category_names):
                        self.log_test(f"Category: {expected_cat}", True, "Found in categories")
                    else:
                        self.log_test(f"Category: {expected_cat}", False, "Not found in categories")
                
                return True, categories
            else:
                self.log_test("Categories Endpoint", False, f"Status: {response.status_code}")
                return False, []
                
        except Exception as e:
            self.log_test("Categories Endpoint", False, f"Request failed: {str(e)}")
            return False, []

    def test_product_images(self, products):
        """Test product image endpoints for all products"""
        print("\n🖼️ Testing Product Images...")
        
        if not products:
            self.log_test("Product Images", False, "No products to test images for")
            return
        
        for product in products:
            product_id = product.get('ProductID')
            product_name = product.get('ProductName', 'Unknown')
            
            if product_id:
                try:
                    response = requests.get(f"{self.base_url}/products/image/{product_id}")
                    
                    if response.status_code == 200:
                        # Check if it's actually an image
                        content_type = response.headers.get('content-type', '')
                        if 'image' in content_type:
                            self.log_test(
                                f"Image for {product_name} (ID: {product_id})", 
                                True, 
                                f"Image loaded successfully, Content-Type: {content_type}"
                            )
                        else:
                            self.log_test(
                                f"Image for {product_name} (ID: {product_id})", 
                                False, 
                                f"Response not an image, Content-Type: {content_type}"
                            )
                    else:
                        self.log_test(
                            f"Image for {product_name} (ID: {product_id})", 
                            False, 
                            f"Status: {response.status_code}"
                        )
                        
                except Exception as e:
                    self.log_test(
                        f"Image for {product_name} (ID: {product_id})", 
                        False, 
                        f"Request failed: {str(e)}"
                    )

    def test_category_filtering(self, categories):
        """Test category filtering functionality"""
        print("\n🔍 Testing Category Filtering...")
        
        if not categories:
            self.log_test("Category Filtering", False, "No categories to test")
            return
        
        for category in categories:
            category_id = category.get('CategoryID')
            category_name = category.get('CategoryName', 'Unknown')
            
            if category_id:
                try:
                    response = requests.get(f"{self.base_url}/products/category/{category_id}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        products = data.get('data', [])
                        self.log_test(
                            f"Category Filter: {category_name} (ID: {category_id})", 
                            True, 
                            f"Found {len(products)} products in category"
                        )
                    else:
                        self.log_test(
                            f"Category Filter: {category_name} (ID: {category_id})", 
                            False, 
                            f"Status: {response.status_code}"
                        )
                        
                except Exception as e:
                    self.log_test(
                        f"Category Filter: {category_name} (ID: {category_id})", 
                        False, 
                        f"Request failed: {str(e)}"
                    )

    def test_individual_products(self, products):
        """Test individual product endpoints"""
        print("\n🔍 Testing Individual Product Endpoints...")
        
        if not products:
            self.log_test("Individual Products", False, "No products to test")
            return
        
        for product in products[:3]:  # Test first 3 products to avoid too many requests
            product_id = product.get('ProductID')
            product_name = product.get('ProductName', 'Unknown')
            
            if product_id:
                try:
                    response = requests.get(f"{self.base_url}/products/product/{product_id}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        product_data = data.get('data', {})
                        self.log_test(
                            f"Individual Product: {product_name} (ID: {product_id})", 
                            True, 
                            f"Product details loaded successfully"
                        )
                    else:
                        self.log_test(
                            f"Individual Product: {product_name} (ID: {product_id})", 
                            False, 
                            f"Status: {response.status_code}"
                        )
                        
                except Exception as e:
                    self.log_test(
                        f"Individual Product: {product_name} (ID: {product_id})", 
                        False, 
                        f"Request failed: {str(e)}"
                    )

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting E-Pasar New Products Testing")
        print(f"📡 Testing against: {self.base_url}")
        print("🎯 Focus: 8 New Agricultural Products")
        print("=" * 60)
        
        # Test main products endpoint
        success, products = self.test_products_endpoint()
        
        if success and products:
            # Test product names
            self.test_product_names(products)
            
            # Test product images
            self.test_product_images(products)
            
            # Test individual products
            self.test_individual_products(products)
        
        # Test categories
        success, categories = self.test_categories_endpoint()
        
        if success and categories:
            # Test category filtering
            self.test_category_filtering(categories)
        
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
    tester = NewProductsTester("http://localhost:8001")
    
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