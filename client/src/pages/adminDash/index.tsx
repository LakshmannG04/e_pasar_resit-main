import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Endpoint from '@/endpoint';
import { set_token_and_role } from '@/tokenmanager';
import { deletetoken_and_role } from '@/tokenmanager';

const AdminLoginPage = ({ status }: any) => {
    // State for form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Login handler
    const handleLogin = async (event: any) => {
      event.preventDefault();
      setIsLoading(true);
      
      try {
        const response = await axios.post(Endpoint.adminLogin, { username, password });
        if (response.data.status === 200) {
            const { token, userAuth } = response.data.data;
            set_token_and_role(token, userAuth);
          
          if (response.data.data.userAuth === 'Admin' || response.data.data.userAuth === 'SuperAdmin') {
            router.push('/adminDash/users');
          } else {
            alert('Unauthorized: Admin access only.');
            deletetoken_and_role();
            router.push('/adminDash');
          }
        } else {
          alert(response.data.message);
        }
      } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
          alert(error.response.data.message);
        } else {
          alert(`Login error: ${error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // IF "boxOnly", return only box
    if (status == "boxOnly") return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">🛡️ e-Pasar Admin</h1>
                    <h2 className="text-xl font-semibold text-gray-700">Administrative Access</h2>
                    <p className="text-gray-600 mt-2">Sign in to admin dashboard</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Admin Username</label>
                        <input 
                            type="text" 
                            placeholder="Enter admin username" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input 
                            type="password" 
                            placeholder="Enter your password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200"
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-red-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-700 hover:to-purple-700 transform hover:scale-105 transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Signing In...' : 'Admin Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );

    // ELSE, full page
    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-red-600 to-purple-600 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">🛡️ e-Pasar Admin Portal</h1>
                    <p className="text-xl">Secure administrative access to the e-Pasar marketplace</p>
                </div>
            </section>

            {/* Login Form Section */}
            <section className="py-16">
                <div className="container mx-auto px-4 flex justify-center">
                    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Administrative Login</h2>
                            <p className="text-gray-600">Access the admin dashboard</p>
                        </div>
                        
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Username</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter admin username" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input 
                                    type="password" 
                                    placeholder="Enter your password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200"
                                    required
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-red-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-700 hover:to-purple-700 transform hover:scale-105 transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Signing In...' : 'Admin Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AdminLoginPage;