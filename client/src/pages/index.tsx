import React, { useState } from 'react';
import axios from 'axios';
import Endpoint from '../endpoint';
import Link from 'next/link';
import User_Layout from './layouts';
import * as cookie from 'cookie';
import { addOrUpdateCartItem, getCartFromCookie } from '../utils/cart_ops';
import getToken from '@/tokenmanager';
import ShoppingCart from './customComponents';
import { useRouter } from 'next/router';

export const getServerSideProps = async (context) => {
  let categories = [];
  let temp_categories = [];
  let products = [];
  let token = 'null';

  if (context.req.headers.cookie) {
    const cookies = cookie.parse(context.req.headers.cookie);
    if (cookies['token']) token = cookies['token'];
  }

  try {
    // Fetch categories
    const categoriesResponse = await axios.get(Endpoint.category);
    temp_categories = categoriesResponse.data.data;

    // Fetch products and keep only active ones, limited for homepage
    const productsResponse = await axios.get(Endpoint.products);
    products = productsResponse.data.data
      .filter((p: any) => p.ProdStatus === "Active")
      .slice(0, 12);
  } catch (error) {
    console.log("Error fetching data:", error);
  }

  // Filter categories that have at least one active product
  categories = temp_categories.filter((category: any) =>
    products.some((product: any) => product.CategoryID === category.CategoryID)
  );

  // Use correct IDs for images (backend expects IDs, not filenames)
  const categoryImages = categories.map((c: any) => ({
    CategoryID: c.CategoryID,
    CategoryImage: `${Endpoint.category}/image/${c.CategoryID}`,
  }));

  const productImages = products.map((p: any) => ({
    ProductID: p.ProductID,
    ProductImage: `${Endpoint.products}/image/${p.ProductID}`,
  }));

  return {
    props: {
      categories,
      products,
      productImages,
      categoryImages,
    },
  };
};

export default function Home({ categories, products, productImages, categoryImages }: any) {
  const [quan, setQuan] = useState('0');
  const token = getToken('token');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [exist, setExist] = useState(false);
  const router = useRouter();

  const fetch_cart = async () => {
    setCartItems(getCartFromCookie);

    if (token) {
      try {
        const response = await axios.get(`${Endpoint.cart}/view`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.status === 200) {
          setCartItems(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    }
  };

  const addToCart = async (product: any) => {
    // Use AvailableQty (consistent with your DB/BE)
    if (Number(quan) >= 0 && Number(product.AvailableQty) >= Number(quan)) {
      fetch_cart();

      if (token) {
        for (let cartItem of cartItems) {
          if (product.ProductID === cartItem.ProductID) {
            setExist(true);
            break;
          }
        }

        try {
          let response;
          if (exist) {
            response = await axios.post(
              `${Endpoint.cart}/edit`,
              { productId: product.ProductID, quantity: quan },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else {
            response = await axios.post(
              `${Endpoint.cart}/add`,
              { productId: product.ProductID, quantity: quan },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
          alert(response.data.message);
          setExist(false);
          router.push("/", undefined, { scroll: false });
        } catch (error: any) {
          alert(`${error?.response?.data?.message || "Error"}`);
          console.error(error);
        }
      } else {
        if (product.PromoActive) {
          addOrUpdateCartItem({
            ProductName: product.ProductName,
            ProductID: product.ProductID,
            Quantity: quan,
            MOQ: product.MOQ,
            Price: product.DiscPrice,
          });
        } else {
          addOrUpdateCartItem({
            ProductName: product.ProductName,
            ProductID: product.ProductID,
            Quantity: quan,
            MOQ: product.MOQ,
            Price: product.Price,
          });
        }
        window.location.reload();
      }
    } else {
      alert(`Available Quantity is ${product.AvailableQty}`);
      window.location.reload();
    }
  };

  const renderProductCard = (product: any, isRecommendation = false) => {
    const productImage = productImages.find((img: any) => img.ProductID === product.ProductID);

    return (
      <div key={product.ProductID} className="bg-white p-4 shadow rounded-md hover:shadow-lg transition">
        <div className="relative">
          {productImage ? (
            <div className="relative max-w-xs overflow-hidden bg-cover bg-no-repeat w-full h-40">
              <img
                src={productImage.ProductImage}
                alt={`Image of ${product.ProductName}`}
                className="w-full h-full object-cover transition duration-300 ease-in-out hover:scale-110"
              />
            </div>
          ) : (
            <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">📷 {product.ProductName}</span>
            </div>
          )}

          {isRecommendation && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              🎯 Recommended
            </div>
          )}
        </div>

        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-800 mb-1">{product.ProductName}</h4>
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{product.Description}</p>

          <div className="flex items-center justify-between mb-3">
            {product.PromoActive ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-red-500 line-through">RM {product.Price}</span>
                <span className="text-sm font-semibold text-green-600">RM {product.DiscPrice}</span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-gray-800">RM {product.Price}</span>
            )}
            <span className="text-xs text-gray-500">{product.AvailableQty} available</span>
          </div>

          <Link
            href={`/client_pages/productpage?product_id=${product.ProductID}`}
            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
          >
            View Details →
          </Link>

          <div className="mt-3 flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max={product.AvailableQty}
              onChange={(e) => setQuan(e.target.value)}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
              placeholder="Qty"
            />
            <button
              onClick={() => addToCart(product)}
              className="flex-1 bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700 transition"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <User_Layout>
      <div className="bg-gray-100 min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">🌾 Welcome to E-Pasar</h1>
            <p className="text-xl mb-6">Your Smart Agricultural Marketplace with AI-Powered Recommendations</p>
            <div className="flex justify-center space-x-4">
              <Link href="/client_pages/category?category_id=all" className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                Browse All Products
              </Link>
              {!token && (
                <Link href="/client_pages/login" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition">
                  Get Personalized
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Trending Products */}
        <section className="my-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                🔥 <span className="ml-2">Trending This Week</span>
              </h2>
              <Link href="/client_pages/category?category_id=all" className="text-blue-600 hover:text-blue-800 font-medium">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product: any) => renderProductCard(product))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="my-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">🗂️ SHOP BY CATEGORY</h2>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((category: any, key: number) => {
                const imgObj = categoryImages.find((c: any) => c.CategoryID === category.CategoryID);
                return (
                  <div key={key} className="bg-white p-4 shadow rounded-md hover:shadow-lg transition cursor-pointer">
                    <Link href={`/client_pages/category?category_id=${category.CategoryID}`} className="block">
                      <div className="w-full h-32 bg-gray-100 relative rounded-md overflow-hidden mb-4">
                        {imgObj && (
                          <div className="relative w-full h-full bg-cover bg-no-repeat">
                            <img
                              src={imgObj.CategoryImage}
                              alt={`Image of ${category.CategoryName}`}
                              className="w-full h-full object-cover transition duration-300 ease-in-out hover:scale-110"
                            />
                          </div>
                        )}
                      </div>
                      <h3 className="text-center font-semibold text-gray-700">{category.CategoryName}</h3>
                      <p className="text-center text-xs text-gray-500 mt-1">
                        {products.filter((p: any) => p.CategoryID === category.CategoryID).length} products
                      </p>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="my-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">✨ FEATURED PRODUCTS</h2>
            <div className="space-y-8">
              {categories.map((category: any, key: number) => (
                <div key={key} className="bg-white p-6 shadow rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <Link href={`/client_pages/category?category_id=${category.CategoryID}`}>
                      <h3 className="text-xl font-semibold text-gray-700 hover:text-blue-600 transition">{category.CategoryName}</h3>
                    </Link>
                    <Link href={`/client_pages/category?category_id=${category.CategoryID}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      View All →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {products
                      .filter((product: any) => product.CategoryID === category.CategoryID)
                      .slice(0, 4)
                      .map((product: any) => renderProductCard(product))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <ShoppingCart />
    </User_Layout>
  );
}
