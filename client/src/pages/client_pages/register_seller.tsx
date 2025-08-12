import React, { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Endpoint from "@/endpoint";
import getToken, { set_token } from "@/tokenmanager";
import User_Layout from "../layouts";
import { getCartFromCookie } from "../../utils/cart_ops";

export default function SellerSignupPage() {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [comRegNum, setComRegNum] = useState("");
  const [comAddress, setComAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Validate form fields
  const validateForm = () => {
    let newErrors: { [key: string]: string } = {};

    if (!comAddress.trim()) newErrors.comAddress = "Company Address is required.";
    if (!comRegNum.trim()) newErrors.comRegNum = "Company Registration No is required.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to handle signup
  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${Endpoint.signup}/seller`, {
       "comRegNum":comRegNum,
       "comAddress":comAddress
      },{headers: { 'Authorization': `Bearer ${getToken('token')}`}});
      
      if(response.status == 200){
        alert('✅ Seller application submitted successfully! Please wait for admin approval.');
        router.push("../")
      }else{
        alert("Error submitting application. Please try again.");
      }
      
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error submitting application');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <User_Layout>
      <div className="bg-gray-100 min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">🏪 Become a Seller</h1>
            <p className="text-xl">Join thousands of farmers selling on e-Pasar marketplace</p>
          </div>
        </section>

        {/* Registration Form Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 flex justify-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Seller Registration</h2>
                <p className="text-gray-600">Complete your seller application to start selling</p>
              </div>

              {/* Info Section */}
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                  ℹ️ <span className="ml-2">What happens next?</span>
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Your application will be reviewed by our admin team</li>
                  <li>• You'll receive an email notification about approval status</li>
                  <li>• Once approved, you can start listing your products</li>
                  <li>• Access seller dashboard and analytics tools</li>
                </ul>
              </div>
              
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Registration Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Registration Number *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your company registration number"
                      value={comRegNum}
                      onChange={(e) => setComRegNum(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                      required
                    />
                    {errors.comRegNum && (
                      <p className="text-red-500 text-sm mt-1">{errors.comRegNum}</p>
                    )}
                  </div>

                  {/* Company Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Address *
                    </label>
                    <textarea
                      placeholder="Enter your complete company address"
                      value={comAddress}
                      onChange={(e) => setComAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 resize-none"
                      required
                    />
                    {errors.comAddress && (
                      <p className="text-red-500 text-sm mt-1">{errors.comAddress}</p>
                    )}
                  </div>
                </div>

                {/* Benefits Section */}
                <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-4 flex items-center">
                    🌟 <span className="ml-2">Seller Benefits</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                    <div className="flex items-start space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>AI-powered image generation for products</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Smart category suggestions</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Direct communication with buyers</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Comprehensive order management</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Real-time sales analytics</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>24/7 support system</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Submitting Application...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>🚀</span>
                        <span>Submit Seller Application</span>
                      </div>
                    )}
                  </button>
                </div>

                <p className="text-center text-gray-600 text-sm">
                  Already have an account? <a href="/client_pages/login" className="text-green-600 hover:text-green-700 font-semibold">Sign in here</a>
                </p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </User_Layout>
  );
}