import { useState } from 'react';
import axios from 'axios';
import Endpoint from '@/endpoint';
import Admin_Lay from './layout';
import getToken from '@/tokenmanager';

export default function AddCategory() {
  const [categoryName, setCategoryName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async (e: any) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      alert('Please enter a category name.');
      return;
    }

    setIsSubmitting(true);
    const token = getToken('token');

    const formData = new FormData();
    formData.append('categoryName', categoryName);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const res = await axios.post(Endpoint.category, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.status === 200) {
        alert('Category added successfully!');
        setCategoryName('');
        setImageFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        alert(res.data.message || 'Failed to add category.');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Server error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Admin_Lay>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl">
          <div className="bg-gradient-to-r from-red-50 to-purple-50 p-6 border-b rounded-t-lg">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              📂 <span className="ml-2">Add New Category</span>
            </h1>
            <p className="text-gray-600 mt-2">Create a new product category for the marketplace</p>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleAddCategory} className="space-y-6">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200"
                  placeholder="e.g., Fruits, Vegetables, Grains"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Choose a clear, descriptive name for the category
                </p>
              </div>

              {/* Category Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg p-3 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100 transition duration-200"
                  />
                  {imageFile && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-green-600">📁</span>
                      <span className="text-green-700 font-medium">Selected: {imageFile.name}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    Upload an image that represents this category (optional)
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-red-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-700 hover:to-purple-700 transform hover:scale-105 transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Creating Category...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>📂</span>
                      <span>Add Category</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            💡 <span className="ml-2">Category Guidelines</span>
          </h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Choose clear, descriptive names that users will easily understand</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Images should be high-quality and representative of the category</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Consider how sellers will categorize their products when naming</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Categories help users find products more efficiently</span>
            </li>
          </ul>
        </div>
      </div>
    </Admin_Lay>
  );
}