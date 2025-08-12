import Sellers_Lay from "./layout"
import Link from "next/link"

export default function Sellers_Dash(){
    return(
        <Sellers_Lay>
            <div className="min-h-screen">
                {/* Welcome Section */}
                <section className="bg-white rounded-lg shadow-xl p-8 mb-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">
                            🌾 Welcome to Your Seller Dashboard
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Manage your products, track orders, and grow your agricultural business
                        </p>
                    </div>
                </section>

                {/* Quick Actions Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    {/* Manage Products */}
                    <Link href="/sellerDash/seller_products?category_id=all">
                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer border-l-4 border-green-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-4xl">📦</div>
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                    Active
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Products</h3>
                            <p className="text-gray-600 mb-4">Add, edit, and manage your product inventory with AI features</p>
                            <div className="flex items-center text-green-600 font-semibold">
                                <span>Go to Products</span>
                                <span className="ml-2">→</span>
                            </div>
                        </div>
                    </Link>

                    {/* View Orders */}
                    <Link href="/sellerDash/seller_orders?category_id=all">
                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer border-l-4 border-blue-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-4xl">📋</div>
                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                    Track
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">View Orders</h3>
                            <p className="text-gray-600 mb-4">Track and manage customer orders and deliveries</p>
                            <div className="flex items-center text-blue-600 font-semibold">
                                <span>View Orders</span>
                                <span className="ml-2">→</span>
                            </div>
                        </div>
                    </Link>

                    {/* Messages */}
                    <Link href="/client_pages/communications">
                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer border-l-4 border-purple-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-4xl">💬</div>
                                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                                    Chat
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Messages</h3>
                            <p className="text-gray-600 mb-4">Communicate with customers and support team</p>
                            <div className="flex items-center text-purple-600 font-semibold">
                                <span>Open Messages</span>
                                <span className="ml-2">→</span>
                            </div>
                        </div>
                    </Link>
                </section>

                {/* Statistics Overview */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold mb-2">--</div>
                        <div className="font-semibold">Total Products</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold mb-2">--</div>
                        <div className="font-semibold">Orders This Month</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold mb-2">--</div>
                        <div className="font-semibold">Revenue</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold mb-2">--</div>
                        <div className="font-semibold">Active Listings</div>
                    </div>
                </section>

                {/* Recent Activity */}
                <section className="bg-white rounded-lg shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        📊 <span className="ml-2">Quick Overview</span>
                    </h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Tips */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 Seller Tips</h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                                    <span className="text-green-600">✅</span>
                                    <div>
                                        <p className="font-medium text-gray-800">Use AI Image Generation</p>
                                        <p className="text-sm text-gray-600">Generate professional product images automatically</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                                    <span className="text-blue-600">🎯</span>
                                    <div>
                                        <p className="font-medium text-gray-800">AI Category Suggestions</p>
                                        <p className="text-sm text-gray-600">Get smart category recommendations for your products</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                                    <span className="text-purple-600">💬</span>
                                    <div>
                                        <p className="font-medium text-gray-800">Stay Connected</p>
                                        <p className="text-sm text-gray-600">Communicate with customers through our messaging system</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Quick Actions</h3>
                            <div className="space-y-3">
                                <Link href="/sellerDash/seller_products?category_id=all">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition duration-200">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">➕</span>
                                            <span className="font-medium text-gray-800">Add New Product</span>
                                        </div>
                                        <span className="text-gray-400">→</span>
                                    </div>
                                </Link>
                                <Link href="/sellerDash/seller_orders?category_id=all">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition duration-200">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">📦</span>
                                            <span className="font-medium text-gray-800">Check Orders</span>
                                        </div>
                                        <span className="text-gray-400">→</span>
                                    </div>
                                </Link>
                                <Link href="../">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition duration-200">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">🏪</span>
                                            <span className="font-medium text-gray-800">Visit Marketplace</span>
                                        </div>
                                        <span className="text-gray-400">→</span>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </Sellers_Lay>
    )
}