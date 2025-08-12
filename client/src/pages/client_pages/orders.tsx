import Endpoint from "@/endpoint";
import User_Layout from "../layouts";
import getToken from "@/tokenmanager";
import axios from "axios";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken("token");
    const getOrders = async () => {
      try {
        const response = await axios.get(`${Endpoint.orders}/user`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 200 && response.data.data) {
          setOrders(response.data.data);
        } 
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    getOrders();
  }, []);

  const getStatusBadge = (status) => {
    const statusClasses: Record<string, string> = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Processing': 'bg-blue-100 text-blue-800',
      'Shipped': 'bg-purple-100 text-purple-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <User_Layout>
      <div className="bg-gray-100 min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">📦 My Orders</h1>
            <p className="text-xl">Track your purchases and order history</p>
          </div>
        </section>

        {/* Orders Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                <div className="text-6xl mb-6">📦</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">No Orders Yet</h2>
                <p className="text-gray-600 mb-6">You haven't placed any orders. Start shopping to see your orders here!</p>
                <a 
                  href="/client_pages/category?category_id=all" 
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition duration-200 shadow-lg"
                >
                  Start Shopping
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order: any) => (
                  <div key={order.TransactionID} className="bg-white rounded-lg shadow-xl overflow-hidden">
                    {/* Order Header */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Order #{order.TransactionID}
                          </h2>
                          <p className="text-gray-600">
                            📅 Placed on {new Date(order.CreatedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="mt-4 md:mt-0 md:text-right">
                          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(order.DELIVERY_DETAIL?.DeliveryStatus)}`}>
                            {order.DELIVERY_DETAIL?.DeliveryStatus || 'Processing'}
                          </span>
                          {order.DELIVERY_DETAIL?.TrackingNo && (
                            <p className="text-sm text-gray-600 mt-2">
                              🚚 Tracking: {order.DELIVERY_DETAIL.TrackingNo}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Delivery Information */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                          📍 <span className="ml-2">Delivery Information</span>
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="font-medium text-gray-800">
                            {order.DELIVERY_DETAIL?.FirstName} {order.DELIVERY_DETAIL?.LastName}
                          </p>
                          <p className="text-gray-600">📞 {order.DELIVERY_DETAIL?.ContactNo}</p>
                          <p className="text-gray-600">🏠 {order.DELIVERY_DETAIL?.Address}</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          🛒 <span className="ml-2">Order Items ({order.PRODUCT_TRANSACTION_INFOs?.length || 0})</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {order.PRODUCT_TRANSACTION_INFOs?.map((item: any, index: number) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-800 flex-1">
                                  {item.PRODUCT?.ProductName}
                                </h4>
                                <span className="text-lg font-bold text-green-600 ml-4">
                                  RM {parseFloat(item.SoldPrice).toFixed(2)}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-center text-sm text-gray-600">
                                <span>Quantity: <span className="font-medium">{item.Quantity}</span></span>
                                <span className="font-medium">
                                  Total: RM {(parseFloat(item.SoldPrice) * parseInt(item.Quantity)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Total */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-800">Order Total:</span>
                            <span className="text-2xl font-bold text-green-600">
                              RM {order.PRODUCT_TRANSACTION_INFOs?.reduce((total, item) => 
                                total + (parseFloat(item.SoldPrice) * parseInt(item.Quantity)), 0
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </User_Layout>
  );
}