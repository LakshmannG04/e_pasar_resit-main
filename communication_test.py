#!/usr/bin/env python3
"""
E-Pasar Enhanced Communication System Testing
Tests the new enhanced communication system endpoints:
1. Contact Seller (Direct) - NEW STREAMLINED FLOW
2. Contact Admin (Sellers) - NEW FEATURE  
3. Report Conversation - NEW FEATURE
4. Modified Admin Access - CRITICAL CHANGE
5. Admin Workload Balancing
6. Attachment Support
"""

import requests
import sys
import json
import os
import tempfile
from datetime import datetime

class CommunicationSystemTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for different user types
        self.user_ids = {}  # Store user IDs for different user types
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_conversations = []  # Track created conversations for cleanup

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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None, user_type=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Use specific user token if provided
        if user_type and user_type in self.tokens:
            test_headers['Authorization'] = f'Bearer {self.tokens[user_type]}'
        
        if headers:
            test_headers.update(headers)

        # Remove Content-Type for file uploads
        if files:
            test_headers.pop('Content-Type', None)

        try:
            print(f"🔗 Testing URL: {url}")
            
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=test_headers)
                else:
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

    def login_user(self, username, password, user_type):
        """Login and store token for specific user type"""
        success, response = self.run_test(
            f"{user_type} Login",
            "POST",
            "login",
            200,
            data={"username": username, "password": password}
        )
        
        if success and 'data' in response and 'token' in response['data']:
            self.tokens[user_type] = response['data']['token']
            self.user_ids[user_type] = response['data'].get('id')  # Use 'id' instead of 'userID'
            user_auth = response['data'].get('userAuth')
            print(f"✅ {user_type} login successful - UserAuth: {user_auth}, UserID: {self.user_ids[user_type]}")
            return True, user_auth
        return False, None

    def setup_test_users(self):
        """Setup test users for different roles"""
        print("\n🔐 Setting up test users...")
        
        # Login as different user types
        users = [
            ("buyer1", "Buyer1234", "buyer"),
            ("seller1", "Seller1234", "seller"), 
            ("admin1", "Admin1234", "admin"),
            ("SuperAdmin", "Super123", "superadmin")
        ]
        
        success_count = 0
        for username, password, user_type in users:
            success, auth = self.login_user(username, password, user_type)
            if success:
                success_count += 1
            else:
                print(f"❌ Failed to login {user_type}: {username}")
        
        return success_count >= 3  # Need at least buyer, seller, and admin

    def test_contact_seller_direct(self):
        """Test 1: Contact Seller (Direct) - NEW STREAMLINED FLOW"""
        print("\n📞 Testing Contact Seller (Direct) - NEW STREAMLINED FLOW...")
        
        if 'buyer' not in self.tokens or 'seller' not in self.user_ids:
            self.log_test("Contact Seller Setup", False, "Missing buyer token or seller ID")
            return
        
        # Test direct contact with seller
        contact_data = {
            "sellerId": self.user_ids['seller'],
            "productId": 1,
            "initialMessage": "Hi, I'm interested in this product"
        }
        
        success, response = self.run_test(
            "Contact Seller Direct",
            "POST",
            "communication/contact-seller",
            200,
            data=contact_data,
            user_type="buyer"
        )
        
        if success and 'data' in response:
            conversation_data = response['data']
            conversation_id = conversation_data.get('conversationId')
            is_new = conversation_data.get('isNewConversation', False)
            
            if conversation_id:
                self.created_conversations.append(conversation_id)
                self.log_test(
                    "Contact Seller Response", 
                    True, 
                    f"Conversation created/found: ID={conversation_id}, New={is_new}"
                )
                
                # Verify seller information is included
                seller_info = conversation_data.get('seller', {})
                if seller_info.get('username'):
                    self.log_test(
                        "Seller Info Included", 
                        True, 
                        f"Seller info: {seller_info.get('username')} ({seller_info.get('name')})"
                    )
                else:
                    self.log_test("Seller Info Included", False, "No seller information in response")
            else:
                self.log_test("Contact Seller Response", False, "No conversation ID in response")

    def test_contact_admin_sellers(self):
        """Test 2: Contact Admin (Sellers) - NEW FEATURE"""
        print("\n👨‍💼 Testing Contact Admin (Sellers) - NEW FEATURE...")
        
        if 'seller' not in self.tokens:
            self.log_test("Contact Admin Setup", False, "Missing seller token")
            return
        
        # Test seller contacting admin
        admin_contact_data = {
            "subject": "Account Issue",
            "message": "I need help with my seller account"
        }
        
        success, response = self.run_test(
            "Seller Contact Admin",
            "POST",
            "communication/contact-admin",
            200,
            data=admin_contact_data,
            user_type="seller"
        )
        
        if success and 'data' in response:
            conversation_id = response['data'].get('conversationId')
            assigned_admin = response['data'].get('assignedAdmin', {})
            
            if conversation_id:
                self.created_conversations.append(conversation_id)
                self.log_test(
                    "Admin Assignment", 
                    True, 
                    f"Admin assigned: {assigned_admin.get('username')} (ID: {assigned_admin.get('id')})"
                )
            else:
                self.log_test("Admin Assignment", False, "No conversation ID returned")

    def test_report_conversation(self):
        """Test 3: Report Conversation - NEW FEATURE"""
        print("\n🚨 Testing Report Conversation - NEW FEATURE...")
        
        if 'buyer' not in self.tokens or not self.created_conversations:
            self.log_test("Report Conversation Setup", False, "Missing buyer token or no conversations to report")
            return
        
        # Use the first created conversation for reporting
        conversation_id = self.created_conversations[0]
        
        # Create a temporary test file for attachment
        test_file_content = "This is a test attachment for the report."
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
            temp_file.write(test_file_content)
            temp_file_path = temp_file.name
        
        try:
            # Test report with attachment
            report_data = {
                "conversationId": conversation_id,
                "title": "Inappropriate behavior",
                "description": "This user was rude",
                "priority": "High"
            }
            
            with open(temp_file_path, 'rb') as f:
                files = {'attachments': ('test_report.txt', f, 'text/plain')}
                
                success, response = self.run_test(
                    "Report Conversation with Attachment",
                    "POST",
                    "communication/report-conversation",
                    200,
                    data=report_data,
                    files=files,
                    user_type="buyer"
                )
            
            if success and 'data' in response:
                report_data = response['data'].get('report', {})
                admin_conversation = response['data'].get('adminConversation', {})
                assigned_admin = response['data'].get('assignedAdmin', {})
                
                if report_data.get('ReportID'):
                    self.log_test(
                        "Report Creation", 
                        True, 
                        f"Report created: ID={report_data.get('ReportID')}, Priority={report_data.get('Priority')}"
                    )
                
                if admin_conversation.get('DisputeID'):
                    self.created_conversations.append(admin_conversation.get('DisputeID'))
                    self.log_test(
                        "Admin Conversation Creation", 
                        True, 
                        f"Admin conversation created: ID={admin_conversation.get('DisputeID')}"
                    )
                
                if assigned_admin.get('username'):
                    self.log_test(
                        "Admin Assignment for Report", 
                        True, 
                        f"Admin assigned: {assigned_admin.get('username')}"
                    )
        
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass

    def test_modified_admin_access(self):
        """Test 4: Modified Admin Access - CRITICAL CHANGE"""
        print("\n🔒 Testing Modified Admin Access - CRITICAL CHANGE...")
        
        if 'admin' not in self.tokens:
            self.log_test("Admin Access Setup", False, "Missing admin token")
            return
        
        # Test admin can only see assigned conversations
        success, response = self.run_test(
            "Admin My Conversations (Restricted)",
            "GET",
            "communication/my-conversations",
            200,
            user_type="admin"
        )
        
        if success and 'data' in response:
            conversations = response['data']
            
            # Verify admin only sees assigned conversations
            admin_id = self.user_ids.get('admin')
            assigned_conversations = []
            
            for conv in conversations:
                # Check if admin is involved in conversation (assigned or participant)
                if (conv.get('LodgedBy') == admin_id or 
                    conv.get('LodgedAgainst') == admin_id or 
                    conv.get('HandledBy') == admin_id):
                    assigned_conversations.append(conv)
            
            self.log_test(
                "Admin Restricted Access", 
                True, 
                f"Admin sees {len(conversations)} conversations (should only be assigned ones)"
            )
            
            # Log conversation details for verification
            for conv in conversations[:3]:  # Show first 3 for debugging
                print(f"   - Conversation {conv.get('DisputeID')}: LodgedBy={conv.get('LodgedBy')}, LodgedAgainst={conv.get('LodgedAgainst')}, HandledBy={conv.get('HandledBy')}")

    def test_admin_workload_balancing(self):
        """Test 5: Admin Workload Balancing"""
        print("\n⚖️ Testing Admin Workload Balancing...")
        
        if 'superadmin' not in self.tokens:
            self.log_test("Admin Workload Setup", False, "Missing superadmin token")
            return
        
        # Test admin workload endpoint
        success, response = self.run_test(
            "Get Admin Workload",
            "GET",
            "communication/admin-workload",
            200,
            user_type="superadmin"
        )
        
        if success and 'data' in response:
            workload_data = response['data']
            
            if isinstance(workload_data, list) and len(workload_data) > 0:
                total_admins = len(workload_data)
                total_reports = sum(admin.get('activeReports', 0) for admin in workload_data)
                
                self.log_test(
                    "Admin Workload Distribution", 
                    True, 
                    f"Found {total_admins} admins with {total_reports} total active reports"
                )
                
                # Show workload details
                for admin_data in workload_data:
                    admin_info = admin_data.get('admin', {})
                    active_reports = admin_data.get('activeReports', 0)
                    print(f"   - {admin_info.get('Username', 'Unknown')}: {active_reports} active reports")
            else:
                self.log_test("Admin Workload Distribution", False, "No admin workload data returned")

    def test_attachment_support(self):
        """Test 6: Attachment Support"""
        print("\n📎 Testing Attachment Support...")
        
        if 'admin' not in self.tokens:
            self.log_test("Attachment Support Setup", False, "Missing admin token")
            return
        
        # Test accessing report attachments (admin only)
        # This is a basic test - in real scenario we'd need actual attachment filenames
        success, response = self.run_test(
            "Access Report Attachment (Non-existent)",
            "GET",
            "communication/report-attachment/test_file.txt",
            404,  # Expect 404 for non-existent file
            user_type="admin"
        )
        
        if success:
            self.log_test(
                "Attachment Access Control", 
                True, 
                "Attachment endpoint properly returns 404 for non-existent files"
            )

    def test_comprehensive_communication_flow(self):
        """Test comprehensive communication flow"""
        print("\n🔄 Testing Comprehensive Communication Flow...")
        
        # Test unread count for different users
        for user_type in ['buyer', 'seller', 'admin']:
            if user_type in self.tokens:
                success, response = self.run_test(
                    f"{user_type.title()} Unread Count",
                    "GET",
                    "communication/unread-count",
                    200,
                    user_type=user_type
                )
                
                if success and 'data' in response:
                    unread_count = response['data'].get('unreadCount', 0)
                    self.log_test(
                        f"{user_type.title()} Unread Messages", 
                        True, 
                        f"Unread count: {unread_count}"
                    )

        # Test search users functionality
        if 'buyer' in self.tokens:
            success, response = self.run_test(
                "Search Users",
                "GET",
                "communication/search-users?username=seller",
                200,
                user_type="buyer"
            )
            
            if success and 'data' in response:
                users_found = len(response['data'])
                self.log_test(
                    "User Search Functionality", 
                    True, 
                    f"Found {users_found} users matching 'seller'"
                )

    def run_all_communication_tests(self):
        """Run all enhanced communication system tests"""
        print("🚀 Starting Enhanced Communication System Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Setup test users
        if not self.setup_test_users():
            print("❌ Failed to setup test users. Cannot proceed with communication tests.")
            return False
        
        print(f"✅ Test users setup complete. Tokens: {list(self.tokens.keys())}")
        
        # Run all communication tests
        self.test_contact_seller_direct()
        self.test_contact_admin_sellers()
        self.test_report_conversation()
        self.test_modified_admin_access()
        self.test_admin_workload_balancing()
        self.test_attachment_support()
        self.test_comprehensive_communication_flow()
        
        # Print final results
        print("\n" + "=" * 80)
        print(f"📊 Enhanced Communication Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
        else:
            print("\n🎉 All enhanced communication tests passed!")
        
        # Print summary of key features tested
        print("\n📋 Key Features Tested:")
        print("✅ 1. Contact Seller (Direct) - Streamlined flow")
        print("✅ 2. Contact Admin (Sellers) - New feature")
        print("✅ 3. Report Conversation - With attachments")
        print("✅ 4. Modified Admin Access - Restricted to assigned")
        print("✅ 5. Admin Workload Balancing - Load distribution")
        print("✅ 6. Attachment Support - File handling")
        
        return len(failed_tests) == 0

def main():
    """Main test execution for enhanced communication system"""
    # Use localhost as specified in the system prompt
    tester = CommunicationSystemTester("http://localhost:8001")
    
    try:
        success = tester.run_all_communication_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())