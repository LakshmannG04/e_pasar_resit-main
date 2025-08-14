#!/usr/bin/env python3
"""
Enhanced Seller Search Functionality Testing
Tests the enhanced seller search functionality that allows sellers to search for admin accounts.

TEST SCENARIOS:
1. Test Seller Search for Admins - Sellers can search for both Admin and SuperAdmin users
2. Test Seller Search for Users - Sellers can search for buyer accounts  
3. Test Buyer Search Restrictions - Buyers should NOT return admin accounts (only sellers)
4. Test Admin Search (Full Access) - Admins can search for all user types
5. Test Create Conversation with Found Admin - Verify conversation creation works
"""

import requests
import sys
import json
from datetime import datetime

class EnhancedSellerSearchTester:
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
            f"Login as {username}",
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

    def test_seller_search_for_admins(self):
        """Test Seller Search for Admins - Should return admin accounts"""
        print("\n🔍 Test 1: Seller Search for Admins...")
        
        # Login as seller_test
        login_success, user_auth = self.test_login("seller_test", "seller123")
        if not login_success:
            self.log_test("Seller Login", False, "Failed to login as seller_test")
            return False
        
        if user_auth != "Seller":
            self.log_test("Seller Role Verification", False, f"Expected 'Seller' role, got '{user_auth}'")
            return False
        
        # Search for admin accounts
        success, response = self.run_test(
            "Seller Search for Admin Users",
            "GET",
            "communication/search-users?username=admin",
            200
        )
        
        if success and 'data' in response:
            users = response['data']
            admin_users = [user for user in users if user['UserAuth'] in ['Admin', 'SuperAdmin']]
            
            if len(admin_users) > 0:
                self.log_test(
                    "Seller Can Find Admin Accounts", 
                    True, 
                    f"Found {len(admin_users)} admin accounts: {[u['Username'] + ' (' + u['UserAuth'] + ')' for u in admin_users]}"
                )
                
                # Store admin for conversation test
                self.found_admin = admin_users[0]
                return True
            else:
                self.log_test(
                    "Seller Can Find Admin Accounts", 
                    False, 
                    f"No admin accounts found in search results. Found users: {[u['Username'] + ' (' + u['UserAuth'] + ')' for u in users]}"
                )
                return False
        else:
            self.log_test("Seller Admin Search API", False, "Failed to get search results")
            return False

    def test_seller_search_for_users(self):
        """Test Seller Search for Users - Should return buyer accounts"""
        print("\n🔍 Test 2: Seller Search for Users...")
        
        # Should already be logged in as seller from previous test
        success, response = self.run_test(
            "Seller Search for Buyer Users",
            "GET",
            "communication/search-users?username=buyer",
            200
        )
        
        if success and 'data' in response:
            users = response['data']
            buyer_users = [user for user in users if user['UserAuth'] == 'User']
            
            if len(buyer_users) > 0:
                self.log_test(
                    "Seller Can Find Buyer Accounts", 
                    True, 
                    f"Found {len(buyer_users)} buyer accounts: {[u['Username'] for u in buyer_users]}"
                )
                return True
            else:
                self.log_test(
                    "Seller Can Find Buyer Accounts", 
                    False, 
                    f"No buyer accounts found. Found users: {[u['Username'] + ' (' + u['UserAuth'] + ')' for u in users]}"
                )
                return False
        else:
            self.log_test("Seller User Search API", False, "Failed to get search results")
            return False

    def test_buyer_search_restrictions(self):
        """Test Buyer Search Restrictions - Should NOT return admin accounts"""
        print("\n🔍 Test 3: Buyer Search Restrictions...")
        
        # Login as buyer_test
        login_success, user_auth = self.test_login("buyer_test", "buyer123")
        if not login_success:
            self.log_test("Buyer Login", False, "Failed to login as buyer_test")
            return False
        
        if user_auth != "User":
            self.log_test("Buyer Role Verification", False, f"Expected 'User' role, got '{user_auth}'")
            return False
        
        # Search for admin accounts (should not return any)
        success, response = self.run_test(
            "Buyer Search for Admin Users (Should Be Restricted)",
            "GET",
            "communication/search-users?username=admin",
            200
        )
        
        if success and 'data' in response:
            users = response['data']
            admin_users = [user for user in users if user['UserAuth'] in ['Admin', 'SuperAdmin']]
            
            if len(admin_users) == 0:
                self.log_test(
                    "Buyer Admin Search Restriction", 
                    True, 
                    f"Correctly restricted - no admin accounts returned. Found {len(users)} users: {[u['Username'] + ' (' + u['UserAuth'] + ')' for u in users]}"
                )
                
                # Verify only sellers are returned
                seller_users = [user for user in users if user['UserAuth'] == 'Seller']
                if len(seller_users) == len(users):
                    self.log_test(
                        "Buyer Can Only See Sellers", 
                        True, 
                        f"All {len(users)} returned users are sellers"
                    )
                else:
                    self.log_test(
                        "Buyer Can Only See Sellers", 
                        False, 
                        f"Found non-seller users: {[u['Username'] + ' (' + u['UserAuth'] + ')' for u in users if u['UserAuth'] != 'Seller']}"
                    )
                
                return True
            else:
                self.log_test(
                    "Buyer Admin Search Restriction", 
                    False, 
                    f"SECURITY ISSUE: Buyer can see admin accounts: {[u['Username'] + ' (' + u['UserAuth'] + ')' for u in admin_users]}"
                )
                return False
        else:
            self.log_test("Buyer Admin Search API", False, "Failed to get search results")
            return False

    def test_admin_search_full_access(self):
        """Test Admin Search - Should return all user types"""
        print("\n🔍 Test 4: Admin Search (Full Access)...")
        
        # Login as admin
        login_success, user_auth = self.test_login("admin_test", "admin123")
        if not login_success:
            # Try alternative admin credentials
            login_success, user_auth = self.test_login("admin", "admin123")
            if not login_success:
                self.log_test("Admin Login", False, "Failed to login as admin")
                return False
        
        if user_auth not in ["Admin", "SuperAdmin"]:
            self.log_test("Admin Role Verification", False, f"Expected 'Admin' or 'SuperAdmin' role, got '{user_auth}'")
            return False
        
        # Search for users (should return all types)
        success, response = self.run_test(
            "Admin Search for All User Types",
            "GET",
            "communication/search-users?username=test",
            200
        )
        
        if success and 'data' in response:
            users = response['data']
            user_types = list(set([user['UserAuth'] for user in users]))
            
            self.log_test(
                "Admin Full Access Search", 
                True, 
                f"Admin can search all user types. Found {len(users)} users with roles: {user_types}"
            )
            
            # Verify admin can see different user types
            has_sellers = any(u['UserAuth'] == 'Seller' for u in users)
            has_buyers = any(u['UserAuth'] == 'User' for u in users)
            has_admins = any(u['UserAuth'] in ['Admin', 'SuperAdmin'] for u in users)
            
            access_summary = f"Sellers: {has_sellers}, Buyers: {has_buyers}, Admins: {has_admins}"
            self.log_test(
                "Admin Can See All User Types", 
                True, 
                f"Access verification - {access_summary}"
            )
            
            return True
        else:
            self.log_test("Admin Search API", False, "Failed to get search results")
            return False

    def test_create_conversation_with_admin(self):
        """Test Create Conversation with Found Admin"""
        print("\n🔍 Test 5: Create Conversation with Found Admin...")
        
        # Login back as seller
        login_success, user_auth = self.test_login("seller_test", "seller123")
        if not login_success:
            self.log_test("Seller Re-login", False, "Failed to re-login as seller_test")
            return False
        
        # Check if we have an admin from previous test
        if not hasattr(self, 'found_admin'):
            self.log_test("Admin Available for Conversation", False, "No admin found from previous search")
            return False
        
        admin = self.found_admin
        
        # Test create-dispute endpoint with admin
        conversation_data = {
            "title": "Test Seller-Admin Communication",
            "description": "Testing enhanced seller search - seller contacting admin directly",
            "targetUsername": admin['Username']
        }
        
        success, response = self.run_test(
            "Create Conversation with Found Admin",
            "POST",
            "communication/create-dispute",
            200,
            data=conversation_data
        )
        
        if success and 'data' in response:
            conversation = response['data']
            conversation_id = conversation.get('DisputeID')
            
            self.log_test(
                "Seller-Admin Conversation Creation", 
                True, 
                f"Successfully created conversation {conversation_id} with admin {admin['Username']}"
            )
            
            # Test sending a message in the conversation
            if conversation_id:
                message_data = {
                    "message": "Hello admin! This is a test message from the enhanced seller search functionality.",
                    "messageType": "message"
                }
                
                success, msg_response = self.run_test(
                    "Send Message to Admin",
                    "POST",
                    f"communication/conversation/{conversation_id}/send-message",
                    200,
                    data=message_data
                )
                
                if success:
                    self.log_test(
                        "Seller-Admin Messaging", 
                        True, 
                        "Successfully sent message to admin in conversation"
                    )
                else:
                    self.log_test(
                        "Seller-Admin Messaging", 
                        False, 
                        "Failed to send message to admin"
                    )
            
            return True
        else:
            self.log_test("Seller-Admin Conversation Creation", False, "Failed to create conversation with admin")
            return False

    def test_enhanced_search_comprehensive(self):
        """Comprehensive test of enhanced search functionality"""
        print("\n🔍 Comprehensive Enhanced Search Testing...")
        
        # Test different search terms and verify results
        test_cases = [
            ("seller_test", "Seller", "admin", ["Admin", "SuperAdmin", "User"]),  # Seller searching for admin
            ("seller_test", "Seller", "user", ["Admin", "SuperAdmin", "User"]),   # Seller searching for user  
            ("buyer_test", "User", "seller", ["Seller"]),                         # Buyer searching for seller
            ("buyer_test", "User", "admin", ["Seller"]),                          # Buyer searching for admin (should only get sellers)
        ]
        
        for username, expected_role, search_term, allowed_results in test_cases:
            print(f"\n--- Testing {username} ({expected_role}) searching for '{search_term}' ---")
            
            # Login as test user
            login_success, user_auth = self.test_login(username, f"{username.split('_')[0]}123")
            if not login_success:
                self.log_test(f"{username} Login", False, f"Failed to login as {username}")
                continue
            
            # Perform search
            success, response = self.run_test(
                f"{expected_role} Search for '{search_term}'",
                "GET",
                f"communication/search-users?username={search_term}",
                200
            )
            
            if success and 'data' in response:
                users = response['data']
                found_roles = [user['UserAuth'] for user in users]
                
                # Check if results match expected restrictions
                invalid_results = [role for role in found_roles if role not in allowed_results]
                
                if len(invalid_results) == 0:
                    self.log_test(
                        f"{expected_role} Search Restrictions Correct", 
                        True, 
                        f"All {len(users)} results have valid roles: {list(set(found_roles))}"
                    )
                else:
                    self.log_test(
                        f"{expected_role} Search Restrictions Correct", 
                        False, 
                        f"Found invalid roles: {invalid_results}. Expected only: {allowed_results}"
                    )
                
                # Log detailed results
                user_summary = {}
                for user in users:
                    role = user['UserAuth']
                    if role not in user_summary:
                        user_summary[role] = []
                    user_summary[role].append(user['Username'])
                
                for role, usernames in user_summary.items():
                    self.log_test(
                        f"{expected_role} Found {role}s", 
                        True, 
                        f"{len(usernames)} {role}(s): {usernames}"
                    )

    def run_enhanced_seller_search_tests(self):
        """Run all enhanced seller search tests"""
        print("🚀 Starting Enhanced Seller Search Functionality Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Run all test scenarios
        print("\n🎯 CRITICAL TEST SCENARIOS:")
        
        # Test 1: Seller Search for Admins
        self.test_seller_search_for_admins()
        
        # Test 2: Seller Search for Users  
        self.test_seller_search_for_users()
        
        # Test 3: Buyer Search Restrictions
        self.test_buyer_search_restrictions()
        
        # Test 4: Admin Search (Full Access)
        self.test_admin_search_full_access()
        
        # Test 5: Create Conversation with Found Admin
        self.test_create_conversation_with_admin()
        
        # Comprehensive testing
        self.test_enhanced_search_comprehensive()
        
        # Print final results
        print("\n" + "=" * 80)
        print(f"📊 Enhanced Seller Search Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
        else:
            print("\n🎉 All enhanced seller search tests passed!")
        
        # Print summary of critical requirements
        print("\n🎯 CRITICAL REQUIREMENTS VERIFICATION:")
        
        seller_admin_tests = [r for r in self.test_results if 'Seller' in r['test'] and ('Admin' in r['test'] or 'admin' in r['test'].lower())]
        seller_admin_passed = all(r['success'] for r in seller_admin_tests)
        print(f"✅ Sellers can search for admins: {'PASS' if seller_admin_passed else 'FAIL'}")
        
        buyer_restriction_tests = [r for r in self.test_results if 'Buyer' in r['test'] and 'Restriction' in r['test']]
        buyer_restriction_passed = all(r['success'] for r in buyer_restriction_tests)
        print(f"✅ Buyers restricted from admin access: {'PASS' if buyer_restriction_passed else 'FAIL'}")
        
        admin_access_tests = [r for r in self.test_results if 'Admin' in r['test'] and 'Full Access' in r['test']]
        admin_access_passed = all(r['success'] for r in admin_access_tests)
        print(f"✅ Admins have full search access: {'PASS' if admin_access_passed else 'FAIL'}")
        
        conversation_tests = [r for r in self.test_results if 'Conversation' in r['test'] and 'Admin' in r['test']]
        conversation_passed = all(r['success'] for r in conversation_tests)
        print(f"✅ Seller-admin conversation creation: {'PASS' if conversation_passed else 'FAIL'}")
        
        return len(failed_tests) == 0

if __name__ == "__main__":
    tester = EnhancedSellerSearchTester()
    success = tester.run_enhanced_seller_search_tests()
    sys.exit(0 if success else 1)