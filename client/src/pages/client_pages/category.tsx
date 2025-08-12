import axios from 'axios';
import { useRouter } from 'next/router';
import Endpoint from '@/endpoint';
import User_Layout from '@/pages/layouts';
import * as cookie from 'cookie';
import getToken from '@/tokenmanager';
import { useState } from 'react';
import { addOrUpdateCartItem, getCartFromCookie } from '../../utils/cart_ops';
import { useEffect } from 'react';
import ShoppingCart from '../customComponents';


  export const getServerSideProps = async (context: any) => {
      let cat_id_array = [];
      (context.query.category_id) ? cat_id_array = context.query.category_id.split(',') : [];
      let categories = [];
      let products: any[] =[];
      let productImages: any[] =[];
      const { product_id ,quantity } = context.query;  // Get the product ID and quantity to add from the URL.
      let postMsg = '';
      let getMsg = '';
      let body = {
        'productId':`${product_id}`,
        'quantity':`${quantity}`}
      let token = 'null';

      if(context.req.headers.cookie){
        const cookies  = cookie.parse(context.req.headers.cookie);
        (cookies['token'])? token = cookies['token']:token; 
      }
      
      // POST TO BACK-END CART
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

      // FETCH CATEGORIES AND SAMPLE OF THEIR PRODUCTS
      try {
            const categoriesResponse = await axios.get(Endpoint.category);
            categories = categoriesResponse.data.data;
            
      
            if (cat_id_array.includes("all")) {
              let temp_products = []
              const productsResponse = await axios.get(Endpoint.products);
              temp_products = productsResponse.data.data
              for(let i=0;i<temp_products.length;i++){
                if(temp_products[i].ProdStatus == "Active"){
                  products.push(temp_products[i])
                }
              } 
          } 
          else {
            for (let cat_id of cat_id_array) {
              const productsResponse = await axios.get(
                `${Endpoint.products}/category/${cat_id}`
              );
              const temp_products = productsResponse.data.data;
      
              // Filter products based on status
              for (let product of temp_products) {
                if (product.ProdStatus === "Active") {
                  products.push(product);
                }
              }
            }
          }
      } 
      catch (error) {
          console.log("Error fetching products or categories:", error);
      }

      if (products.length !== 0){

          // FETCH THE IMAGES OF THE PRODUCTS.
          for(let product of products){
              try{
                  // Create image URL directly instead of fetching image data
                  const imageUrl = `${Endpoint.products}/image/${product.ProductID}`;
                  productImages.push({
                      ProductImage: imageUrl,
                      ProductID: product.ProductID
                  });
              }
              catch(error){
                  console.log("Error creating image URL for product:", error);
                  // Add fallback with null value to avoid undefined
                  productImages.push({
                      ProductImage: null,
                      ProductID: product.ProductID
                  });
              }    
          }

      }
     
    
    return {
      props: {
        products: products || [],
        categories: categories || [],
        productImages: productImages || [],
        cat_id_array: cat_id_array || []
      }
    };
  };


export default function ProductListPage({ products , categories, productImages }:any) {
  const router = useRouter();
  const [quan, setQuan] = useState('0');
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  let triggerring_category = 'all';
  let [cartItems, setCartItems] = useState([]);
  let [exist, setExist] = useState(false);
  let response;
  let [initial_index, setInitial_index] = useState(0)
  let [final_index, setFinal_index] = useState(12)
  let no_of_displayed_products = 12;
  let [sliced_products, setSlicedProducts] = useState([])
  let [category_ids, setCategoryIds] = useState<string[]>([])

  // Handle client-side token loading to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setToken(getToken('token'));
  }, []);

  const prevOrNext = (status:any)=>{

      if(status === "next"){
         

         if ((initial_index + no_of_displayed_products) > (products.length - 1)){
            setInitial_index(initial_index)
            setFinal_index(final_index)
         } 
         else{
            setInitial_index(initial_index + no_of_displayed_products)
            setFinal_index(final_index + no_of_displayed_products)
         }

         
      }
      else if(status === "previous"){

        if ((initial_index - no_of_displayed_products)< 0){
           setInitial_index(0)
           setFinal_index(final_index)
        }
        else{   
          setInitial_index(initial_index - no_of_displayed_products)
          setFinal_index(final_index - no_of_displayed_products)
        }  
      }
      else{
        setInitial_index(0)
        setFinal_index(no_of_displayed_products)     
      }
      setSlicedProducts(products.slice(initial_index,final_index)) 
  }

  
  const checking_CheckBoxes = (vals: string[]) => {
      var checkboxes = document.getElementsByName('categories') as NodeListOf<HTMLInputElement>;
      if(vals.includes("all")){
        
        checkboxes[0].checked = true;
        
        for (var i=1;i<checkboxes.length;i++) 
          { checkboxes[i].checked = false; }
      }
      else{
          checkboxes[0].checked = false;
          for (var i = 0; i < checkboxes.length; i++) {
            if (vals.includes(checkboxes[i].value)) {
                checkboxes[i].checked = true;
            }
        }
      }
  }

  useEffect(() => {

      const categoryParam = router.query.category_id;
        if (categoryParam) {
          if (typeof categoryParam === "string") {
           
            setCategoryIds(categoryParam.split(","));
          } else if (Array.isArray(categoryParam)) {
            setCategoryIds(categoryParam); 
          }
        }
        
      prevOrNext("none");
      
  },[router.query]); 

  useEffect(() => {
    if (category_ids.length > 0) {
      checking_CheckBoxes(category_ids);
    }
  }, [category_ids]);


   //---------------------------------Get Cart (From Cookie or Back-End)-------------------------------
   const fetch_cart = async ()=>{

    setCartItems(getCartFromCookie)

    if(token){
        try{     
          const response = await axios.get(`${Endpoint.cart}/view`,{headers:{'Authorization': `Bearer ${token}`}})

          // Handle Response Status. 
          if (response.status === 200){
                setCartItems(response.data.data)
            }
        }
        catch(error){
            console.error("Error fetching cart:", error);
        }
    } 
}

  const addToCart = async (product)  => {

    if(quan >='0' && product.AvailableQTY>= quan){ 

        fetch_cart();

        if(token){    

           //------------------------Check If product exist in the cart (to add or update it)-------------------------------
           for(let cartItem of cartItems){
              if(product.ProductID === cartItem.ProductID){
                setExist(true)
                break
              }
           }

            //Update the BackEnd Cart
            try{

                 if (exist){
                      response = await axios.post(`${Endpoint.cart}/edit`,{"productId":product.ProductID,"quantity":quan},{headers:{'Authorization': `Bearer ${token}`}})
                      alert(response.data.message);
                 }
                 else{
                      response = await axios.post(`${Endpoint.cart}/add`,{"productId":product.ProductID,"quantity":quan},{headers:{'Authorization': `Bearer ${token}`}})
                      alert(response.data.message);
                 }
                  
                 setExist(false);
                 window.location.reload();
           }
           catch(error){
               alert(`${error.response.data.message}`);
               console.error(error);
           }
        }
        else{  
            
              if(product.PromoActive){
                  addOrUpdateCartItem({"ProductName":product.ProductName,"ProductID":product.ProductID,"Quantity":quan,"MOQ":product.MOQ,"Price":product.DiscPrice});
              }else{
                  addOrUpdateCartItem({"ProductName":product.ProductName,"ProductID":product.ProductID,"Quantity":quan,"MOQ":product.MOQ,"Price":product.Price});
                   }
                          
              window.location.reload();
        }
  
    }
    else{
      alert(`Available Quantity is ${product.AvailableQTY}`);
      window.location.reload()
    }     
  }
 
  const fetch_products = () => {
      
      var checkboxes = document.getElementsByName('categories') as NodeListOf<HTMLInputElement>;
      var vals = "";
      

    if(triggerring_category === 'all'){

        vals=checkboxes[0].value;
    
   }
    else{
      checkboxes[0].checked = false;  
      for (var i=1;i<checkboxes.length;i++) 
        {     
            if (checkboxes[i].checked) 
            {     
                vals += checkboxes[i].value + ",";
            }
        }
    }
     
      if(vals.length == 0){vals="all,"}
      router.push(`/client_pages/category?category_id=${vals}`)   
  }

  // Helper function to render product card
  const renderProductCard = (product) => {
    const productImage = productImages.find(img => img.ProductID === product.ProductID);
    
    return (
      <div key={product.ProductID} className="bg-white p-4 shadow-lg rounded-lg hover:shadow-xl transition duration-300 transform hover:scale-105">
        <div className="relative">
          {productImage ? (
            <div className="relative w-full h-48 overflow-hidden rounded-lg mb-4">
              <img 
                 src={productImage.ProductImage}
                 alt={`Image of ${product.ProductName}`}
                 className="w-full h-full object-cover transition duration-300 ease-in-out hover:scale-110"
                 onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/default-product.jpg'; }}
                 />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg mb-4">
              <span className="text-gray-500 text-sm">📷 {product.ProductName}</span>
            </div>
          )}
        </div>
        
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">{product.ProductName}</h4>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.Description}</p>
          
          <div className="flex items-center justify-between mb-4">
            {product.PromoActive ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-red-500 line-through">RM {product.Price}</span>
                <span className="text-lg font-bold text-green-600">RM {product.DiscPrice}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-800">RM {product.Price}</span>
            )}
            <span className="text-sm text-gray-500">{product.AvailableQty} available</span>
          </div>

          <a 
            href={`/client_pages/productpage?product_id=${product.ProductID}`}
            className="inline-block text-blue-600 hover:text-blue-800 font-medium mb-3 hover:underline"
          >
            View Details →
          </a>

          <div className="flex items-center space-x-2 mt-3">
            <input 
              type="number" 
              min="1" 
              max={product.AvailableQty}
              onChange={(e) => setQuan(e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Qty"
            />
            <button 
              onClick={() => addToCart({
                "ProductName": product.ProductName,
                "ProductID": product.ProductID,
                "MOQ": product.MOQ,
                "Quantity": quan,
                "Price": product.Price,
                "AvailableQTY": product.AvailableQty
              })}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200"
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
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">🛒 Browse Products</h1>
            <p className="text-xl">Discover fresh agricultural products from local farmers</p>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar - Categories */}
            <div className="lg:w-1/4">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  🗂️ <span className="ml-2">Filter by Category</span>
                </h2>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      name="categories" 
                      value="all," 
                      onChange={() => {triggerring_category = "all"; fetch_products();}} 
                      className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <label className="ml-3 text-gray-700 font-medium">All Products</label>
                  </div>
                  
                  {categories.map((category, key) => (
                    <div key={key} className="flex items-center">
                      <input 
                        type="checkbox" 
                        name="categories" 
                        value={`${category.CategoryID}`} 
                        onChange={() => {triggerring_category = category.CategoryID; fetch_products();}} 
                        className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <label className="ml-3 text-gray-700">{category.CategoryName}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Products Grid */}
            <div className="lg:w-3/4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {category_ids.includes("all") ? "All Products" : "Filtered Products"} 
                  <span className="text-lg font-normal text-gray-600 ml-2">({products.length} found)</span>
                </h2>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {sliced_products.map(product => renderProductCard(product))}
              </div>

              {/* Pagination */}
              {products.length > no_of_displayed_products && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => prevOrNext("previous")}
                      className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200 disabled:opacity-50"
                    >
                      ← Previous
                    </button>
                    
                    <span className="text-gray-600">
                      Showing {initial_index + 1} - {Math.min(final_index, products.length)} of {products.length} products
                    </span>
                    
                    <button 
                      onClick={() => prevOrNext("next")}
                      className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200 disabled:opacity-50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* No products message */}
              {sliced_products.length === 0 && (
                <div className="bg-white p-12 rounded-lg shadow-lg text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                  <p className="text-gray-600">Try adjusting your category filters to see more products.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ShoppingCart />
    </User_Layout>
  );
};