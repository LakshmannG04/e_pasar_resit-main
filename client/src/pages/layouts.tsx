import Link from "next/link";
import getToken from "@/tokenmanager";
import { deletetoken } from "@/tokenmanager";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Modal, Box } from "@mui/material";
import React from "react";
import LoginPage from "./client_pages/login";
import { destroyCart } from "../utils/cart_ops";
import axios from "axios";
import Endpoint from "@/endpoint";

interface Profile {
  UserAuth?: string;
  [key: string]: any;
}

export default function User_Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  // Always declare hooks top-level, in the same order, every render:
  const [mounted, setMounted] = useState(false);
  const [tokenExist, setTokenExist] = useState(false);
  const [open, setOpen] = React.useState(false);
  const [profile, setProfile] = useState<Profile>({});
  const [isSeller, setIsSeller] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const style = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 700,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  const PUBLIC_ROUTES = [
    "/",
    "/client_pages/category",
    "/client_pages/signup",
    "/client_pages/register_seller",
    "/client_pages/productpage",
  ];

  // Mark hydrated on client
  useEffect(() => setMounted(true), []);

  // Token check / route guard
  useEffect(() => {
    const token = getToken("token");
    const isPublic = PUBLIC_ROUTES.includes(router.pathname);

    if (!token && !isPublic) {
      alert("Session Ended");
      router.push("/");
    }
    setTokenExist(!!token);
  }, [router.pathname]);

  // Load profile when token exists (client-only)
  useEffect(() => {
    if (!mounted) return;
    const token = getToken("token");
    if (!token) return;

    let cancelled = false;

    const getProfile = async () => {
      try {
        const response = await axios.get(Endpoint.userProfile, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled && response.status === 200) {
          setProfile(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching profile:", (error as any)?.response?.data || (error as any)?.message || error);
      }
    };
    getProfile();

    return () => {
      cancelled = true;
    };
  }, [mounted, tokenExist]);

  useEffect(() => {
    setIsSeller(profile.UserAuth === "Seller");
  }, [profile]);

  const logOutOperations = async () => {
    try {
      deletetoken("token");
      setTokenExist(false);
      destroyCart();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header and Navigation */}
      <header className="header p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="header-title text-xl font-semibold">e-Pasar</h1>

          <div className="header-nav flex items-center space-x-4" suppressHydrationWarning>
            {/* Always-safe links (same SSR/CSR) */}
            <Link href="/" className="hover:text-blue-600 cursor-pointer">Home |</Link>
            <Link
              href="/client_pages/category?category_id=all"
              className="hover:text-blue-600 cursor-pointer"
            >
              Products |
            </Link>

            {/* Client-only area to avoid hydration mismatch */}
            {!mounted ? (
              <span className="text-gray-400">...</span>
            ) : (
              <>
                {tokenExist && (
                  <Link href="/client_pages/profile" className="hover:text-blue-600 cursor-pointer">
                    Profile |
                  </Link>
                )}
                {tokenExist && (
                  <Link href="/client_pages/orders" className="hover:text-blue-600 cursor-pointer">
                    My Orders |
                  </Link>
                )}
                {tokenExist && (
                  <Link href="/client_pages/communications" className="hover:text-blue-600 cursor-pointer">
                    💬 Messages |
                  </Link>
                )}
                {tokenExist && isSeller && (
                  <Link
                    href="/sellerDash/seller_products?category_id=all"
                    className="hover:text-blue-600 cursor-pointer"
                  >
                    My Shop |
                  </Link>
                )}
                {tokenExist && !isSeller && (
                  <Link
                    href="/client_pages/register_seller"
                    className="hover:text-blue-600 cursor-pointer"
                  >
                    My Shop |
                  </Link>
                )}

                {tokenExist ? (
                  <button onClick={logOutOperations} className="hover:text-red-600 cursor-pointer">Log Out</button>
                ) : (
                  <button onClick={handleOpen} className="hover:text-green-600 cursor-pointer">Login</button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main>{children}</main>

      {/* Login Modal */}
      <div>
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <LoginPage status="boxOnly" />
          </Box>
        </Modal>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto text-center">
          <p>&copy; 2024 e-Pasar. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-4" />
        </div>
      </footer>
    </div>
  );
}
