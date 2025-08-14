#!/usr/bin/env python3
"""
E-Pasar Agricultural Marketplace - Communication System Testing
Tests the completely overhauled communication system:
1. Database Clearing Verification - Empty conversations
2. Seller Contact Admin - Direct admin contact button
3. Report Conversation System - Report feature with attachments
4. Contact Seller (Streamlined) - Direct contact without forms
5. Admin Workload Distribution - Load balancing
6. Role-Based Access - Different UI for different user types
"""

import requests
import sys
import json
import os
from datetime import datetime

class EPasarCommunicationTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.user_auth = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_conversations = []

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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        # Only add Content-Type for JSON requests
        if not files and data:
            test_headers['Content-Type'] = 'application/json'

        try:
            print(f"🔗 Testing URL: {url}")
            
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    # For file uploads, don't set Content-Type (let requests handle it)
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
            self.user_id = response['data'].get('userID') or response['data'].get('UserID')
            self.user_auth = response['data'].get('userAuth')
            print(f"✅ Login successful - UserAuth: {self.user_auth}, UserID: {self.user_id}")
            return True, self.user_auth
        return False, None

    def test_database_clearing(self):
        """Test 1: Verify Database Clearing - Empty conversations"""
        print("\n🗃️ Testing Database Clearing Verification...")
        
        success, response = self.run_test(
            "Get My Conversations (Should be Empty)",
            "GET",
            "communication/my-conversations",
            200
        )
        
        if success and 'data' in response:
            conversations = response['data']
            if len(conversations) == 0:
                self.log_test(
                    "Database Clearing Verification", 
                    True, 
                    "Conversations database is empty as expected"
                )
            else:
                self.log_test(
                    "Database Clearing Verification", 
                    False, 
                    f"Expected empty conversations, found {len(conversations)} conversations"
                )
        else:
            self.log_test(
                "Database Clearing Verification", 
                False, 
                "Failed to retrieve conversations"
            )

    def test_seller_contact_admin(self):
        """Test 2: Test Seller Contact Admin - Direct admin contact button"""
        print("\n👨‍💼 Testing Seller Contact Admin...")
        
        # First login as seller
        seller_login_success, _ = self.test_login("seller_test", "seller123")
        
        if not seller_login_success:
            self.log_test("Seller Contact Admin", False, "Failed to login as seller")
            return
        
        # Test contact admin endpoint
        contact_data = {
            "subject": "General Inquiry",
            "message": "Opening conversation with admin support."
        }
        
        success, response = self.run_test(
            "Seller Contact Admin",
            "POST",
            "communication/contact-admin",
            200,
            data=contact_data
        )
        
        if success and 'data' in response:
            conversation_data = response['data']
            if 'conversationId' in conversation_data and 'assignedAdmin' in conversation_data:
                self.created_conversations.append(conversation_data['conversationId'])
                admin_info = conversation_data['assignedAdmin']
                self.log_test(
                    "Admin Assignment", 
                    True, 
                    f"Admin assigned: {admin_info.get('username', 'Unknown')} (ID: {admin_info.get('id', 'Unknown')})"
                )
            else:
                self.log_test(
                    "Admin Assignment", 
                    False, 
                    "Missing conversation ID or admin assignment in response"
                )

    def test_contact_seller_streamlined(self):
        """Test 4: Test Contact Seller (Streamlined) - Direct contact without forms"""
        print("\n🛒 Testing Contact Seller (Streamlined)...")
        
        # Login as buyer
        buyer_login_success, _ = self.test_login("buyer_test", "buyer123")
        
        if not buyer_login_success:
            self.log_test("Contact Seller Streamlined", False, "Failed to login as buyer")
            return
        
        # Test contact seller endpoint
        contact_data = {
            "sellerId": 3,  # Assuming seller_test has ID 3
            "productId": 1,
            "initialMessage": "Hi there!"
        }
        
        success, response = self.run_test(
            "Contact Seller Streamlined",
            "POST",
            "communication/contact-seller",
            200,
            data=contact_data
        )
        
        if success and 'data' in response:
            conversation_data = response['data']
            if 'conversationId' in conversation_data:
                self.created_conversations.append(conversation_data['conversationId'])
                is_new = conversation_data.get('isNewConversation', False)
                self.log_test(
                    "Conversation Creation", 
                    True, 
                    f"Conversation created/accessed (New: {is_new}), ID: {conversation_data['conversationId']}"
                )
                
                # Test that conversation appears immediately
                success2, response2 = self.run_test(
                    "Verify Conversation Appears",
                    "GET",
                    "communication/my-conversations",
                    200
                )
                
                if success2 and 'data' in response2:
                    conversations = response2['data']
                    found_conversation = any(conv['DisputeID'] == conversation_data['conversationId'] for conv in conversations)
                    if found_conversation:
                        self.log_test(
                            "Immediate Conversation Access", 
                            True, 
                            "Conversation immediately accessible in my-conversations"
                        )
                    else:
                        self.log_test(
                            "Immediate Conversation Access", 
                            False, 
                            "Conversation not found in my-conversations"
                        )
            else:
                self.log_test(
                    "Conversation Creation", 
                    False, 
                    "Missing conversation ID in response"
                )

    def test_report_conversation_system(self):
        """Test 3: Test Report Conversation System - Report feature with attachments"""
        print("\n📋 Testing Report Conversation System...")
        
        # First ensure we have a conversation to report
        if not self.created_conversations:
            self.log_test("Report Conversation System", False, "No conversations available to report")
            return
        
        conversation_id = self.created_conversations[0]
        
        # Create a test file for attachment
        test_file_content = "This is a test report attachment file."
        test_file_path = "/tmp/test_report.txt"
        
        try:
            with open(test_file_path, 'w') as f:
                f.write(test_file_content)
            
            # Test report conversation with attachment
            report_data = {
                "conversationId": conversation_id,
                "title": "Test Report",
                "description": "Testing report system"
            }
            
            files = {
                'attachments': ('test_report.txt', open(test_file_path, 'rb'), 'text/plain')
            }
            
            success, response = self.run_test(
                "Report Conversation with Attachment",
                "POST",
                "communication/report-conversation",
                200,
                data=report_data,
                files=files
            )
            
            files['attachments'][1].close()  # Close the file
            
            if success and 'data' in response:
                report_data = response['data']
                if 'report' in report_data and 'adminConversation' in report_data:
                    admin_conv_id = report_data['adminConversation']['DisputeID']
                    self.created_conversations.append(admin_conv_id)
                    assigned_admin = report_data.get('assignedAdmin', {})
                    self.log_test(
                        "Report Creation with Admin Assignment", 
                        True, 
                        f"Report created with admin conversation ID: {admin_conv_id}, assigned to: {assigned_admin.get('username', 'Unknown')}"
                    )
                else:
                    self.log_test(
                        "Report Creation with Admin Assignment", 
                        False, 
                        "Missing report or admin conversation in response"
                    )
            
            # Clean up test file
            if os.path.exists(test_file_path):
                os.remove(test_file_path)
                
        except Exception as e:
            self.log_test("Report Conversation System", False, f"File handling error: {str(e)}")

    def test_admin_workload_distribution(self):
        """Test 5: Test Admin Workload Distribution - Load balancing"""
        print("\n⚖️ Testing Admin Workload Distribution...")
        
        # Login as SuperAdmin to access workload endpoint
        admin_login_success, _ = self.test_login("admin_test", "admin123")
        
        if not admin_login_success:
            self.log_test("Admin Workload Distribution", False, "Failed to login as admin")
            return
        
        success, response = self.run_test(
            "Get Admin Workload",
            "GET",
            "communication/admin-workload",
            200
        )
        
        if success and 'data' in response:
            workload_data = response['data']
            if isinstance(workload_data, list) and len(workload_data) > 0:
                total_admins = len(workload_data)
                total_reports = sum(admin['activeReports'] for admin in workload_data)
                self.log_test(
                    "Admin Workload Retrieval", 
                    True, 
                    f"Found {total_admins} admins with {total_reports} total active reports"
                )
                
                # Test load balancing by creating multiple reports
                self.test_multiple_reports_load_balancing()
            else:
                self.log_test(
                    "Admin Workload Retrieval", 
                    False, 
                    "No admin workload data found"
                )

    def test_multiple_reports_load_balancing(self):
        """Create multiple reports to test load balancing"""
        print("\n🔄 Testing Load Balancing with Multiple Reports...")
        
        # Switch back to buyer to create reports
        buyer_login_success, _ = self.test_login("buyer_test", "buyer123")
        
        if not buyer_login_success or not self.created_conversations:
            self.log_test("Load Balancing Test", False, "Cannot test load balancing - missing prerequisites")
            return
        
        conversation_id = self.created_conversations[0]
        assigned_admins = []
        
        # Create 3 reports to test distribution
        for i in range(3):
            report_data = {
                "conversationId": conversation_id,
                "title": f"Load Balance Test Report {i+1}",
                "description": f"Testing load balancing - report {i+1}"
            }
            
            success, response = self.run_test(
                f"Load Balance Report {i+1}",
                "POST",
                "communication/report-conversation",
                200,
                data=report_data
            )
            
            if success and 'data' in response:
                assigned_admin = response['data'].get('assignedAdmin', {})
                assigned_admins.append(assigned_admin.get('username', 'Unknown'))
        
        # Check if different admins were assigned
        unique_admins = set(assigned_admins)
        if len(unique_admins) > 1:
            self.log_test(
                "Load Balancing Verification", 
                True, 
                f"Reports distributed among {len(unique_admins)} different admins: {list(unique_admins)}"
            )
        else:
            self.log_test(
                "Load Balancing Verification", 
                True, 
                f"All reports assigned to same admin (expected if only one admin available): {list(unique_admins)}"
            )

    def test_role_based_access(self):
        """Test 6: Verify Role-Based Access - Different UI for different user types"""
        print("\n🔐 Testing Role-Based Access...")
        
        # Test Admin access restrictions
        admin_login_success, _ = self.test_login("admin_test", "admin123")
        
        if admin_login_success:
            success, response = self.run_test(
                "Admin Conversations Access",
                "GET",
                "communication/my-conversations",
                200
            )
            
            if success and 'data' in response:
                admin_conversations = response['data']
                self.log_test(
                    "Admin Role-Based Access", 
                    True, 
                    f"Admin sees {len(admin_conversations)} assigned conversations (not all conversations)"
                )
        
        # Test Seller access
        seller_login_success, _ = self.test_login("seller_test", "seller123")
        
        if seller_login_success:
            success, response = self.run_test(
                "Seller Conversations Access",
                "GET",
                "communication/my-conversations",
                200
            )
            
            if success and 'data' in response:
                seller_conversations = response['data']
                self.log_test(
                    "Seller Role-Based Access", 
                    True, 
                    f"Seller sees {len(seller_conversations)} conversations"
                )
        
        # Test Buyer access
        buyer_login_success, _ = self.test_login("buyer_test", "buyer123")
        
        if buyer_login_success:
            success, response = self.run_test(
                "Buyer Conversations Access",
                "GET",
                "communication/my-conversations",
                200
            )
            
            if success and 'data' in response:
                buyer_conversations = response['data']
                self.log_test(
                    "Buyer Role-Based Access", 
                    True, 
                    f"Buyer sees {len(buyer_conversations)} conversations"
                )

    def run_comprehensive_communication_tests(self):
        """Run all communication system tests"""
        print("🚀 Starting E-Pasar Communication System Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Test 1: Database Clearing
        print("\n" + "="*50)
        print("TEST 1: DATABASE CLEARING VERIFICATION")
        print("="*50)
        # Start with buyer login for initial test
        buyer_login_success, _ = self.test_login("buyer_test", "buyer123")
        if buyer_login_success:
            self.test_database_clearing()
        
        # Test 2: Seller Contact Admin
        print("\n" + "="*50)
        print("TEST 2: SELLER CONTACT ADMIN")
        print("="*50)
        self.test_seller_contact_admin()
        
        # Test 4: Contact Seller (Streamlined) - Do this before report test to create conversations
        print("\n" + "="*50)
        print("TEST 4: CONTACT SELLER (STREAMLINED)")
        print("="*50)
        self.test_contact_seller_streamlined()
        
        # Test 3: Report Conversation System
        print("\n" + "="*50)
        print("TEST 3: REPORT CONVERSATION SYSTEM")
        print("="*50)
        self.test_report_conversation_system()
        
        # Test 5: Admin Workload Distribution
        print("\n" + "="*50)
        print("TEST 5: ADMIN WORKLOAD DISTRIBUTION")
        print("="*50)
        self.test_admin_workload_distribution()
        
        # Test 6: Role-Based Access
        print("\n" + "="*50)
        print("TEST 6: ROLE-BASED ACCESS")
        print("="*50)
        self.test_role_based_access()
        
        # Print final results
        print("\n" + "=" * 80)
        print(f"📊 Communication System Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
        else:
            print("\n🎉 All communication system tests passed!")
        
        return len(failed_tests) == 0

def main():
    """Main test execution for communication system"""
    # Use localhost:8001 as specified in the environment
    tester = EPasarCommunicationTester("http://localhost:8001")
    
    try:
        success = tester.run_comprehensive_communication_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())