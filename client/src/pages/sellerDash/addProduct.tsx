import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Endpoint from "@/endpoint";
import getToken from "@/tokenmanager";

export default function AddProductForm() {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [MOQ, setMOQ] = useState<number | "">("");
  const [availableQty, setAvailableQty] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [categories, setCategories] = useState<any[]>([]);

  // New states for upgraded features
  const [useAutoImage, setUseAutoImage] = useState(false);
  const [categorySuggestion, setCategorySuggestion] = useState<any>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isAnalyzingCategory, setIsAnalyzingCategory] = useState(false);
  const [autoImagePreview, setAutoImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
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

  // New function: Get category suggestion based on description
  const handleCategorySuggestion = async () => {
    if (!productName.trim() || !description.trim()) {
      alert("Please enter product name and description first for AI category suggestion.");
      return;
    }

    setIsAnalyzingCategory(true);
    try {
      const response = await axios.post(Endpoint.suggestCategory, {
        productName,
        description
      }, {
        headers: {
          'Authorization': `Bearer ${getToken("token")}`,
        },
      });

      if (response.status === 200 && response.data.data) {
        setCategorySuggestion(response.data.data);
        // Optionally auto-select the suggested category
        if (response.data.data.confidence > 50) {
          setCategory(response.data.data.suggestedCategory.toString());
        }
        alert(`AI Suggestion: ${response.data.data.categoryName} (${response.data.data.confidence}% confidence)`);
      }
    } catch (error) {
      console.error("Error getting category suggestion:", error);
      alert("Failed to get category suggestion. Please select manually.");
    } finally {
      setIsAnalyzingCategory(false);
    }
  };

  // New function: Generate auto image
  const handleAutoImageGeneration = async () => {
    if (!productName.trim()) {
      alert("Please enter product name first for image generation.");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await axios.post(Endpoint.generateImage, {
        productName,
        category: category || categorySuggestion?.categoryName || "general"
      }, {
        headers: {
          'Authorization': `Bearer ${getToken("token")}`,
        },
      });

      if (response.status === 200 && response.data.data) {
        setUseAutoImage(true);
        setImage(null); // Clear manual image selection
        alert("✅ AI image generated successfully! You can now submit the product.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate image. Please upload manually or try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!productName.trim()) newErrors.productName = "Product Name is required.";
    if (price === "" || price <= 0) newErrors.price = "Valid price is required.";
    if (!category) newErrors.category = "Please select a category.";
    if (MOQ === "" || MOQ < 1) newErrors.MOQ = "MOQ must be at least 1.";
    if (availableQty === "" || availableQty < 0) newErrors.availableQty = "Available Quantity must be 0 or more.";
    if (!description.trim()) newErrors.description = "Description is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let formData = new FormData();
      formData.append("productName", productName);
      formData.append("price", String(price));
      formData.append("category", category);
      formData.append("MOQ", String(MOQ));
      formData.append("availableQty", String(availableQty));
      formData.append("description", description);
      formData.append("useAutoImage", useAutoImage.toString());
      
      if (image && !useAutoImage) {
        formData.append("image", image);
      }

      const response = await axios.post(Endpoint.products, formData, {
        headers: {
          'Authorization': `Bearer ${getToken("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        alert("🎉 Product added successfully with AI features!");
        // Clear form
        setProductName("");
        setPrice("");
        setCategory("");
        setMOQ("");
        setAvailableQty("");
        setDescription("");
        setImage(null);
        setUseAutoImage(false);
        setCategorySuggestion(null);
        
        // Reload the page to show updated products
        window.location.reload();
      } else {
        alert(`Error: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Product creation error:", error);
      alert(error?.response?.data?.message || "Failed to add product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800">🤖 Add Product - Enhanced with AI Features</h2>
        <p className="text-sm text-gray-600 mt-1">Use AI to suggest categories and generate product images automatically</p>
      </div>

      <form onSubmit={addProduct} encType="multipart/form-data" className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="rounded-md border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Fresh Organic Tomatoes"
              required
            />
            {errors.productName && <span className="text-xs text-red-500 mt-1">{errors.productName}</span>}
          </div>

          {/* Price */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 mb-2">Price (RM) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="rounded-md border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
            {errors.price && <span className="text-xs text-red-500 mt-1">{errors.price}</span>}
          </div>

          {/* MOQ */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 mb-2">Minimum Order Quantity *</label>
            <input
              type="number"
              min="1"
              value={MOQ}
              onChange={(e) => setMOQ(Number(e.target.value))}
              className="rounded-md border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1"
              required
            />
            {errors.MOQ && <span className="text-xs text-red-500 mt-1">{errors.MOQ}</span>}
          </div>

          {/* Available Quantity */}
          <div className="flex flex-col">
            <label className="font-medium text-gray-700 mb-2">Available Quantity *</label>
            <input
              type="number"
              min="0"
              value={availableQty}
              onChange={(e) => setAvailableQty(Number(e.target.value))}
              className="rounded-md border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              required
            />
            {errors.availableQty && <span className="text-xs text-red-500 mt-1">{errors.availableQty}</span>}
          </div>
        </div>

        {/* Description with AI Category Suggestion */}
        <div className="flex flex-col">
          <label className="font-medium text-gray-700 mb-2">Product Description *</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe your product in detail for better AI category suggestion..."
            required
          />
          {errors.description && <span className="text-xs text-red-500 mt-1">{errors.description}</span>}
          
          {/* AI Category Suggestion Button */}
          <button
            type="button"
            onClick={handleCategorySuggestion}
            disabled={isAnalyzingCategory}
            className="mt-3 self-start px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium flex items-center space-x-2"
          >
            <span>🤖</span>
            <span>{isAnalyzingCategory ? "Analyzing..." : "Get AI Category Suggestion"}</span>
          </button>
        </div>

        {/* Category with AI Suggestion Display */}
        <div className="flex flex-col">
          <label className="font-medium text-gray-700 mb-2">Product Category *</label>
          
          {/* Show category suggestion if available */}
          {categorySuggestion && (
            <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-800">
                <strong>🎯 AI Suggestion:</strong> {categorySuggestion.categoryName} 
                <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                  {categorySuggestion.confidence}% confidence
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-2">
                <strong>Reasoning:</strong> {categorySuggestion.reason}
              </div>
            </div>
          )}
          
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.CategoryID} value={cat.CategoryID}>
                {cat.CategoryName}
                {categorySuggestion?.suggestedCategory === cat.CategoryID && " ✨ (AI Suggested)"}
              </option>
            ))}
          </select>
          {errors.category && <span className="text-xs text-red-500 mt-1">{errors.category}</span>}
        </div>

        {/* Enhanced Image Upload with Auto-Generation */}
        <div className="flex flex-col">
          <label className="font-medium text-gray-700 mb-2">Product Image</label>
          
          {/* Auto Image Generation Section */}
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-green-800">🤖 AI Image Generation</span>
                <p className="text-xs text-green-600 mt-1">
                  Generate professional product images automatically using AI
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoImageGeneration}
                disabled={isGeneratingImage}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
              >
                {isGeneratingImage ? "Generating..." : "Generate Image"}
              </button>
            </div>
            
            {useAutoImage && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-green-600">✅</span>
                <span className="text-green-700 font-medium">AI image will be generated automatically</span>
              </div>
            )}
          </div>

          {/* Manual Image Upload */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Or upload your own image:</label>
            <input
              type="file"
              accept="image/jpeg, image/png, image/jpg"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setImage(e.target.files[0]);
                  setUseAutoImage(false); // Switch to manual image
                }
              }}
              className="block w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-md p-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {image && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-blue-600">📁</span>
                <span className="text-blue-700">Manual image selected: {image.name}</span>
              </div>
            )}
          </div>
          
          {errors.image && <span className="text-xs text-red-500 mt-1">{errors.image}</span>}
        </div>

        {/* Submit Button */}
        <div className="border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-base font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Creating Product...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Add Product with AI Features</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
