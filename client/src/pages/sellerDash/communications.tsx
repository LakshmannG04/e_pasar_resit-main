import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Endpoint from '@/endpoint';
import getToken from '@/tokenmanager';
import Sellers_Lay from './layout';

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
  Priority: string;
  CreatedAt: string;
  Complainant: any;
  Respondent: any;
  Handler: any;
}

export default function SellerCommunicationSystem() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Create new conversation states
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [newConversationDescription, setNewConversationDescription] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
    // Set up polling for new messages
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (selectedConversation) {
        fetchMessages(selectedConversation.DisputeID);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [selectedConversation]);

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
        targetUsername: selectedUser.Username,
        priority: priority
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

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.DisputeID);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Open': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'Low': 'bg-gray-100 text-gray-600',
      'Medium': 'bg-blue-100 text-blue-600',
      'High': 'bg-orange-100 text-orange-600',
      'Urgent': 'bg-red-100 text-red-600'
    };
    return colors[priority] || 'bg-gray-100 text-gray-600';
  };

  const getParticipantInfo = (conversation: Conversation, currentUserId: number) => {
    // Determine who the seller is talking to
    const isComplainant = conversation.Complainant?.UserID === currentUserId;
    const otherParticipant = isComplainant ? conversation.Respondent : conversation.Complainant;
    
    return {
      name: `${otherParticipant?.FirstName || 'Unknown'} ${otherParticipant?.LastName || 'User'}`,
      username: otherParticipant?.Username || 'unknown',
      role: otherParticipant?.UserAuth || 'User'
    };
  };

  return (
    <Sellers_Lay>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💬 Communications</h1>
              <p className="text-gray-600 mt-1">Connect with buyers, customers, and support team</p>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
                  {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Communication Interface */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{height: '70vh'}}>
            <div className="flex h-full">
              
              {/* Conversations List */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Your Conversations</h2>
                    <span className="text-sm text-gray-500">
                      {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>💬</span>
                    <span>Start New Chat</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="text-4xl mb-4">🔇</div>
                      <h3 className="font-semibold text-gray-800 mb-2">No conversations yet</h3>
                      <p className="text-gray-600 text-sm">Start communicating with your customers and buyers</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => {
                      const participant = getParticipantInfo(conversation, 0); // We'll get current user ID from token
                      return (
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
                              <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(conversation.Priority)}`}>
                                {conversation.Priority}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 truncate mb-2">{conversation.Description}</p>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>With: @{participant.username}</span>
                            <span>{new Date(conversation.CreatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })
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
                          <p className="text-sm text-gray-600 mt-1">{selectedConversation.Description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedConversation.Status)}`}>
                            {selectedConversation.Status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(selectedConversation.Priority)}`}>
                            {selectedConversation.Priority}
                          </span>
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
                        messages.map((message) => {
                          const isCurrentUser = message.SentBy.toString() === getToken("token"); // Will need proper comparison
                          return (
                            <div
                              key={message.MessageID}
                              className={`flex ${
                                message.MessageType === 'system' 
                                  ? 'justify-center' 
                                  : isCurrentUser 
                                    ? 'justify-end' 
                                    : 'justify-start'
                              }`}
                            >
                              {message.MessageType === 'system' ? (
                                <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm">
                                  {message.Message}
                                </div>
                              ) : (
                                <div className="max-w-xs lg:max-w-md">
                                  <div className={`rounded-lg shadow-sm border p-3 ${
                                    isCurrentUser 
                                      ? 'bg-green-500 text-white border-green-600' 
                                      : 'bg-white border-gray-200'
                                  }`}>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                        isCurrentUser 
                                          ? 'bg-white text-green-500' 
                                          : 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                                      }`}>
                                        {message.USER.FirstName.charAt(0)}
                                      </div>
                                      <span className={`text-xs font-medium ${isCurrentUser ? 'text-white' : 'text-gray-900'}`}>
                                        {message.USER.FirstName} {message.USER.LastName}
                                      </span>
                                      <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                                        message.USER.UserAuth === 'Admin' ? 'bg-red-100 text-red-600' :
                                        message.USER.UserAuth === 'Seller' ? 'bg-green-100 text-green-600' :
                                        'bg-blue-100 text-blue-600'
                                      }`}>
                                        {message.USER.UserAuth}
                                      </span>
                                    </div>
                                    <p className={`text-sm ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                                      {message.Message}
                                    </p>
                                    <p className={`text-xs mt-2 ${isCurrentUser ? 'text-green-100' : 'text-gray-500'}`}>
                                      {new Date(message.MsgDate).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
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
                          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center space-x-2"
                        >
                          <span>📤</span>
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💼</div>
                      <p className="text-xl font-semibold mb-2">Select a conversation to start messaging</p>
                      <p className="text-gray-600 mb-4">Choose from your existing conversations or start a new one</p>
                      <button
                        onClick={() => setShowCreateDialog(true)}
                        className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200"
                      >
                        Start New Conversation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Conversation Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  💬 <span className="ml-2">Start New Conversation</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject/Title</label>
                    <input
                      type="text"
                      value={newConversationTitle}
                      onChange={(e) => setNewConversationTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                      placeholder="e.g., Product Quality Question, Order Support"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={newConversationDescription}
                      onChange={(e) => setNewConversationDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 resize-none"
                      placeholder="Describe your message or inquiry..."
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                  <button
                    onClick={() => {
                      setShowCreateDialog(false);
                      setNewConversationTitle('');
                      setNewConversationDescription('');
                      setTargetUsername('');
                      setSelectedUser(null);
                      setUserSearchResults([]);
                    }}
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
      </div>
    </Sellers_Lay>
  );
}