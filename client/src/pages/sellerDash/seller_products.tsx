import axios from 'axios';
import { useRouter } from 'next/router';
import Endpoint from '@/endpoint';
import Sellers_Lay from './layout';
import * as cookie from 'cookie';
import { useState } from 'react';
import { useEffect } from 'react';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import { Box, Modal } from '@mui/material';
import React from 'react';
import AddProductForm from './addProduct';
import EditProductForm from './editProductForm';
import getToken from '@/tokenmanager';

const shoppingCartStyle = {
  position: 'fixed',
  bottom: '50px',
  right: '50px',
  height: '50px',
  width: '50px',
}

  export const getServerSideProps = async (context) => {
      let cat_id_array = [];
      (context.query.category_id) ? cat_id_array = context.query.category_id.split(',') : [];
      let categories: any [] = [];
      let products: any[] =[];
      let filteredProducts: any[] =[];
      let productImages: any[] =[];
      let postMsg = '';
      let token = 'null';

      if(context.req.headers.cookie){
        const cookies  = cookie.parse(context.req.headers.cookie);
        (cookies['token'])? token = cookies['token']:token; 
      }

      // FETCHING THE PRODUCTS BASED ON THE SELLER ID.
      try {
          const response = await axios.get(`${Endpoint.products}/seller/10`, { headers: { Authorization: `Bearer ${token}` } });
          postMsg = response.data.message;

          if (response.status === 200) {
              products = response.data.data;
          }
      } 
      catch (error) {
          console.log("Error fetching products:", error);
      }

      // FILTERING THE PRODUCTS BASED ON THE CATEGORIES AFTER BEING FETCHED.
      try {
            const categoriesResponse = await axios.get(Endpoint.category);
            categories = categoriesResponse.data.data;
            
      
          // FILTER PRODUCTS BASED ON CATEGORY ID ARRAY
        if (!cat_id_array.includes("all") && cat_id_array.length > 0) {
          filteredProducts = products.filter((product) =>
              cat_id_array.includes(String(product.CategoryID))
          );
          products = filteredProducts; 
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
        productImages: productImages || []
      }
    };
  };


export default function sellerProductListPage({ products , categories, productImages }:any) {

  
  const router = useRouter();
  let triggerring_category = 'all';
  const [product,setProduct] = useState({});
  let response;
  let [initial_index,setInitial_index] = useState(0)
  let [final_index,setFinal_index] = useState(7)
  let no_of_displayed_products = 7;
  let [sliced_products,setSlicedProducts] = useState([])
  let [category_ids, setCategoryIds]= useState<string[]>([])
  const [open, setOpen] = React.useState(false);
  const [openEditProduct, setOpenEditProduct] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleOpenEditProduct = () => setOpenEditProduct(true);
  const handleClose = () => setOpen(false);
  const handleCloseEditProduct = () => setOpenEditProduct(false);


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

const checking_CheckBoxes = (vals: string[])=>{
  var checkboxes = document.getElementsByName('categories');
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




const changeProductStatus = () => {
  var checkboxes = document.getElementsByName('ProductStatus');
  var activeProducts = []
  var inactiveProducts = [];
  for (var i=0;i<checkboxes.length;i++) 
  {     
      if (checkboxes[i].checked) 
      {     
         activeProducts.push(checkboxes[i].value); 
      }else{
        inactiveProducts.push(checkboxes[i].value); 
      }
  }
  if(activeProducts.length > 0){
    changeStatus(activeProducts,"Active")
  }
  if(inactiveProducts.length > 0){
    changeStatus(inactiveProducts,"Inactive")
  }
  fetch_products()
  window.location.reload();
}
 
  const fetch_products = () => {
      
    var checkboxes = document.getElementsByName('categories');
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
      router.push(`/sellerDash/seller_products?category_id=${vals}`, undefined, { scroll: false }) 
  }

  const editItem = (id:any) => {
    router.push(`/sellerDash/editProductPage?product_id=${id}`);
  }

  const editProductFromButton = (product)=>{
    setProduct(product);
    handleOpenEditProduct()
  }

  const changeStatus = async (ids:any,status:any)=>{
    const body = {"products":ids,"newStatus":status};
    const response = await axios.patch(`${Endpoint.products}/toggleStatus`, body, { headers: { Authorization: `Bearer ${getToken("token")}`} });
  
  }
 
  return (
    <Sellers_Lay>
       
            <div className='bg-white min-h-screen'>
                <div className='bg-white p-4 shadow rounded-md'>
                    <h1 className='text-2xl font-semibold'>Your Products</h1>
                </div>
              
              <div  className="bg-white p-4  rounded-md flex ">         
                        <div style={{width:'25%'}}>  
                                <h1>CATEGORY NAV</h1>  
                                <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      name="categories"
      value="all"
      onChange={() => {
        triggerring_category = "all";
        fetch_products();
      }}
      className="form-checkbox h-5 w-5 text-blue-600"
    />
    <label className="text-gray-700">All Products</label>
  </div>                         
  {categories.map((category, key) => (
    <div key={key} className="flex items-center space-x-2">
      <input
        type="checkbox"
        name="categories"
        value={category.CategoryID}
        onChange={() => {
          triggerring_category = category.CategoryID;
          fetch_products();
        }}
        className="form-checkbox h-5 w-5 text-blue-600"
      />
      <label className="text-gray-700">{category.CategoryName}</label>
    </div>
  ))}                    
                                             
                        </div>      
              
               

                        <div  style={{width:'75%'}}  >
                                <div className=" min-h-screen">
                                <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 mt-4">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50 text-sm font-semibold text-gray-600">
      <tr>
        <th className="p-4 text-left">Product</th>
        <th className="p-4 text-left">Quantity</th>
        <th className="p-4 text-left">Price</th>
        <th className="p-4 text-left">Status</th>
        <th className="p-4 text-left">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100 text-sm">
      {sliced_products.map((item) => (
        <tr key={item.ProductID} className="hover:bg-gray-50">
          <td className="p-4 flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-100 flex items-center justify-center overflow-hidden rounded-md">
              {productImages.find(p => p.ProductID === item.ProductID) ? (
                <img
                  src={`data:image/jpeg;base64,${
                    productImages.find(p => p.ProductID === item.ProductID).ProductImage
                  }`}
                  alt={`Image of ${item.ProductName}`}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-gray-400">No Image</span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-800">{item.ProductName}</p>
              <p className="text-gray-500 text-xs">{item.Description}</p>
            </div>
          </td>
          <td className="p-4">{item.AvailableQty}</td>
          <td className="p-4 font-semibold text-gray-800">RM {item.Price}</td>
          <td className="p-4">
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                item.ProdStatus === 'Active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {item.ProdStatus}
            </span>
            <td className="p-4">
                                              
                                                {item.ProdStatus == "Active"?<label className="inline-flex items-center cursor-pointer">
                                                  <input type="checkbox" value={item.ProductID} className="sr-only peer" name='ProductStatus' onChange={changeProductStatus} checked/>
                                                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>    
                                                </label>:<label className="inline-flex items-center cursor-pointer">
                                                  <input type="checkbox" value={item.ProductID} className="sr-only peer" name='ProductStatus' onChange={changeProductStatus}/>
                                                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>    
                                                </label>}
                                              </td>
          </td>
          <td className="p-4 space-x-2">
            <button
              onClick={() => editItem(item.ProductID)}
              className="text-white-600 hover:underline text-sm"
            >
              View
            </button>
            <button
              onClick={() => editProductFromButton(item)}
              className="text-white-600 hover:underline text-sm"
            >
              Edit
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

                            </div>
                             
                              <div>
                                <br></br>
                                <hr></hr>
                                <br></br>
                              </div>
                              <div className="mt-6 flex justify-between items-center">
  <button
    onClick={() => prevOrNext("previous")}
    className="px-4 py-2 bg-green rounded "
  >
    Previous
  </button>
  <button
    onClick={() => prevOrNext("next")}
    className="px-4 py-2 bg-green text-white rounded"
  >
    Next
  </button>
</div>
                         </div>           
              </div>
              
              <Fab color="primary" aria-label="add" sx ={shoppingCartStyle} onClick={handleOpen}>
                <AddIcon />
              </Fab>   
              <div>
                <Modal
                  open={open}
                  onClose={handleClose}
                  aria-labelledby="modal-modal-title"
                  aria-describedby="modal-modal-description"
                >
                  <Box sx={style}>
                  <AddProductForm></AddProductForm>
                  </Box>
                </Modal>
              </div>
               <div>
                  <Modal
                    open={openEditProduct}
                    onClose={handleCloseEditProduct}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                  >
                    <Box sx={style}>
                    <EditProductForm productDetails={product}></EditProductForm>
                    </Box>
                  </Modal>
                </div>
            </div>
    </Sellers_Lay>
  );
};

      
const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 700,
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
  outline: 'none',
};
