#!/usr/bin/env python3
"""
E-Pasar Authentication and Communication System Test
Tests the complete authentication flow and communication security features
"""

import requests
import sys
import json
from datetime import datetime

class AuthCommunicationTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.buyer_token = None
        self.admin_token = None
        self.buyer_user_id = None
        self.admin_user_id = None
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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        
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

    def test_buyer_authentication(self):
        """Test buyer authentication flow"""
        print("\n🔐 Testing Buyer Authentication Flow...")
        
        # Test buyer login
        success, response = self.run_test(
            "Buyer Login",
            "POST",
            "login",
            200,
            data={"username": "buyer_test", "password": "buyer123"}
        )
        
        if success and 'data' in response and 'token' in response['data']:
            self.buyer_token = response['data']['token']
            self.buyer_user_id = response['data'].get('userID')
            user_auth = response['data'].get('userAuth')
            
            if user_auth == "User":  # In this system, buyers are "User" role
                self.log_test("Buyer Role Verification", True, f"User authenticated as {user_auth}")
                
                # Test profile access with token
                success, profile_response = self.run_test(
                    "Buyer Profile Access",
                    "GET",
                    "profile",
                    200,
                    token=self.buyer_token
                )
                
                return True
            else:
                self.log_test("Buyer Role Verification", False, f"Expected 'User' role, got '{user_auth}'")
                return False
        else:
            self.log_test("Buyer Authentication", False, "Failed to login with buyer_test credentials")
            return False

    def test_admin_authentication(self):
        """Test admin authentication flow"""
        print("\n🔐 Testing Admin Authentication Flow...")
        
        # Test admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "login",
            200,
            data={"username": "admin_test", "password": "admin123"}
        )
        
        if success and 'data' in response and 'token' in response['data']:
            self.admin_token = response['data']['token']
            self.admin_user_id = response['data'].get('userID')
            user_auth = response['data'].get('userAuth')
            
            if user_auth in ["Admin", "SuperAdmin"]:
                self.log_test("Admin Role Verification", True, f"User authenticated as {user_auth}")
                return True
            else:
                self.log_test("Admin Role Verification", False, f"Expected 'Admin' or 'SuperAdmin' role, got '{user_auth}'")
                return False
        else:
            self.log_test("Admin Authentication", False, "Failed to login with admin_test credentials")
            return False

    def test_communication_access(self):
        """Test communication system access"""
        print("\n💬 Testing Communication System Access...")
        
        if not self.buyer_token:
            self.log_test("Communication Access", False, "No buyer token available")
            return False
        
        # Test get conversations
        success, conversations_response = self.run_test(
            "Get Buyer Conversations",
            "GET",
            "communication/my-conversations",
            200,
            token=self.buyer_token
        )
        
        # Test unread count
        success, unread_response = self.run_test(
            "Get Unread Count",
            "GET",
            "communication/unread-count",
            200,
            token=self.buyer_token
        )
        
        return success

    def test_user_search_filtering(self):
        """Test user search filtering - CRITICAL SECURITY TEST"""
        print("\n🔍 Testing User Search Filtering (CRITICAL SECURITY)...")
        
        if not self.buyer_token:
            self.log_test("User Search Filtering", False, "No buyer token available")
            return False
        
        # Test 1: Search for sellers (should return results)
        success, seller_response = self.run_test(
            "Search for Sellers",
            "GET",
            "communication/search-users?username=seller",
            200,
            token=self.buyer_token
        )
        
        if success and 'data' in seller_response:
            seller_results = seller_response['data']
            self.log_test("Seller Search Results", True, f"Found {len(seller_results)} seller results")
        
        # Test 2: Search for buyers (should return results)
        success, buyer_response = self.run_test(
            "Search for Buyers",
            "GET",
            "communication/search-users?username=buyer",
            200,
            token=self.buyer_token
        )
        
        if success and 'data' in buyer_response:
            buyer_results = buyer_response['data']
            self.log_test("Buyer Search Results", True, f"Found {len(buyer_results)} buyer results")
        
        # Test 3: Search for "admin" (should return EMPTY results - SECURITY RULE)
        success, admin_response = self.run_test(
            "Search for Admin (Security Test)",
            "GET",
            "communication/search-users?username=admin",
            200,
            token=self.buyer_token
        )
        
        if success and 'data' in admin_response:
            admin_results = admin_response['data']
            if len(admin_results) == 0:
                self.log_test("Admin Filtering Security", True, "✅ Admin users correctly filtered out from buyer search")
            else:
                admin_usernames = [user.get('Username', 'Unknown') for user in admin_results]
                self.log_test("Admin Filtering Security", False, f"🔒 SECURITY ISSUE: Found admin users in search: {admin_usernames}")
        
        # Test 4: Search for "SuperAdmin" (should return EMPTY results - SECURITY RULE)
        success, superadmin_response = self.run_test(
            "Search for SuperAdmin (Security Test)",
            "GET",
            "communication/search-users?username=SuperAdmin",
            200,
            token=self.buyer_token
        )
        
        if success and 'data' in superadmin_response:
            superadmin_results = superadmin_response['data']
            if len(superadmin_results) == 0:
                self.log_test("SuperAdmin Filtering Security", True, "✅ SuperAdmin users correctly filtered out from buyer search")
            else:
                superadmin_usernames = [user.get('Username', 'Unknown') for user in superadmin_results]
                self.log_test("SuperAdmin Filtering Security", False, f"🔒 SECURITY ISSUE: Found SuperAdmin users in search: {superadmin_usernames}")
        
        # Test 5: Test variations like "admin_test", "super", etc.
        test_variations = ["admin_test", "super", "Admin", "ADMIN"]
        for variation in test_variations:
            success, variation_response = self.run_test(
                f"Search Variation '{variation}' (Security Test)",
                "GET",
                f"communication/search-users?username={variation}",
                200,
                token=self.buyer_token
            )
            
            if success and 'data' in variation_response:
                variation_results = variation_response['data']
                # Check if any admin users are returned
                admin_found = any(user.get('UserAuth') in ['Admin', 'SuperAdmin'] for user in variation_results)
                if not admin_found:
                    self.log_test(f"Variation '{variation}' Security", True, f"✅ No admin users found in '{variation}' search")
                else:
                    admin_users = [user for user in variation_results if user.get('UserAuth') in ['Admin', 'SuperAdmin']]
                    self.log_test(f"Variation '{variation}' Security", False, f"🔒 SECURITY ISSUE: Found admin users: {admin_users}")

    def test_admin_search_privileges(self):
        """Test admin search privileges"""
        print("\n🔍 Testing Admin Search Privileges...")
        
        if not self.admin_token:
            self.log_test("Admin Search Privileges", False, "No admin token available")
            return False
        
        # Test admin search for admin users (should work)
        success, admin_search_response = self.run_test(
            "Admin Search for Admins",
            "GET",
            "communication/search-users?username=admin",
            200,
            token=self.admin_token
        )
        
        if success and 'data' in admin_search_response:
            admin_results = admin_search_response['data']
            admin_found = any(user.get('UserAuth') in ['Admin', 'SuperAdmin'] for user in admin_results)
            if admin_found:
                self.log_test("Admin Unrestricted Search", True, "✅ Admin can search for other admin users")
            else:
                self.log_test("Admin Unrestricted Search", False, "❌ Admin cannot find other admin users")
        
        # Test admin search for regular users (should also work)
        success, user_search_response = self.run_test(
            "Admin Search for Users",
            "GET",
            "communication/search-users?username=buyer",
            200,
            token=self.admin_token
        )
        
        return success

    def test_cross_communication(self):
        """Test cross-communication between buyer and seller"""
        print("\n💬 Testing Cross-Communication...")
        
        if not self.buyer_token:
            self.log_test("Cross-Communication", False, "No buyer token available")
            return False
        
        # First, find a seller to communicate with
        success, seller_search = self.run_test(
            "Find Seller for Communication",
            "GET",
            "communication/search-users?username=seller",
            200,
            token=self.buyer_token
        )
        
        if not success or 'data' not in seller_search or len(seller_search['data']) == 0:
            self.log_test("Cross-Communication Setup", False, "No sellers found to test communication")
            return False
        
        target_seller = seller_search['data'][0]
        
        # Create conversation with seller
        conversation_data = {
            "title": "Test Communication - Product Inquiry",
            "description": "Testing the communication system between buyer and seller",
            "targetUsername": target_seller['Username'],
            "priority": "Medium"
        }
        
        success, create_response = self.run_test(
            "Create Buyer-Seller Conversation",
            "POST",
            "communication/create-dispute",
            200,
            data=conversation_data,
            token=self.buyer_token
        )
        
        if success and 'data' in create_response:
            conversation_id = create_response['data']['DisputeID']
            
            # Test sending a message
            message_data = {
                "message": "Hello! I'm interested in your products. Can you provide more details?",
                "messageType": "message"
            }
            
            success, message_response = self.run_test(
                "Send Message in Conversation",
                "POST",
                f"communication/conversation/{conversation_id}/send-message",
                200,
                data=message_data,
                token=self.buyer_token
            )
            
            if success:
                # Test retrieving messages
                success, messages_response = self.run_test(
                    "Retrieve Conversation Messages",
                    "GET",
                    f"communication/conversation/{conversation_id}/messages",
                    200,
                    token=self.buyer_token
                )
                
                return success
        
        return False

    def run_comprehensive_test(self):
        """Run all authentication and communication tests"""
        print("🚀 Starting E-Pasar Authentication & Communication Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 70)
        
        # Test 1: Buyer Authentication Flow
        buyer_auth_success = self.test_buyer_authentication()
        
        # Test 2: Admin Authentication Flow (if available)
        admin_auth_success = self.test_admin_authentication()
        
        if buyer_auth_success:
            # Test 3: Communication Access
            self.test_communication_access()
            
            # Test 4: User Search Filtering (CRITICAL SECURITY TEST)
            self.test_user_search_filtering()
            
            # Test 5: Cross-Communication
            self.test_cross_communication()
        
        if admin_auth_success:
            # Test 6: Admin Search Privileges
            self.test_admin_search_privileges()
        
        # Print final results
        print("\n" + "=" * 70)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
        
        # Print security summary
        security_tests = [r for r in self.test_results if 'Security' in r['test']]
        security_passed = [r for r in security_tests if r['success']]
        
        print(f"\n🔒 Security Tests: {len(security_passed)}/{len(security_tests)} passed")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = AuthCommunicationTester("http://localhost:8001")
    
    try:
        success = tester.run_comprehensive_test()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())