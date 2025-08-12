import { useEffect, useState } from "react";
import User_Layout from "../layouts";
import Endpoint from "@/endpoint";
import axios from "axios";
import getToken from "@/tokenmanager";
import { Box, Modal } from "@mui/material";
import React from "react";
import EditProfile from "./editprofileform";

export default function Profile() {
  let [userInfo, setUserInfo] = useState({});
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    
    const token = getToken("token");
    
    const getinfo = async () => {
      const response = await axios.get(`${Endpoint.userProfile}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status == 200) {
        setUserInfo(response.data.data);
      }
    };
    if (token) {
      getinfo();
    }
  }, []);

  if (Object.keys(userInfo).length === 0)
    return (
      <User_Layout>
        <div className="bg-gray-100 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </User_Layout>
    );

  return (
    <>
      <User_Layout>
        <div className="bg-gray-100 min-h-screen">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-4xl font-bold mb-4">👤 My Profile</h1>
              <p className="text-xl">Manage your e-Pasar account information</p>
            </div>
          </section>

          {/* Profile Content */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="w-24 h-24 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {userInfo.FirstName?.charAt(0)}{userInfo.LastName?.charAt(0)}
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                          {userInfo.FirstName} {userInfo.LastName}
                        </h1>
                        <p className="text-gray-600 text-lg">@{userInfo.Username}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleOpen}
                      className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition duration-200 shadow-lg"
                    >
                      ✏️ Edit Profile
                    </button>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Information */}
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
                        📋 Personal Information
                      </h2>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{userInfo.Email}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{userInfo.FirstName}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{userInfo.LastName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
                        📞 Contact Information
                      </h2>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{userInfo.ContactNo}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{userInfo.Address || 'Not provided'}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Account Type</label>
                          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {userInfo.UserAuth || 'User'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">⚡ Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <a 
                        href="/client_pages/orders" 
                        className="bg-blue-50 hover:bg-blue-100 p-6 rounded-lg text-center transition duration-200 border border-blue-200"
                      >
                        <div className="text-3xl mb-3">📦</div>
                        <h3 className="font-semibold text-gray-800">My Orders</h3>
                        <p className="text-gray-600 text-sm">View order history</p>
                      </a>
                      
                      <a 
                        href="/client_pages/cart" 
                        className="bg-green-50 hover:bg-green-100 p-6 rounded-lg text-center transition duration-200 border border-green-200"
                      >
                        <div className="text-3xl mb-3">🛒</div>
                        <h3 className="font-semibold text-gray-800">Shopping Cart</h3>
                        <p className="text-gray-600 text-sm">View cart items</p>
                      </a>
                      
                      <a 
                        href="/client_pages/communications" 
                        className="bg-purple-50 hover:bg-purple-100 p-6 rounded-lg text-center transition duration-200 border border-purple-200"
                      >
                        <div className="text-3xl mb-3">💬</div>
                        <h3 className="font-semibold text-gray-800">Messages</h3>
                        <p className="text-gray-600 text-sm">View conversations</p>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Edit Profile Modal */}
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={style}>
              <EditProfile profileDetails={userInfo}/>
            </Box>
          </Modal>
        </div>
      </User_Layout>
    </>
  );
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 700,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};