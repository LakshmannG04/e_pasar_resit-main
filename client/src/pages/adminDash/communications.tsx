import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Admin_Layout from './layout';
import Endpoint from '@/endpoint';
import getToken from '@/tokenmanager';

interface Conversation {
  DisputeID: number;
  Title: string;
  Description: string;
  Status: string;
  Priority: string;
  CreatedAt: string;
  IsResolved: boolean;
  Complainant: {
    UserID: number;
    Username: string;
    FirstName: string;
    LastName: string;
    UserAuth: string;
  };
  Respondent: {
    UserID: number;
    Username: string;
    FirstName: string;
    LastName: string;
    UserAuth: string;
  };
  Handler?: {
    UserID: number;
    Username: string;
    FirstName: string;
    LastName: string;
    UserAuth: string;
  };
}

export default function AdminCommunications() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(Endpoint.myConversations, {
        headers: { Authorization: `Bearer ${getToken("token")}` }
      });
      if (response.status === 200) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const manageConversation = async (action: string, status?: string) => {
    if (!selectedConversation) return;

    try {
      const response = await axios.patch(
        `${Endpoint.manageDispute}/${selectedConversation.DisputeID}/manage`,
        {
          action,
          status,
          adminNote: adminNote || undefined
        },
        { headers: { Authorization: `Bearer ${getToken("token")}` } }
      );

      if (response.status === 200) {
        alert(`✅ Conversation ${action}d successfully!`);
        setAdminNote('');
        fetchConversations();
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Error managing conversation:', error);
      alert('Failed to manage conversation');
    }
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

  const getFilteredConversations = (filter: string) => {
    switch (filter) {
      case 'urgent':
        return conversations.filter(c => c.Priority === 'Urgent');
      case 'open':
        return conversations.filter(c => c.Status === 'Open');
      case 'inprogress':
        return conversations.filter(c => c.Status === 'In Progress');
      case 'resolved':
        return conversations.filter(c => c.Status === 'Resolved');
      default:
        return conversations;
    }
  };

  const [activeFilter, setActiveFilter] = useState('all');
  const filteredConversations = getFilteredConversations(activeFilter);

  return (
    <Admin_Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-2xl font-bold text-gray-900">🔧 Admin Communication Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage and resolve conversations between users, sellers, and customers
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { key: 'all', label: 'All Conversations', count: conversations.length },
                  { key: 'urgent', label: 'Urgent', count: conversations.filter(c => c.Priority === 'Urgent').length },
                  { key: 'open', label: 'Open', count: conversations.filter(c => c.Status === 'Open').length },
                  { key: 'inprogress', label: 'In Progress', count: conversations.filter(c => c.Status === 'In Progress').length },
                  { key: 'resolved', label: 'Resolved', count: conversations.filter(c => c.Status === 'Resolved').length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeFilter === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No conversations found for this filter</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.DisputeID}
                          onClick={() => setSelectedConversation(conversation)}
                          className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConversation?.DisputeID === conversation.DisputeID
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {conversation.Title}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.Status)}`}>
                                  {conversation.Status}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(conversation.Priority)}`}>
                                  {conversation.Priority}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{conversation.Description}</p>
                              <div className="flex items-center text-xs text-gray-500 space-x-4">
                                <span>
                                  <strong>From:</strong> {conversation.Complainant.FirstName} {conversation.Complainant.LastName} ({conversation.Complainant.UserAuth})
                                </span>
                                <span>
                                  <strong>To:</strong> {conversation.Respondent.FirstName} {conversation.Respondent.LastName} ({conversation.Respondent.UserAuth})
                                </span>
                                <span>
                                  {new Date(conversation.CreatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Management Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation Management</h3>
                  
                  {selectedConversation ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">{selectedConversation.Title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{selectedConversation.Description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-medium">Status:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full ${getStatusColor(selectedConversation.Status)}`}>
                              {selectedConversation.Status}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Priority:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full ${getPriorityColor(selectedConversation.Priority)}`}>
                              {selectedConversation.Priority}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs space-y-1">
                          <div>
                            <strong>Complainant:</strong> {selectedConversation.Complainant.FirstName} {selectedConversation.Complainant.LastName}
                            <span className="ml-2 text-gray-500">({selectedConversation.Complainant.UserAuth})</span>
                          </div>
                          <div>
                            <strong>Respondent:</strong> {selectedConversation.Respondent.FirstName} {selectedConversation.Respondent.LastName}
                            <span className="ml-2 text-gray-500">({selectedConversation.Respondent.UserAuth})</span>
                          </div>
                          {selectedConversation.Handler && (
                            <div>
                              <strong>Handler:</strong> {selectedConversation.Handler.FirstName} {selectedConversation.Handler.LastName}
                              <span className="ml-2 text-gray-500">({selectedConversation.Handler.UserAuth})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Note (Optional)
                        </label>
                        <textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Add an administrative note..."
                        />
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Quick Actions:</h5>
                        
                        {selectedConversation.Status === 'Open' && (
                          <button
                            onClick={() => manageConversation('assign', 'In Progress')}
                            className="w-full px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                          >
                            📋 Take Ownership (Set In Progress)
                          </button>
                        )}

                        {selectedConversation.Status !== 'Resolved' && (
                          <button
                            onClick={() => manageConversation('resolve')}
                            className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            ✅ Mark as Resolved
                          </button>
                        )}

                        {selectedConversation.Status !== 'Closed' && (
                          <button
                            onClick={() => manageConversation('close')}
                            className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            🔒 Close Conversation
                          </button>
                        )}

                        <button
                          onClick={() => window.open(`/client_pages/communications`, '_blank')}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          💬 Open Full Chat
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">
                        Select a conversation to manage it
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Admin_Layout>
  );
}