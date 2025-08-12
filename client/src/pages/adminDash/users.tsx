import { useEffect, useState } from 'react';
import axios from 'axios';
import Endpoint from '@/endpoint';
import getToken from '@/tokenmanager';
import Admin_Lay from './layout';
import { useRouter } from 'next/router';
import { getRole } from '@/tokenmanager';

export default function Admin_Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [myRole, setMyRole] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();
    const [sellerDetails, setSellerDetails] = useState<Record<number, { ComRegNum: string, ComAddress: string }>>({});


    useEffect(() => {
        const token = getToken('token');
        const role = getRole();
        setMyRole(role || '');

        axios.get(Endpoint.adminUsers, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
            if (res.data.status === 200) {
                console.log('users from API:', res.data.data);
                console.log('type:', typeof res.data.data);
              
                setUsers(res.data.data);
            } else {
                throw new Error(res.data.message || 'Session expired');
            }
        })
        .catch((err) => {
            console.error('Auth failed:', err);
        });        
    }, []);

    const handleSellerStatus = (id: number, status: string) => {
        const token = getToken('token');
        let endpoint = '';

        if (status === 'Approved') {
            endpoint = Endpoint.approveSeller;
        } else if (status === 'Rejected') {
            endpoint = Endpoint.rejectSeller;
        } else {
            alert('Seller is still pending or reset to pending.');
            return;
        }

        axios.patch(endpoint, { id }, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
            alert(response.data.message);
            setUsers(prev =>
              prev.map(user =>
                user.UserID === id
                  ? {
                      ...user,
                      SELLER_INFO: {
                        ...(user.SELLER_INFO || {}),
                        IsVerified: status
                      },
                      UserAuth: status === 'Approved' ? 'Seller' : user.UserAuth
                    }
                  : user
              )
            );
          })          
        .catch(() => alert('Error updating seller status'));
    };

    const handleAccountState = (id: number, state: string) => {
        const token = getToken('token');
        axios.patch(Endpoint.suspendAccount, { id, state }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
          alert(response.data.message);
          setUsers(prev =>
            prev.map(user =>
              user.UserID === id ? { ...user, AccountState: state } : user
            )
          );
        })
        .catch(() => alert('Error updating account state'));
      };      

      const filteredUsers = Array.isArray(users)
      ? users.filter(user =>
          user.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.Email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [];
    

    const fetchSellerInfo = async (userID: number) => {
        if (sellerDetails[userID] || !userID) return;
    
        const token = getToken('token');
        try {
            const res = await axios.get(`${Endpoint.sellerApplication}/${userID}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            if (res.data.status === 200) {
                const { ComRegNum, ComAddress } = res.data.data;
                setSellerDetails(prev => ({
                    ...prev,
                    [userID]: { ComRegNum, ComAddress }
                }));
            } else {
                console.warn(`User ${userID} has no seller app or bad response.`);
            }
        } catch (err) {
            console.error(`Failed to fetch seller info for user ${userID}`, err);
        }
    };
    
    const getUserRoleBadge = (role: string) => {
        const roleClasses: Record<string, string> = {
            'SuperAdmin': 'bg-red-100 text-red-800',
            'Admin': 'bg-purple-100 text-purple-800',
            'Seller': 'bg-green-100 text-green-800',
            'User': 'bg-blue-100 text-blue-800'
        };
        return roleClasses[role] || 'bg-gray-100 text-gray-800';
    };

    const getAccountStateBadge = (state: string) => {
        return state === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800';
    };

    return (
        <Admin_Lay>
            <div className="bg-white rounded-lg shadow-xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-50 to-purple-50 p-6 border-b">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        👥 <span className="ml-2">User Management</span>
                    </h1>
                    <p className="text-gray-600 mt-2">Manage user accounts, seller applications, and account states</p>
                </div>

                {/* Search */}
                <div className="p-6 border-b">
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Search users by username or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200"
                        />
                        <span className="absolute left-3 top-3.5 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                            </svg>
                        </span>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Seller Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Account State
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.UserID} className="hover:bg-gray-50">
                                    {/* User Details */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {user.Username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.Username}</div>
                                                <div className="text-sm text-gray-500">{user.Email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserRoleBadge(user.UserAuth)}`}>
                                            {user.UserAuth}
                                        </span>
                                    </td>

                                    {/* Seller Status */}
                                    <td className="px-6 py-4">
                                        {user.SELLER_INFO ? (
                                            user.SELLER_INFO.IsVerified === 'Pending' ? (
                                                <div className="space-y-3">
                                                    <div className="text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                                        {(() => {
                                                            fetchSellerInfo(user.UserID);
                                                            const info = sellerDetails[user.UserID];
                                                            return (
                                                                <>
                                                                    <div className="mb-2">
                                                                        <span className="font-medium text-gray-700">Company Reg:</span>
                                                                        <div className="text-gray-600">{info?.ComRegNum || 'Loading...'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium text-gray-700">Address:</span>
                                                                        <div className="text-gray-600">{info?.ComAddress || 'Loading...'}</div>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                    <select
                                                        value={user.SELLER_INFO.IsVerified}
                                                        onChange={(e) => handleSellerStatus(user.UserID, e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                    >
                                                        <option value="Pending">Pending Review</option>
                                                        <option value="Approved">✅ Approve</option>
                                                        <option value="Rejected">❌ Reject</option>
                                                    </select>
                                                </div>
                                            ) : (
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    user.SELLER_INFO.IsVerified === 'Approved' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {user.SELLER_INFO.IsVerified}
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">Not Applied</span>
                                        )}
                                    </td>

                                    {/* Account State */}
                                    <td className="px-6 py-4">
                                        {(myRole === 'SuperAdmin') || (myRole === 'Admin' && user.UserAuth !== 'Admin' && user.UserAuth !== 'SuperAdmin') ? (
                                            <select
                                                value={user.AccountState}
                                                onChange={(e) => handleAccountState(user.UserID, e.target.value)}
                                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            >
                                                <option value="Active">✅ Active</option>
                                                <option value="Suspended">🚫 Suspended</option>
                                            </select>
                                        ) : (
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountStateBadge(user.AccountState)}`}>
                                                {user.AccountState}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">👥</div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No users found</h3>
                        <p className="text-gray-600">Try adjusting your search criteria.</p>
                    </div>
                )}
            </div>
        </Admin_Lay>
    );
}