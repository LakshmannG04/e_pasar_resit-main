#!/usr/bin/env python3
"""
Delete User Conversations Test
This script will:
1. Check if seller_test (UserID: 3) and buyer_test (UserID: 4) exist
2. Find all conversations involving these users
3. Delete messages first, then conversations (proper SQL order)
4. Confirm deletions completed successfully
"""

import requests
import sys
import json
import subprocess
import os

class ConversationDeletionTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def log_test(self, name, success, message):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: {message}")
        else:
            print(f"❌ {name}: {message}")

    def test_login(self, username, password):
        """Test login and get token"""
        try:
            url = f"{self.base_url}/login"
            response = requests.post(url, json={"username": username, "password": password})
            
            if response.status_code == 200:
                data = response.json()
                if 'data' in data and 'token' in data['data']:
                    self.token = data['data']['token']
                    user_id = data['data'].get('userID')
                    user_auth = data['data'].get('userAuth')
                    self.log_test("Login", True, f"Authenticated as {user_auth} (UserID: {user_id})")
                    return True, user_id, user_auth
            
            self.log_test("Login", False, f"Failed to login: {response.text}")
            return False, None, None
            
        except Exception as e:
            self.log_test("Login", False, f"Login error: {str(e)}")
            return False, None, None

    def get_conversations(self, user_type=""):
        """Get conversations for current user"""
        try:
            url = f"{self.base_url}/communication/my-conversations"
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                conversations = data.get('data', [])
                self.log_test(f"Get Conversations {user_type}", True, f"Found {len(conversations)} conversations")
                return conversations
            else:
                self.log_test(f"Get Conversations {user_type}", False, f"Failed: {response.text}")
                return []
                
        except Exception as e:
            self.log_test(f"Get Conversations {user_type}", False, f"Error: {str(e)}")
            return []

    def check_user_conversations_before_deletion(self):
        """Check conversations for both users before deletion"""
        print("\n🔍 CHECKING CONVERSATIONS BEFORE DELETION")
        print("=" * 60)
        
        # Check seller_test conversations
        print("\n--- Checking seller_test conversations ---")
        seller_login_success, seller_id, seller_auth = self.test_login("seller_test", "seller123")
        seller_conversations = []
        if seller_login_success:
            seller_conversations = self.get_conversations("(seller_test)")
            if seller_conversations:
                print(f"📋 seller_test conversations to be deleted:")
                for conv in seller_conversations:
                    print(f"   - Conversation ID: {conv.get('DisputeID')}, Title: {conv.get('Title')}")
        
        # Check buyer_test conversations  
        print("\n--- Checking buyer_test conversations ---")
        buyer_login_success, buyer_id, buyer_auth = self.test_login("buyer_test", "buyer123")
        buyer_conversations = []
        if buyer_login_success:
            buyer_conversations = self.get_conversations("(buyer_test)")
            if buyer_conversations:
                print(f"📋 buyer_test conversations to be deleted:")
                for conv in buyer_conversations:
                    print(f"   - Conversation ID: {conv.get('DisputeID')}, Title: {conv.get('Title')}")
        
        return len(seller_conversations), len(buyer_conversations)

    def execute_deletion_script(self):
        """Execute the Node.js deletion script"""
        print("\n🗑️ EXECUTING DELETION SCRIPT")
        print("=" * 60)
        
        try:
            # Change to server directory and run the FIXED deletion script
            server_dir = "/app/server"
            script_path = os.path.join(server_dir, "delete_user_conversations_fixed.js")
            
            if not os.path.exists(script_path):
                self.log_test("Deletion Script Exists", False, f"Script not found at {script_path}")
                return False
            
            self.log_test("Deletion Script Exists", True, f"Found script at {script_path}")
            
            # Execute the script
            print("\n🚀 Running deletion script...")
            result = subprocess.run(
                ["node", "delete_user_conversations.js"],
                cwd=server_dir,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.log_test("Deletion Script Execution", True, "Script executed successfully")
                print("📄 Script Output:")
                print(result.stdout)
                if result.stderr:
                    print("⚠️ Script Warnings:")
                    print(result.stderr)
                return True
            else:
                self.log_test("Deletion Script Execution", False, f"Script failed with return code {result.returncode}")
                print("❌ Script Error Output:")
                print(result.stderr)
                print("📄 Script Output:")
                print(result.stdout)
                return False
                
        except subprocess.TimeoutExpired:
            self.log_test("Deletion Script Execution", False, "Script timed out after 30 seconds")
            return False
        except Exception as e:
            self.log_test("Deletion Script Execution", False, f"Error executing script: {str(e)}")
            return False

    def check_user_conversations_after_deletion(self):
        """Check conversations for both users after deletion"""
        print("\n🔍 VERIFYING DELETION RESULTS")
        print("=" * 60)
        
        # Check seller_test conversations
        print("\n--- Verifying seller_test conversations deleted ---")
        seller_login_success, seller_id, seller_auth = self.test_login("seller_test", "seller123")
        seller_conversations_after = []
        if seller_login_success:
            seller_conversations_after = self.get_conversations("(seller_test after deletion)")
            if len(seller_conversations_after) == 0:
                self.log_test("seller_test Conversations Deleted", True, "All conversations successfully deleted")
            else:
                self.log_test("seller_test Conversations Deleted", False, f"Still has {len(seller_conversations_after)} conversations")
        
        # Check buyer_test conversations
        print("\n--- Verifying buyer_test conversations deleted ---")
        buyer_login_success, buyer_id, buyer_auth = self.test_login("buyer_test", "buyer123")
        buyer_conversations_after = []
        if buyer_login_success:
            buyer_conversations_after = self.get_conversations("(buyer_test after deletion)")
            if len(buyer_conversations_after) == 0:
                self.log_test("buyer_test Conversations Deleted", True, "All conversations successfully deleted")
            else:
                self.log_test("buyer_test Conversations Deleted", False, f"Still has {len(buyer_conversations_after)} conversations")
        
        return len(seller_conversations_after), len(buyer_conversations_after)

    def run_deletion_test(self):
        """Run the complete deletion test"""
        print("🚀 Starting User Conversation Deletion Test")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Step 1: Check conversations before deletion
        seller_count_before, buyer_count_before = self.check_user_conversations_before_deletion()
        
        # Step 2: Execute deletion script
        deletion_success = self.execute_deletion_script()
        
        if not deletion_success:
            print("\n❌ Deletion script failed. Cannot proceed with verification.")
            return False
        
        # Step 3: Verify deletion results
        seller_count_after, buyer_count_after = self.check_user_conversations_after_deletion()
        
        # Step 4: Summary
        print("\n" + "=" * 80)
        print("📊 DELETION SUMMARY")
        print("=" * 80)
        print(f"seller_test (UserID: 3):")
        print(f"  - Conversations before: {seller_count_before}")
        print(f"  - Conversations after: {seller_count_after}")
        print(f"  - Deleted: {seller_count_before - seller_count_after}")
        
        print(f"\nbuyer_test (UserID: 4):")
        print(f"  - Conversations before: {buyer_count_before}")
        print(f"  - Conversations after: {buyer_count_after}")
        print(f"  - Deleted: {buyer_count_before - buyer_count_after}")
        
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Final verification
        total_deleted = (seller_count_before - seller_count_after) + (buyer_count_before - buyer_count_after)
        if seller_count_after == 0 and buyer_count_after == 0:
            print(f"\n🎉 SUCCESS: All conversations deleted successfully!")
            print(f"   Total conversations removed: {total_deleted}")
            return True
        else:
            print(f"\n⚠️ PARTIAL SUCCESS: Some conversations may remain")
            print(f"   Total conversations removed: {total_deleted}")
            return False

def main():
    """Main test execution"""
    tester = ConversationDeletionTester("http://localhost:8001")
    
    try:
        success = tester.run_deletion_test()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())