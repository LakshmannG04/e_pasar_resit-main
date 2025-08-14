import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Endpoint from '@/endpoint';
import getToken, { getRole } from '@/tokenmanager';
import User_Layout from '../layouts';
import { useRouter } from 'next/router';

interface Message {
  MessageID: number;
  DisputeID: number;
  SentBy: number;
  Message: string;
  MessageType: 'message' | 'system' | 'admin_note';
  MsgDate: string;
  IsRead: boolean;
  USER: {
    UserID: number;
    Username: string;
    FirstName: string;
    LastName: string;
    UserAuth: string;
  };
}

interface Conversation {
  DisputeID: number;
  Title: string;
  Description: string;
  Status: string;
  CreatedAt: string;
  Complainant: any;
  Respondent: any;
  Handler: any;
}

export default function CommunicationSystem() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState<string>('');

  // Create new conversation states (for admins only)
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [newConversationDescription, setNewConversationDescription] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Report conversation states
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportAttachments, setReportAttachments] = useState<File[]>([]);

  useEffect(() => {
    // Get user role
    const role = getRole();
    setUserRole(role || '');
    
    fetchConversations();
    fetchUnreadCount();
    
    // Check for direct conversation ID parameter (NEW STREAMLINED APPROACH)
    const { conversation } = router.query;
    if (conversation && typeof conversation === 'string') {
      // Find and select the conversation directly
      const conversationId = parseInt(conversation);
      
      // Wait for conversations to load then select the specific one
      setTimeout(() => {
        const targetConversation = conversations.find(conv => conv.DisputeID === conversationId);
        if (targetConversation) {
          setSelectedConversation(targetConversation);
        }
      }, 1000);
    }
  }, [router.query, conversations]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(Endpoint.myConversations, {
        headers: { Authorization: `Bearer ${getToken("token")}` }
      });
      if (response.status === 200) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(Endpoint.unreadCount, {
        headers: { Authorization: `Bearer ${getToken("token")}` }
      });
      if (response.status === 200) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`${Endpoint.conversationMessages}/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${getToken("token")}` }
      });
      if (response.status === 200) {
        setMessages(response.data.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const response = await axios.post(
        `${Endpoint.sendMessage}/${selectedConversation.DisputeID}/send-message`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${getToken("token")}` } }
      );

      if (response.status === 200) {
        setMessages([...messages, response.data.data]);
        setNewMessage('');
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setUserSearchResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      const response = await axios.get(`${Endpoint.searchUsers}?username=${encodeURIComponent(searchTerm)}`, {
        headers: { Authorization: `Bearer ${getToken("token")}` }
      });
      
      if (response.status === 200) {
        setUserSearchResults(response.data.data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUserSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setTargetUsername(user.Username);
    setUserSearchResults([]);
  };

  const createConversation = async () => {
    if (!newConversationTitle.trim() || !newConversationDescription.trim() || !selectedUser) {
      alert('Please fill all fields and select a user to contact');
      return;
    }

    try {
      const response = await axios.post(Endpoint.createDispute, {
        title: newConversationTitle,
        description: newConversationDescription,
        targetUsername: selectedUser.Username
      }, {
        headers: { Authorization: `Bearer ${getToken("token")}` }
      });

      if (response.status === 200) {
        alert('✅ Conversation created successfully!');
        setShowCreateDialog(false);
        setNewConversationTitle('');
        setNewConversationDescription('');
        setTargetUsername('');
        setSelectedUser(null);
        setUserSearchResults([]);
        fetchConversations();
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      alert(error.response?.data?.message || 'Failed to create conversation');
    }
  };

  // Contact Admin function for sellers
  const contactAdmin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(Endpoint.contactAdmin, {
        subject: 'General Inquiry',
        message: 'Opening conversation with admin support.'
      }, {
        headers: { Authorization: `Bearer ${getToken("token")}` }
      });

      if (response.status === 200) {
        const conversationId = response.data.data.conversationId;
        await fetchConversations();
        
        // Redirect to the new conversation
        setTimeout(() => {
          const newConversations = conversations.filter(conv => conv.DisputeID === conversationId);
          if (newConversations.length > 0) {
            setSelectedConversation(newConversations[0]);
            fetchMessages(conversationId);
          }
        }, 1000);
        
        alert('Connected with admin support! You can now type your message.');
      }
    } catch (error) {
      console.error('Error contacting admin:', error);
      alert('Error contacting admin. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.DisputeID);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Open': 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Waiting Response': 'bg-yellow-100 text-yellow-800',
      'Resolved': 'bg-gray-100 text-gray-800',
      'Closed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <User_Layout>
      <div className="bg-gray-100 min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">💬 Communications</h1>
            <p className="text-xl">Connect with sellers, buyers, and support team</p>
            {unreadCount > 0 && (
              <div className="mt-4">
                <span className="inline-block bg-red-500 text-white px-4 py-2 rounded-full font-semibold">
                  {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Main Communication Interface */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden" style={{height: '600px'}}>
              <div className="flex h-full">
                
                {/* Conversations List */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">Your Conversations</h2>
                    </div>
                    {/* Role-specific action buttons */}
                    {userRole === 'Seller' && (
                      <button
                        onClick={contactAdmin}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-200 flex items-center justify-center space-x-2"
                      >
                        <span>👨‍💼</span>
                        <span>{loading ? 'Connecting...' : 'Contact Admin'}</span>
                      </button>
                    )}
                    
                    {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
                      <button
                        onClick={() => setShowCreateDialog(true)}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200 flex items-center justify-center space-x-2"
                      >
                        <span>➕</span>
                        <span>Start New Conversation</span>
                      </button>
                    )}
                    
                    {userRole === 'User' && conversations.length === 0 && (
                      <div className="text-center text-gray-500 p-4">
                        <p className="text-sm">No conversations yet.</p>
                        <p className="text-xs mt-1">Contact sellers from product pages to start conversations.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="text-4xl mb-4">💬</div>
                        <h3 className="font-semibold text-gray-800 mb-2">No conversations yet</h3>
                        <p className="text-gray-600 text-sm">Start a new conversation to communicate with other users</p>
                      </div>
                    ) : (
                      conversations.map((conversation) => (
                        <div
                          key={conversation.DisputeID}
                          onClick={() => selectConversation(conversation)}
                          className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition duration-200 ${
                            selectedConversation?.DisputeID === conversation.DisputeID ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm truncate flex-1 mr-2">
                              {conversation.Title}
                            </h3>
                            <div className="flex flex-col items-end space-y-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.Status)}`}>
                                {conversation.Status}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 truncate mb-2">{conversation.Description}</p>
                          <div className="text-xs text-gray-500">
                            <span>{new Date(conversation.CreatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex flex-col">
                  {selectedConversation ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-900">{selectedConversation.Title}</h3>
                            <p className="text-sm text-gray-600">{selectedConversation.Description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedConversation.Status)}`}>
                              {selectedConversation.Status}
                            </span>
                            {/* Report button for buyers and sellers */}
                            {(userRole === 'User' || userRole === 'Seller') && (
                              <button
                                onClick={() => setShowReportDialog(true)}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition duration-200 flex items-center space-x-1"
                                title="Report this conversation"
                              >
                                <span>🚨</span>
                                <span>Report</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {loading ? (
                          <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center text-gray-500 py-8">
                            <div className="text-4xl mb-4">💭</div>
                            <p className="font-semibold">No messages yet</p>
                            <p className="text-sm mt-1">Start the conversation by sending a message below</p>
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.MessageID}
                              className={`flex ${message.MessageType === 'system' ? 'justify-center' : 'justify-start'}`}
                            >
                              {message.MessageType === 'system' ? (
                                <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm">
                                  {message.Message}
                                </div>
                              ) : (
                                <div className="max-w-xs lg:max-w-md">
                                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                        {message.USER.FirstName.charAt(0)}
                                      </div>
                                      <span className="text-sm font-medium text-gray-900">
                                        {message.USER.FirstName} {message.USER.LastName}
                                      </span>
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        message.USER.UserAuth === 'Admin' ? 'bg-red-100 text-red-600' :
                                        message.USER.UserAuth === 'Seller' ? 'bg-green-100 text-green-600' :
                                        'bg-blue-100 text-blue-600'
                                      }`}>
                                        {message.USER.UserAuth}
                                      </span>
                                    </div>
                                    <p className="text-gray-800 text-sm">{message.Message}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                      {new Date(message.MsgDate).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="p-4 border-t border-gray-200 bg-white">
                        <div className="flex space-x-3">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim()}
                            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                      <div className="text-center">
                        <div className="text-6xl mb-4">💬</div>
                        <p className="text-xl font-semibold mb-2">Select a conversation to start messaging</p>
                        <p className="text-gray-600">Choose from your existing conversations or start a new one</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Create Conversation Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  ➕ <span className="ml-2">Start New Conversation</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={newConversationTitle}
                      onChange={(e) => setNewConversationTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                      placeholder="e.g., Product Quality Issue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newConversationDescription}
                      onChange={(e) => setNewConversationDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 resize-none"
                      placeholder="Describe your issue or inquiry..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search User by Username</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={targetUsername}
                        onChange={(e) => {
                          setTargetUsername(e.target.value);
                          searchUsers(e.target.value);
                          if (!e.target.value.trim()) {
                            setSelectedUser(null);
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                        placeholder="Type username to search..."
                      />
                      
                      {/* Loading indicator */}
                      {searchingUsers && (
                        <div className="absolute right-3 top-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        </div>
                      )}
                      
                      {/* Search results dropdown */}
                      {userSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {userSearchResults.map((user) => (
                            <div
                              key={user.UserID}
                              onClick={() => selectUser(user)}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">@{user.Username}</div>
                                  <div className="text-sm text-gray-600">{user.FirstName} {user.LastName}</div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  user.UserAuth === 'Admin' ? 'bg-red-100 text-red-600' :
                                  user.UserAuth === 'Seller' ? 'bg-green-100 text-green-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  {user.UserAuth}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Selected user display */}
                      {selectedUser && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-green-900">Selected: @{selectedUser.Username}</div>
                              <div className="text-sm text-green-700">{selectedUser.FirstName} {selectedUser.LastName}</div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              selectedUser.UserAuth === 'Admin' ? 'bg-red-100 text-red-600' :
                              selectedUser.UserAuth === 'Seller' ? 'bg-green-100 text-green-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {selectedUser.UserAuth}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedUser(null);
                              setTargetUsername('');
                            }}
                            className="mt-2 text-sm text-red-600 hover:text-red-800"
                          >
                            ✕ Remove selection
                          </button>
                        </div>
                      )}
                      
                      {/* No results message */}
                      {targetUsername.trim() && !searchingUsers && userSearchResults.length === 0 && !selectedUser && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="text-sm text-gray-600 text-center">
                            No users found with username "{targetUsername}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                  <button
                    onClick={() => setShowCreateDialog(false)}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createConversation}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200"
                  >
                    Start Conversation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Conversation Dialog */}
        {showReportDialog && selectedConversation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  🚨 <span className="ml-2">Report Conversation</span>
                </h3>
                
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Reporting:</strong> {selectedConversation.Title}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    This report will be reviewed by our admin team.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200"
                      placeholder="Brief title for your report"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200"
                      placeholder="Describe the issue with this conversation..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attachments (Optional)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        if (e.target.files) {
                          setReportAttachments(Array.from(e.target.files));
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max 5 files, 10MB each. Supported: Images, PDF, Documents
                    </p>
                    {reportAttachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600">
                          {reportAttachments.length} file(s) selected:
                        </p>
                        <ul className="text-xs text-gray-600">
                          {reportAttachments.map((file, index) => (
                            <li key={index}>• {file.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                  <button
                    onClick={() => {
                      setShowReportDialog(false);
                      setReportTitle('');
                      setReportDescription('');
                      setReportAttachments([]);
                    }}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={reportConversation}
                    disabled={!reportDescription.trim() || loading}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition duration-200"
                  >
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </User_Layout>
  );
}