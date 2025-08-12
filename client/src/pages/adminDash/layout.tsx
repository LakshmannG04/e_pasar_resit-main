import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';
import getToken from '@/tokenmanager';
import Endpoint from '@/endpoint';
import Cookies from 'js-cookie';
import { deletetoken_and_role } from '@/tokenmanager';

export default function Admin_Lay({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authenticated, setAuthenticated] = useState(false);
    const [myRole, setMyRole] = useState<string>('');

    useEffect(() => {
        const token = Cookies.get('token');
        const expiry = Cookies.get('expiry');
    
        if (!token || !expiry) {
            deletetoken_and_role();
            router.replace('/adminDash');
            return;
        }
    
        const expiryTime = parseInt(expiry, 10);
        const now = Date.now();
        const timeout = expiryTime - now;
    
        if (timeout <= 0) {
            deletetoken_and_role();
            router.replace('/adminDash');
            return;
        }
    
        const timer = setTimeout(() => {
            alert('Session expired. Please log in again.');
            deletetoken_and_role();
            router.replace('/adminDash');
        }, timeout);
    
        setAuthenticated(true);
    
        return () => clearTimeout(timer);
    }, [router]);    
          
      
    const logOutOperations = () => {
        deletetoken_and_role();
        router.push('/adminDash');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {authenticated && (
                <>
                    {/* Header */}
                    <header className="bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-lg">
                        <div className="container mx-auto px-4 py-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <h1 className="text-2xl font-bold">🌾 e-Pasar</h1>
                                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                                        Admin Dashboard
                                    </span>
                                </div>
                                <nav className="flex items-center space-x-6">
                                    <Link 
                                        href="/adminDash/users"
                                        className="flex items-center space-x-2 hover:bg-white hover:bg-opacity-10 px-3 py-2 rounded-lg transition duration-200"
                                    >
                                        <span>👥</span>
                                        <span>Users</span>
                                    </Link>
                                    <Link 
                                        href="/adminDash/communications"
                                        className="flex items-center space-x-2 hover:bg-white hover:bg-opacity-10 px-3 py-2 rounded-lg transition duration-200"
                                    >
                                        <span>💬</span>
                                        <span>Communications</span>
                                    </Link>
                                    <Link 
                                        href="/adminDash/createadmin"
                                        className="flex items-center space-x-2 hover:bg-white hover:bg-opacity-10 px-3 py-2 rounded-lg transition duration-200"
                                    >
                                        <span>🛡️</span>
                                        <span>Create Admin</span>
                                    </Link>
                                    <Link 
                                        href="/adminDash/addcategory"
                                        className="flex items-center space-x-2 hover:bg-white hover:bg-opacity-10 px-3 py-2 rounded-lg transition duration-200"
                                    >
                                        <span>📂</span>
                                        <span>Add Category</span>
                                    </Link>
                                    <button 
                                        onClick={logOutOperations} 
                                        className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition duration-200 font-medium"
                                    >
                                        <span>🚪</span>
                                        <span>Logout</span>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="container mx-auto px-4 py-8 min-h-screen">{children}</main>

                    {/* Footer */}
                    <footer className="bg-gray-800 text-white py-8">
                        <div className="container mx-auto px-4 text-center">
                            <p className="text-gray-300">&copy; 2024 e-Pasar. All rights reserved.</p>
                            <p className="text-gray-400 text-sm mt-2">Administrative Control Panel</p>
                        </div>
                    </footer>
                </>
            )}
        </div>
    );
}