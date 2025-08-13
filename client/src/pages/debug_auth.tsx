import { useEffect, useState } from 'react';
import getToken from '@/tokenmanager';
import axios from 'axios';
import Endpoint from '@/endpoint';

export default function DebugAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get token
        const currentToken = getToken('token');
        setToken(currentToken);

        if (currentToken) {
          // Fetch profile
          const response = await axios.get(Endpoint.userProfile, {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
          setProfile(response.data.data);
        }
      } catch (err: any) {
        setError(err.message || 'Unknown error');
        console.error('Debug Auth Error:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">🔍 Authentication Debug</h1>
        
        <div className="space-y-6">
          <div className="border border-gray-200 rounded p-4">
            <h2 className="text-lg font-semibold mb-2">Token Status</h2>
            <p className="text-sm text-gray-600">
              <strong>Token exists:</strong> {token ? '✅ Yes' : '❌ No'}
            </p>
            {token && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Token (first 50 chars):</p>
                <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                  {token.substring(0, 50)}...
                </code>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded p-4">
            <h2 className="text-lg font-semibold mb-2">Profile Data</h2>
            {profile ? (
              <div className="space-y-2">
                <p><strong>Username:</strong> {profile.Username}</p>
                <p><strong>Name:</strong> {profile.FirstName} {profile.LastName}</p>
                <p><strong>Email:</strong> {profile.Email}</p>
                <p><strong>User Type:</strong> {profile.UserAuth}</p>
                <p><strong>User ID:</strong> {profile.UserID}</p>
                
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h3 className="font-semibold">Raw Profile Object:</h3>
                  <pre className="text-xs mt-2 overflow-auto">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No profile data available</p>
            )}
          </div>

          <div className="border border-gray-200 rounded p-4">
            <h2 className="text-lg font-semibold mb-2">Navigation Logic Check</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Should show Profile link:</strong> {token ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Should show Messages link:</strong> {token ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Is Seller:</strong> {profile?.UserAuth === 'Seller' ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Should show My Shop (for buyers):</strong> {token && profile?.UserAuth !== 'Seller' ? '✅ Yes (Register)' : '❌ No'}</p>
              <p><strong>Should show My Shop (for sellers):</strong> {token && profile?.UserAuth === 'Seller' ? '✅ Yes (Dashboard)' : '❌ No'}</p>
              <p><strong>Should show Login button:</strong> {!token ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Should show Logout button:</strong> {token ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>

          {error && (
            <div className="border border-red-200 rounded p-4 bg-red-50">
              <h2 className="text-lg font-semibold mb-2 text-red-800">Error</h2>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="border border-blue-200 rounded p-4 bg-blue-50">
            <h2 className="text-lg font-semibold mb-2 text-blue-800">Test Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Storage & Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}