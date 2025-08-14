#!/usr/bin/env python3
"""
E-Pasar Streamlined Contact Seller Flow Testing
Tests the newly implemented streamlined "Contact Seller" flow:

1. Test Contact Seller API Endpoint (POST /communication/contact-seller)
2. Test Create Dispute Without Priority (POST /communication/create-dispute)
3. Test Conversation Flow
4. Test Streamlined vs Old Flow
5. Verify Priority Removal

CRITICAL REQUIREMENTS:
- Contact seller should be instant (no forms)
- Conversations should be created immediately 
- Initial message should be included in conversation
- All endpoints should work without priority requirements
- Backward compatibility should be maintained
"""

import requests
import sys
import json
from datetime import datetime

class ContactSellerFlowTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.buyer_token = None
        self.seller_token = None
        self.buyer_id = None
        self.seller_id = None
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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Use specific token if provided, otherwise use buyer token
        auth_token = token or self.buyer_token
        if auth_token:
            test_headers['Authorization'] = f'Bearer {auth_token}'
        
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

    def test_login(self, username, password, user_type="buyer"):
        """Test login and get token"""
        success, response = self.run_test(
            f"{user_type.title()} Login",
            "POST",
            "login",
            200,
            data={"username": username, "password": password},
            token=None
        )
        
        if success and 'data' in response and 'token' in response['data']:
            token = response['data']['token']
            user_auth = response['data'].get('userAuth')
            
            # Decode JWT to get user ID (JWT format: header.payload.signature)
            try:
                import base64
                import json as json_lib
                
                # Split token and decode payload
                token_parts = token.split('.')
                if len(token_parts) >= 2:
                    # Add padding if needed
                    payload = token_parts[1]
                    payload += '=' * (4 - len(payload) % 4)
                    decoded_payload = base64.b64decode(payload)
                    payload_data = json_lib.loads(decoded_payload)
                    user_id = payload_data.get('id')
                else:
                    user_id = None
            except Exception as e:
                print(f"Warning: Could not decode JWT token: {e}")
                user_id = None
            
            if user_type == "buyer":
                self.buyer_token = token
                self.buyer_id = user_id
            else:
                self.seller_token = token
                self.seller_id = user_id
                
            print(f"✅ {user_type.title()} login successful - UserAuth: {user_auth}, UserID: {user_id}")
            return True, user_auth
        return False, None

    def test_contact_seller_api_endpoint(self):
        """Test 1: Contact Seller API Endpoint"""
        print("\n🎯 Test 1: Contact Seller API Endpoint")
        print("=" * 50)
        
        # Test data as specified in review request
        contact_data = {
            "sellerId": self.seller_id,
            "productId": 1,
            "initialMessage": "Hi, I'm interested in this product"
        }
        
        success, response = self.run_test(
            "Contact Seller Direct API",
            "POST",
            "communication/contact-seller",
            200,
            data=contact_data
        )
        
        if success and 'data' in response:
            conversation_data = response['data']
            conversation_id = conversation_data.get('conversationId')
            is_new = conversation_data.get('isNewConversation', False)
            seller_info = conversation_data.get('seller', {})
            
            if conversation_id:
                self.created_conversations.append(conversation_id)
                self.log_test(
                    "Conversation Creation", 
                    True, 
                    f"Conversation created with ID: {conversation_id}, New: {is_new}"
                )
                
                # Verify seller information is included (only for new conversations)
                if is_new and seller_info.get('id') == self.seller_id:
                    self.log_test(
                        "Seller Information Included", 
                        True, 
                        f"Seller info: {seller_info.get('name')} (@{seller_info.get('username')})"
                    )
                elif is_new and seller_info.get('id') != self.seller_id:
                    self.log_test(
                        "Seller Information Included", 
                        False, 
                        f"Expected seller ID {self.seller_id}, got {seller_info.get('id')}"
                    )
                elif not is_new:
                    self.log_test(
                        "Existing Conversation Handling", 
                        True, 
                        "Correctly redirected to existing conversation (seller info not needed)"
                    )
                
                # Test that initial message was stored by checking conversation messages
                self.verify_initial_message_stored(conversation_id, contact_data['initialMessage'])
                
                return conversation_id
            else:
                self.log_test(
                    "Conversation ID Return", 
                    False, 
                    "No conversation ID returned in response"
                )
        
        return None

    def verify_initial_message_stored(self, conversation_id, expected_message):
        """Verify that the initial message was properly stored"""
        success, response = self.run_test(
            "Verify Initial Message Stored",
            "GET",
            f"communication/conversation/{conversation_id}/messages",
            200
        )
        
        if success and 'data' in response:
            messages = response['data'].get('messages', [])
            
            # Look for the initial message
            initial_message_found = False
            for message in messages:
                if message.get('Message') == expected_message and message.get('MessageType') == 'message':
                    initial_message_found = True
                    break
            
            if initial_message_found:
                self.log_test(
                    "Initial Message Storage", 
                    True, 
                    f"Initial message '{expected_message}' found in conversation"
                )
            else:
                self.log_test(
                    "Initial Message Storage", 
                    False, 
                    f"Initial message '{expected_message}' not found in conversation messages"
                )

    def test_create_dispute_without_priority(self):
        """Test 2: Create Dispute Without Priority"""
        print("\n🎯 Test 2: Create Dispute Without Priority")
        print("=" * 50)
        
        # Test data as specified in review request (no priority parameter)
        dispute_data = {
            "title": "Test Conversation",
            "description": "Test description",
            "targetUsername": "seller_test"
        }
        
        success, response = self.run_test(
            "Create Dispute Without Priority",
            "POST",
            "communication/create-dispute",
            200,
            data=dispute_data
        )
        
        if success and 'data' in response:
            dispute = response['data']
            dispute_id = dispute.get('DisputeID')
            priority = dispute.get('Priority')
            
            if dispute_id:
                self.created_conversations.append(dispute_id)
                self.log_test(
                    "Dispute Creation Success", 
                    True, 
                    f"Dispute created with ID: {dispute_id}"
                )
                
                # Verify default priority is set to 'Medium'
                if priority == 'Medium':
                    self.log_test(
                        "Default Priority Assignment", 
                        True, 
                        f"Priority correctly defaulted to 'Medium'"
                    )
                else:
                    self.log_test(
                        "Default Priority Assignment", 
                        False, 
                        f"Expected 'Medium' priority, got '{priority}'"
                    )
                
                return dispute_id
            else:
                self.log_test(
                    "Dispute ID Return", 
                    False, 
                    "No dispute ID returned in response"
                )
        
        return None

    def test_conversation_flow(self, conversation_id):
        """Test 3: Test Conversation Flow"""
        print("\n🎯 Test 3: Test Conversation Flow")
        print("=" * 50)
        
        if not conversation_id:
            self.log_test("Conversation Flow", False, "No conversation ID available for testing")
            return
        
        # Test 3a: Verify conversation appears in my-conversations
        success, response = self.run_test(
            "Conversation in My Conversations",
            "GET",
            "communication/my-conversations",
            200
        )
        
        if success and 'data' in response:
            conversations = response['data']
            conversation_found = False
            
            for conv in conversations:
                if conv.get('DisputeID') == conversation_id:
                    conversation_found = True
                    break
            
            if conversation_found:
                self.log_test(
                    "Conversation Visibility", 
                    True, 
                    f"Conversation {conversation_id} found in user's conversations"
                )
            else:
                self.log_test(
                    "Conversation Visibility", 
                    False, 
                    f"Conversation {conversation_id} not found in user's conversations"
                )
        
        # Test 3b: Test sending messages to the conversation
        test_message = "This is a test message to verify the conversation flow works correctly."
        
        success, response = self.run_test(
            "Send Message to Conversation",
            "POST",
            f"communication/conversation/{conversation_id}/send-message",
            200,
            data={"message": test_message, "messageType": "message"}
        )
        
        if success:
            self.log_test(
                "Message Sending", 
                True, 
                "Message sent successfully to conversation"
            )
            
            # Verify message was stored
            success, response = self.run_test(
                "Verify Message Storage",
                "GET",
                f"communication/conversation/{conversation_id}/messages",
                200
            )
            
            if success and 'data' in response:
                messages = response['data'].get('messages', [])
                message_found = False
                
                for message in messages:
                    if message.get('Message') == test_message:
                        message_found = True
                        break
                
                if message_found:
                    self.log_test(
                        "Message Storage Verification", 
                        True, 
                        "Test message found in conversation messages"
                    )
                else:
                    self.log_test(
                        "Message Storage Verification", 
                        False, 
                        "Test message not found in conversation messages"
                    )

    def test_streamlined_vs_old_flow(self):
        """Test 4: Test Streamlined vs Old Flow"""
        print("\n🎯 Test 4: Test Streamlined vs Old Flow")
        print("=" * 50)
        
        # Test that old form-based contact parameters don't break the system
        # Try contact-seller with additional parameters that might have been used in old flow
        old_style_data = {
            "sellerId": self.seller_id,
            "productId": 1,
            "initialMessage": "Testing backward compatibility",
            "priority": "High",  # This should be ignored
            "formData": {"name": "Test User", "email": "test@example.com"}  # This should be ignored
        }
        
        success, response = self.run_test(
            "Backward Compatibility Test",
            "POST",
            "communication/contact-seller",
            200,
            data=old_style_data
        )
        
        if success:
            self.log_test(
                "Old Flow Parameters Handling", 
                True, 
                "System handles old flow parameters without breaking"
            )
            
            # Verify the streamlined approach still works
            conversation_data = response.get('data', {})
            if conversation_data.get('conversationId'):
                self.created_conversations.append(conversation_data['conversationId'])
                self.log_test(
                    "Streamlined Flow Maintained", 
                    True, 
                    "New streamlined flow works despite old parameters"
                )
        
        # Test that new direct contact method works seamlessly
        direct_contact_data = {
            "sellerId": self.seller_id,
            "initialMessage": "Direct contact test - should be instant"
        }
        
        success, response = self.run_test(
            "Direct Contact Method",
            "POST",
            "communication/contact-seller",
            200,
            data=direct_contact_data
        )
        
        if success:
            conversation_data = response.get('data', {})
            if conversation_data.get('conversationId'):
                self.created_conversations.append(conversation_data['conversationId'])
                self.log_test(
                    "Direct Contact Seamless", 
                    True, 
                    "Direct contact method works seamlessly without forms"
                )

    def test_priority_removal_verification(self):
        """Test 5: Verify Priority Removal"""
        print("\n🎯 Test 5: Verify Priority Removal")
        print("=" * 50)
        
        # Test that conversations work without priority in responses
        success, response = self.run_test(
            "Get Conversations Without Priority Errors",
            "GET",
            "communication/my-conversations",
            200
        )
        
        if success and 'data' in response:
            conversations = response['data']
            priority_errors = False
            
            # Check that conversations don't cause priority-related errors
            for conv in conversations:
                # The system should handle conversations regardless of priority field presence
                if 'error' in str(conv).lower() and 'priority' in str(conv).lower():
                    priority_errors = True
                    break
            
            if not priority_errors:
                self.log_test(
                    "No Priority-Related Errors", 
                    True, 
                    "Conversations retrieved without priority-related errors"
                )
            else:
                self.log_test(
                    "No Priority-Related Errors", 
                    False, 
                    "Priority-related errors found in conversation responses"
                )
        
        # Test that create-dispute works with and without priority
        # Without priority (should default to Medium)
        no_priority_data = {
            "title": "No Priority Test",
            "description": "Testing conversation creation without priority",
            "targetUsername": "seller_test"
        }
        
        success, response = self.run_test(
            "Create Dispute No Priority Parameter",
            "POST",
            "communication/create-dispute",
            200,
            data=no_priority_data
        )
        
        if success and 'data' in response:
            dispute = response['data']
            if dispute.get('Priority') == 'Medium':
                self.log_test(
                    "Priority Default Handling", 
                    True, 
                    "Priority correctly defaults to 'Medium' when not specified"
                )
                self.created_conversations.append(dispute.get('DisputeID'))

    def test_comprehensive_workflow(self):
        """Test the complete streamlined workflow"""
        print("\n🎯 Comprehensive Workflow Test")
        print("=" * 50)
        
        # Step 1: Buyer contacts seller directly
        workflow_data = {
            "sellerId": self.seller_id,
            "productId": 1,
            "initialMessage": "I'm interested in your organic tomatoes. What's the minimum order quantity?"
        }
        
        success, response = self.run_test(
            "Workflow Step 1: Direct Contact",
            "POST",
            "communication/contact-seller",
            200,
            data=workflow_data
        )
        
        if not success:
            self.log_test("Complete Workflow", False, "Failed at step 1 - direct contact")
            return
        
        conversation_id = response.get('data', {}).get('conversationId')
        if not conversation_id:
            self.log_test("Complete Workflow", False, "No conversation ID returned")
            return
        
        self.created_conversations.append(conversation_id)
        
        # Step 2: Verify conversation is immediately accessible
        success, response = self.run_test(
            "Workflow Step 2: Immediate Access",
            "GET",
            f"communication/conversation/{conversation_id}/messages",
            200
        )
        
        if not success:
            self.log_test("Complete Workflow", False, "Failed at step 2 - conversation not immediately accessible")
            return
        
        # Step 3: Verify initial message is present
        messages = response.get('data', {}).get('messages', [])
        initial_message_found = any(
            msg.get('Message') == workflow_data['initialMessage'] 
            for msg in messages
        )
        
        if not initial_message_found:
            self.log_test("Complete Workflow", False, "Failed at step 3 - initial message not found")
            return
        
        # Step 4: Test continued conversation
        follow_up_message = "Also, do you offer bulk discounts?"
        
        success, response = self.run_test(
            "Workflow Step 4: Follow-up Message",
            "POST",
            f"communication/conversation/{conversation_id}/send-message",
            200,
            data={"message": follow_up_message, "messageType": "message"}
        )
        
        if success:
            self.log_test(
                "Complete Streamlined Workflow", 
                True, 
                "All workflow steps completed successfully - instant contact, immediate access, message flow working"
            )
        else:
            self.log_test("Complete Workflow", False, "Failed at step 4 - follow-up message")

    def run_all_contact_seller_tests(self):
        """Run all contact seller flow tests"""
        print("🚀 Starting Streamlined Contact Seller Flow Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Step 1: Authenticate users
        print("\n🔐 Authenticating Test Users...")
        
        # Login as buyer
        buyer_success, buyer_auth = self.test_login("buyer_test", "buyer123", "buyer")
        if not buyer_success:
            print("❌ Failed to authenticate as buyer. Cannot proceed with tests.")
            return False
        
        # Login as seller to get seller ID
        seller_success, seller_auth = self.test_login("seller_test", "seller123", "seller")
        if not seller_success:
            print("❌ Failed to authenticate as seller. Cannot get seller ID.")
            return False
        
        print(f"✅ Authenticated as Buyer (ID: {self.buyer_id}) and Seller (ID: {self.seller_id})")
        
        # Step 2: Run all test scenarios
        print("\n📋 Running Test Scenarios...")
        
        # Test 1: Contact Seller API Endpoint
        conversation_id = self.test_contact_seller_api_endpoint()
        
        # Test 2: Create Dispute Without Priority
        dispute_id = self.test_create_dispute_without_priority()
        
        # Test 3: Conversation Flow (use the conversation from test 1)
        self.test_conversation_flow(conversation_id)
        
        # Test 4: Streamlined vs Old Flow
        self.test_streamlined_vs_old_flow()
        
        # Test 5: Priority Removal Verification
        self.test_priority_removal_verification()
        
        # Test 6: Comprehensive Workflow
        self.test_comprehensive_workflow()
        
        # Print final results
        print("\n" + "=" * 80)
        print(f"📊 Contact Seller Flow Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
        else:
            print("\n🎉 All streamlined contact seller flow tests passed!")
        
        # Print created conversations for cleanup reference
        if self.created_conversations:
            print(f"\n📝 Created Conversations (for reference): {self.created_conversations}")
        
        return len(failed_tests) == 0

def main():
    """Main test execution for streamlined contact seller flow"""
    tester = ContactSellerFlowTester("http://localhost:8001")
    
    try:
        success = tester.run_all_contact_seller_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())