import axios from 'axios';
import { useRouter } from 'next/router';
import User_Layout from '@/pages/layouts';
import Endpoint from '@/endpoint'; // API endpoint
import { useState, useEffect } from 'react';
import { addOrUpdateCartItem } from '../../utils/cart_ops';
import getToken from '@/tokenmanager';
import * as cookie from 'cookie';
import ShoppingCart from '../customComponents';

export const getServerSideProps = async (context:any) => {
    const { product_id ,quantity } = context.query;  // Get the product ID and quantity to add from the URL.
    let postMsg = '';
    let getMsg = '';
    let product = [];
    let productImage :any;
    let body = {
      'productId':`${product_id}`,
      'quantity':`${quantity}`}
    let token = 'null';

    if(context.req.headers.cookie){
      const cookies  = cookie.parse(context.req.headers.cookie);
      (cookies['token'])? token = cookies['token']:token; 
    }
    

    if (token !== 'null'){
          if(quantity !== '0'){
              try{
                const response = await axios.post(`${Endpoint.cart}/add`,body,{headers:{'Authorization': `Bearer ${token}`}});
                postMsg = response.data.message;
              }
              catch(error){
                console.log(`Error posting an item`,error);
              }        
          }
    }
      
    try {
        const response = await axios.get(`${Endpoint.products}/product/${product_id}`);  // Fetch product by ID
        getMsg = response.data.message;

        // Handle Response Status. 
        if (response.status == 200){
            product = response.data.data;
        }
    } 
    catch(error){
        console.log("Error fetching product:", error);
    }

    
    if (product.length !== 0){

        // FETCH PRODUCT IMAGE

        try{
            // Create image URL directly instead of fetching image data
            const imageUrl = `${Endpoint.products}/image/${product_id}`;
            productImage = {
                ProductImage: imageUrl, 
                ProductID: product[0]?.ProductID || null  // Use null instead of undefined
            };
        }
        catch(error){
            console.log("Error creating image URL for product:", error);
            productImage = {ProductImage: null, ProductID: null}; // Fallback with null values
        }
        
        // Track product view
        try{
            await axios.post(`${Endpoint.products}/track-view/${product_id}`);
        }
        catch(error){
            console.log("Error tracking product view:", error);
        }
    }

    return {
      props: { 
        product: product || [],
        productImage: productImage || {ProductImage: null, ProductID: null}
      }
    };
};

export default function ProductPage({product, productImage}:any) {
  
  const router = useRouter();
  const [quan,setQuan]= useState('0');
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationImages, setRecommendationImages] = useState([]);
  const token = getToken('token');
  const image = productImage?.ProductImage || null;

  // Fetch recommendations when component mounts
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get(`${Endpoint.products}/recommendations/${product.ProductID}`);
        if (response.status === 200) {
          const recProducts = response.data.data;
          setRecommendations(recProducts);
          
          // Fetch images for recommendations
          const images = [];
          for (let recProduct of recProducts) {
            try {
              // Create image URL directly instead of fetching image data
              const imageUrl = `${Endpoint.products}/image/${recProduct.ProductID}`;
              images.push({ProductID: recProduct.ProductID, ProductImage: imageUrl});
            } catch (error) {
              console.log("Error creating recommendation image URL:", error);
            }
          }
          setRecommendationImages(images);
        }
      } catch (error) {
        console.log("Error fetching recommendations:", error);
      }
    };

    if (product.ProductID) {
      fetchRecommendations();
    }
  }, [product.ProductID]);

  const addToCart = (quantity)=>{
      if(quantity>=0 && product.AvailableQty>= quan){ 

          if(token){    
            //Update the BackEnd Cart
            router.push(`/client_pages/productpage?product_id=${product.ProductID}&quantity=${quan}`);
          }
          if(product.PromoActive){
             addOrUpdateCartItem({"ProductName":product.ProductName,"ProductID":product.ProductID,"Quantity":quan,"MOQ":product.MOQ,"Price":product.DiscPrice});
           }else{
             addOrUpdateCartItem({"ProductName":product.ProductName,"ProductID":product.ProductID,"Quantity":quan,"MOQ":product.MOQ,"Price":product.Price});
          }
            window.location.reload()    
      }
      else{
        alert(`Greater than available quantity`);
        window.location.reload()
      }
      
  }

  // Helper function to render recommendation card
  const renderRecommendationCard = (recProduct) => {
    const recImage = recommendationImages.find(img => img.ProductID === recProduct.ProductID);
    
    return (
      <div key={recProduct.ProductID} className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105 cursor-pointer">
        <div 
          onClick={() => router.push(`/client_pages/productpage?product_id=${recProduct.ProductID}`)}
          className="block"
        >
          {recImage ? (
            <div className="w-full h-32 overflow-hidden rounded-lg mb-3">
              <img 
               src={recImage.ProductImage}
                 alt={`Image of ${recProduct.ProductName}`}
                className="w-full h-full object-cover transition duration-300 ease-in-out hover:scale-110"
                 onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/default-product.jpg'; }}
              />
            </div>
          ) : (
            <div className="w-full h-32 bg-gray-200 flex items-center justify-center rounded-lg mb-3">
              <span className="text-gray-500 text-sm">📷</span>
            </div>
          )}
          
          <h4 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">{recProduct.ProductName}</h4>
          <p className="text-lg font-bold text-green-600">RM {recProduct.Price}</p>
        </div>
      </div>
    );
  };

  
  if (!product) {
    return (
      <User_Layout>
        <div className="bg-gray-100 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Product not found</h2>
            <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
      </User_Layout>
    );
  }

  return (
    <User_Layout>
      <div className="bg-gray-100 min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-2 text-sm mb-4">
              <a href="/" className="hover:underline">Home</a>
              <span>→</span>
              <a href="/client_pages/category?category_id=all" className="hover:underline">Products</a>
              <span>→</span>
              <span className="font-semibold">{product.ProductName}</span>
            </div>
          </div>
        </section>

        {/* Product Details Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                
                {/* Product Image */}
                <div className="lg:w-1/2 p-8">
                  <div className="sticky top-8">
                    <img
                      src={`${image}`}
                       alt={`Image of ${product.ProductName}`}
                       className="w-full h-96 object-cover rounded-lg shadow-lg"
                       id="mainImage"
                       onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/default-product.jpg'; }}
                    />
                  </div>
                </div>

                {/* Product Information */}
                <div className="lg:w-1/2 p-8">
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.ProductName}</h1>
                      
                      {/* Price Section */}
                      <div className="mb-6">
                        {product.PromoActive ? (
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl text-red-500 line-through">RM {product.Price}</span>
                            <span className="text-3xl font-bold text-green-600">RM {product.DiscPrice}</span>
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                              SALE
                            </span>
                          </div>
                        ) : (
                          <span className="text-3xl font-bold text-gray-800">RM {product.Price}</span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Product Description</h3>
                      <p className="text-gray-600 leading-relaxed">{product.Description}</p>
                    </div>

                    {/* Seller Information */}
                    {product.Seller && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-blue-800 mb-1">👤 Sold by</h3>
                            <p className="text-blue-700 font-medium">@{product.Seller.Username}</p>
                            <p className="text-blue-600 text-sm">{product.Seller.FirstName} {product.Seller.LastName}</p>
                            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {product.Seller.UserAuth}
                            </span>
                          </div>
                          {token && (
                            <div>
                              <a
                                href={`/client_pages/communications?contact=${product.Seller.Username}&subject=Inquiry about ${product.ProductName}`}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200"
                              >
                                💬 Contact Seller
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Availability Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">Minimum Order:</span>
                          <p className="text-gray-600">{product.MOQ} units</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Available Stock:</span>
                          <p className={`${product.AvailableQty > 10 ? 'text-green-600' : 'text-red-600'} font-semibold`}>
                            {product.AvailableQty} units
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quantity and Add to Cart */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity:</label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="number"
                            min="1"
                            max={product.AvailableQty}
                            onChange={(e) => setQuan(e.target.value)}
                            className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="1"
                          />
                          <button
                            onClick={() => addToCart(quan)}
                            className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition duration-200 shadow-lg"
                          >
                            🛒 Add To Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                🎯 You might also like
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {recommendations.slice(0, 6).map(recProduct => renderRecommendationCard(recProduct))}
              </div>
            </div>
          </section>
        )}
      </div>
      <ShoppingCart />
    </User_Layout>
  );
}