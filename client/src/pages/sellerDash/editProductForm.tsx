import Endpoint from "@/endpoint";
import getToken from "@/tokenmanager";
import axios from "axios";
import { useRouter } from "next/router";
import { use, useEffect, useState } from "react";

export default function EditProductForm({ productDetails }: any) {
  // State variables for form fields
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [MOQ, setMOQ] = useState('');
  const [availableQty, setAvailableQty] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<any>({});
  const router = useRouter();
  const [categories,setCategories] = useState([])

  useEffect(() => {
    // Set initial values from productDetails
    setProductName(productDetails.ProductName || '');
    setPrice(productDetails.Price || '');
    setCategory(productDetails.Category || '');
    setMOQ(productDetails.MOQ || '');
    setAvailableQty(productDetails.AvailableQty || '');
    setDescription(productDetails.Description || '');
    setCategory(productDetails.CategoryID || '');
    const getCategories = async () => {
      try {
        const response = await axios.get(Endpoint.category);
        if (response.status === 200) {
          setCategories(response.data.data);
        } else {
          alert(`Error: ${response.status}`);
        }
      } catch (error) {
        alert("Failed to fetch categories.");
        console.error(error);
      }
    };
    getCategories();
  }, []);

  // Validation function
  const validateForm = () => {
    let validationErrors: any = {};

    if (!productName) validationErrors.productName = 'Product Name is required.';
    if (!price) validationErrors.price = 'Price is required.';
    else if (parseFloat(price) <= 0) validationErrors.price = 'Price must be greater than 0.';
    
    if (!category) validationErrors.category = 'Category is required.';
    else if (parseInt(category) < 1) validationErrors.category = 'Category must be 1 or higher.';

    if (!MOQ) validationErrors.MOQ = 'Minimum Order Quantity is required.';
    else if (parseInt(MOQ) <= 0) validationErrors.MOQ = 'MOQ must be greater than 0.';

    if (!availableQty) validationErrors.availableQty = 'Available Quantity is required.';
    else if (parseInt(availableQty) < 0) validationErrors.availableQty = 'Available Quantity cannot be negative.';

    if (!description) validationErrors.description = 'Description is required.';

    setErrors(validationErrors);
    return Object.keys(errors).length === 0;
  };

  // Submit function
  const editProduct = async (event: any) => {
    event.preventDefault();
    
    const isValid = validateForm(); // check right here
    if (!isValid) return;

      

      // Send PATCH request
      const response = await axios.patch(
        `${Endpoint.products}/edit/${productDetails.ProductID}`,
        {"productName": productName, "price": price, "category": category, "MOQ": MOQ, "availableQty": availableQty, "description": description},
        { headers: { 'Authorization': `Bearer ${getToken('token')}` } }
      );

      if(image){
        const formData = new FormData();
        formData.append('image', image); // 'image' must match `upload.single('image')`

        const imageResponse = await axios.patch(
          `${Endpoint.products}/imageEdit/${productDetails.ProductID}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${getToken('token')}`,
              'Content-Type': 'multipart/form-data',
            },
          }
);

      }
      

      if (response.status === 200) {
        alert(`${response.data.message}`);
        router.push('./seller_products');
      } else {
        alert(`${response.data.message}`);
        router.push('./seller_products');
      }
    
  };

  return (
    <section className="h-[600px] bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800 px-4 py-6">
    <div className="h-full w-full max-w-lg mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-xl overflow-hidden flex flex-col">
      
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Edit Product</h2>
      </div>
  
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <form onSubmit={editProduct} encType="multipart/form-data" className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          
          {/* Product Name */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Product name"
              className="rounded-md border p-2.5 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
            {errors.productName && <span className="text-xs text-red-500">{errors.productName}</span>}
          </div>
  
          {/* Price */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              className="rounded-md border p-2.5 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
            {errors.price && <span className="text-xs text-red-500">{errors.price}</span>}
          </div>
  
          {/* MOQ */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">MOQ</label>
            <input
              type="number"
              value={MOQ}
              onChange={(e) => setMOQ(e.target.value)}
              placeholder="Minimum order quantity"
              className="rounded-md border p-2.5 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
            {errors.MOQ && <span className="text-xs text-red-500">{errors.MOQ}</span>}
          </div>
  
          {/* Category */}
          <div className="flex flex-col">
              <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-md border p-2.5 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.CategoryID} value={cat.CategoryID}>
                    {cat.CategoryName}
                  </option>
                ))}
              </select>
              {errors.category && <span className="text-xs text-red-500">{errors.category}</span>}
            </div>
  
          {/* Available Quantity */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Available Qty</label>
            <input
              type="number"
              min="0"
              value={availableQty}
              onChange={(e) => setAvailableQty(e.target.value)}
              placeholder="Available quantity"
              className="rounded-md border p-2.5 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
            {errors.availableQty && <span className="text-xs text-red-500">{errors.availableQty}</span>}
          </div>
  
          {/* Image */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
            <input
              type="file"
              onChange={(e) => e.target.files?.length && setImage(e.target.files[0])}
              className="block w-full text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2"
            />
            {errors.image && <span className="text-xs text-red-500">{errors.image}</span>}
          </div>
  
          {/* Description */}
          <div className="col-span-full flex flex-col">
            <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Product description..."
              className="rounded-md border p-2.5 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white resize-none"
            />
            {errors.description && <span className="text-xs text-red-500">{errors.description}</span>}
          </div>
        </form>
      </div>
  
      <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-3">
        <button
          type="submit"
          onClick={editProduct}
          className="w-full py-2 text-sm font-medium bg-green "
        >
          Save Changes
        </button>
      </div>
    </div>
  </section>
  


  );
}
