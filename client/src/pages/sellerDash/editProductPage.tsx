
import axios from 'axios';
import Endpoint from '@/endpoint'; // API endpoint
import * as cookie from 'cookie';
import Sellers_Lay from './layout';
import React from 'react';
import { Box, Modal } from '@mui/material';
import ProductForm from './editProductForm';
import EditProductForm from './editProductForm';
import router from 'next/router';

export const getServerSideProps = async (context:any) => {
    const { product_id } = context.query;  // Get the product ID and quantity to add from the URL.
    let postMsg = '';
    let getMsg = '';
    let product = [];
    let productImage :any;
    let token = 'null';

    if(context.req.headers.cookie){
      const cookies  = cookie.parse(context.req.headers.cookie);
      (cookies['token'])? token = cookies['token']:token; 
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
            const response = await axios.get(`${Endpoint.products}/image/${product_id}`);  // Fetch product by ID

            // Handle Response Status. 
            if (response.status === 200){
                productImage = {ProductImage:response.data.data,ProductID:product.ProductID};
            }
        }
        catch(error){
            console.log("Error fetching image of product:", error);
        }
    }

    return {
      props: { product: product || [],
               productImage : productImage 
       }
    };
};

export default function ProductPage({product, productImage}:any) {
  
  const image = `data:image/jpeg;base64,${productImage.ProductImage}`
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <Sellers_Lay>
  <div className="bg-gray-50 dark:bg-gray-900 flex min-h-screen text-gray-800 dark:text-gray-100">
    <div className="w-full max-w-5xl mx-auto px-4 py-8">

      {/* Back Button */}
      <div className="flex items-center mb-6 cursor-pointer hover:text-blue-600 transition" onClick={() => router.back()}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0L2.586 11l3.707-3.707a1 1 0 011.414 1.414L5.414 11l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        <span className="font-medium text-sm">Back</span>
      </div>

      {/* Product Details Header */}
      <h1 className="text-3xl font-extrabold mb-6">Product Details</h1>

      <div className="flex flex-col md:flex-row gap-8">

        {/* Product Image */}
        <div className="md:w-1/2 w-full flex justify-center items-start">
          <img 
            src={`${image}`} 
            alt={`Image of ${product.ProductName}`} 
            className="w-full max-w-md rounded-lg shadow-lg object-contain" 
            id="mainImage" 
          />
        </div>

        {/* Product Info */}
        <div className="md:w-1/2 w-full space-y-3">
          <h2 className="text-2xl font-bold">{product.ProductName}</h2>

          <div className="text-sm space-y-1">
            <p><span className="font-semibold">Category:</span> {product.CategoryID}</p>
            <p><span className="font-semibold">Price:</span> RM{product.Price}</p>
            <p><span className="font-semibold">Discount:</span> {product.DiscPrice}</p>
            <p><span className="font-semibold">Status:</span> {product.ProdStatus}</p>
            <p><span className="font-semibold">Available Quantity:</span> {product.AvailableQty}</p>
            <p><span className="font-semibold">MOQ:</span> {product.MOQ}</p>
            <p><span className="font-semibold">Promotion Status:</span> {product.PromoActive ? 'Active' : 'Inactive'}</p>
            <p><span className="font-semibold">Promotion End Date:</span> {product.PromoEndDate}</p>
          </div>

          <button 
            onClick={handleOpen} 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
          >
            Edit Product
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Description:</h2>
        <p className="text-sm leading-relaxed">{product.Description}</p>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <EditProductForm productDetails={product} />
        </Box>
      </Modal>
    </div>
  </div>
</Sellers_Lay>

   
  );
}
const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 700,
  height: '90%',
  maxHeight: 650,
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
  outline: 'none',
};
  
