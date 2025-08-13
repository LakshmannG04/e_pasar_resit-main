// client/src/pages/client_pages/login.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

import Endpoint from '@/endpoint';
import { set_token } from '@/tokenmanager';
import User_Layout from '@/pages/layouts';
import { getCartFromCookie } from '../../utils/cart_ops';

type LoginErrors = {
  username?: string;
  password?: string;
  general?: string;
};

const LoginPage = ({ status }: any) => {
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});

  // Client-only cart read to avoid SSR hydration mismatch
  const [cart, setCart] = useState<any[]>([]);
  useEffect(() => {
    try {
      const c = getCartFromCookie() || [];
      setCart(c);
    } catch {
      setCart([]);
    }
  }, []);

  const router = useRouter();

  const validateForm = () => {
    const e: LoginErrors = {};
    if (!username) e.username = 'Username is required.';
    if (!password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    console.log('🔐 Attempting login for:', username);
    console.log('🌐 Using endpoint:', Endpoint.login);

    try {
      const response = await axios.post(Endpoint.login, { username, password });
      
      console.log('📡 Login response:', response.data);

      if (response?.data?.status === 200 && response.data.data?.token) {
        const token: string = response.data.data.token;
        const userAuth: string | undefined = response.data.data.userAuth;
        
        console.log('✅ Login successful! UserAuth:', userAuth);
        console.log('🎫 Token received:', token.substring(0, 20) + '...');
        
        // Set token
        set_token(token);
        
        // Verify token was set
        const savedToken = getToken('token');
        console.log('💾 Token verification:', savedToken ? 'Success' : 'Failed');

        // Merge cookie cart into backend cart (if any)
        if (Array.isArray(cart) && cart.length > 0) {
          console.log('🛒 Merging cart items...');
          for (const item of cart) {
            const body = {
              productId: `${item.ProductID}`,
              quantity: item?.Quantity ?? '0',
            };
            await axios.post(`${Endpoint.cart}/add`, body, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }

        console.log('🎉 Login process completed successfully!');
        alert(response.data.message || 'Login successful');

        // Role-based redirect
        console.log('🔄 Redirecting based on role:', userAuth);
        if (userAuth === 'SuperAdmin' || userAuth === 'Admin') {
          console.log('➡️  Redirecting to admin dashboard');
          router.replace('/admin');
        } else if (userAuth === 'Seller') {
          console.log('➡️  Redirecting to seller dashboard');
          router.replace('/sellerDash/seller_products?category_id=all');
        } else {
          console.log('➡️  Redirecting to home page');
          router.replace('/');
        }
        return;
      }

      // Non-200 from API or missing token
      console.error('❌ Login failed - Invalid response:', response.data);
      alert(response?.data?.message || 'Login failed - Invalid response');
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Login failed';
      alert(errorMessage);
    }
  };

  // Modal-only variant (used by layouts.tsx)
  if (status === 'boxOnly') {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🌾 e-Pasar</h1>
            <h2 className="text-xl font-semibold text-gray-700">Welcome Back!</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                required
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition duration-200 shadow-lg"
            >
              Sign In
            </button>

            <p className="text-center text-gray-600">
              Don&apos;t have an account?{' '}
              <a href="/client_pages/signup" className="text-green-600 hover:text-green-700 font-semibold">
                Sign up
              </a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Full page variant
  return (
    <User_Layout>
      <div className="bg-gray-100 min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">🌾 Welcome Back to E-Pasar</h1>
            <p className="text-xl">Your Smart Agricultural Marketplace</p>
          </div>
        </section>

        {/* Login Form Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 flex justify-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign In</h2>
                <p className="text-gray-600">Access your e-Pasar account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                  />
                  {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-green-600 hover:text-green-700 font-medium">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition duration-200 shadow-lg"
                >
                  Sign In
                </button>

                <p className="text-center text-gray-600">
                  Don&apos;t have an account?{' '}
                  <a href="/client_pages/signup" className="text-green-600 hover:text-green-700 font-semibold">
                    Sign up
                  </a>
                </p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </User_Layout>
  );
};

export default LoginPage;
