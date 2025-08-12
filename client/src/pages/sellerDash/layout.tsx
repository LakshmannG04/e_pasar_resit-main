import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import getToken, { deletetoken } from '@/tokenmanager';
import axios from 'axios';
import Endpoint from '@/endpoint';

type Profile = {
  UserAuth?: string;
  [key: string]: any;
};

export default function Sellers_Lay({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({});
  const [mounted, setMounted] = useState(false);

  // Mount guard to avoid SSR/CSR mismatch on auth UI
  useEffect(() => setMounted(true), []);

  // Auth guard: must be logged in + Seller/Admin
  useEffect(() => {
    if (!mounted) return;
    const token = getToken('token');
    if (!token) {
      router.replace('/'); // not logged in -> home
      return;
    }

    (async () => {
      try {
        const res = await axios.get(Endpoint.userProfile, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const p = res?.data?.data || {};
        setProfile(p);

        if (p.UserAuth !== 'Seller' && p.UserAuth !== 'Admin' && p.UserAuth !== 'SuperAdmin') {
          // not a seller/admin -> send back to home
          router.replace('/');
        }
      } catch (e) {
        console.error('Error loading seller profile:', e);
        router.replace('/');
      }
    })();
  }, [mounted, router]);

  const logOut = async () => {
    deletetoken('token');
    router.push('/'); // back to home
  };

  if (!mounted) {
    // stable shell to keep SSR/CSR trees identical
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Seller Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-semibold">
              e-Pasar
            </Link>
            <nav className="hidden md:flex items-center space-x-4 text-sm text-gray-700">
              <Link href="/sellerDash/seller_products?category_id=all" className="hover:text-blue-600">
                My Products
              </Link>
              <Link href="/sellerDash/addProduct" className="hover:text-blue-600">
                Add Product
              </Link>
              <Link href="/client_pages/orders" className="hover:text-blue-600">
                Orders
              </Link>
              {(profile.UserAuth === 'Admin' || profile.UserAuth === 'SuperAdmin') && (
                <Link href="/adminDash" className="hover:text-blue-600">
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {profile?.Username ? `👤 ${profile.Username}` : 'Seller'}
            </span>
            <button onClick={logOut} className="text-red-600 hover:text-red-700 text-sm">
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-300">&copy; 2024 e-Pasar. All rights reserved.</p>
          <p className="text-gray-400 text-sm mt-2">Empowering farmers and sellers</p>
        </div>
      </footer>
    </div>
  );
}