// Unsplash service for auto-generating product images
const { createApi } = require('unsplash-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Initialize Unsplash API
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
});

/**
 * Generate image for product using Unsplash API
 * @param {string} productName - Name of the product to search for
 * @param {string} category - Category name for better search results
 * @returns {Object} - {success: boolean, imagePath: string, error: string}
 */
const generateProductImage = async (productName, category = '') => {
    try {
        // Create search query combining product name and category
        const searchQuery = `${productName} ${category} fresh agricultural food`.trim();
        
        console.log(`Searching Unsplash for: ${searchQuery}`);

        // Search for images on Unsplash
        const result = await unsplash.search.getPhotos({
            query: searchQuery,
            page: 1,
            perPage: 10,
            orientation: 'landscape', // Better for product display
        });

        if (result.errors) {
            console.error('Unsplash API errors:', result.errors);
            return {
                success: false,
                error: 'Failed to search images: ' + result.errors.join(', ')
            };
        }

        if (!result.response?.results || result.response.results.length === 0) {
            console.log('No images found, using fallback search');
            // Fallback search with just the category
            const fallbackResult = await unsplash.search.getPhotos({
                query: category || 'fresh vegetables fruits',
                page: 1,
                perPage: 5,
                orientation: 'landscape',
            });
            
            if (!fallbackResult.response?.results || fallbackResult.response.results.length === 0) {
                return {
                    success: false,
                    error: 'No suitable images found for this product'
                };
            }
            
            result.response.results = fallbackResult.response.results;
        }

        // Select the first image (usually the most relevant)
        const selectedImage = result.response.results[0];
        const imageUrl = selectedImage.urls.regular; // Good quality for products
        
        console.log(`Selected image from: ${selectedImage.user.name}`);

        // Download and save the image
        const imagePath = await downloadImage(imageUrl, productName);
        
        if (imagePath) {
            return {
                success: true,
                imagePath: imagePath,
                imageInfo: {
                    photographer: selectedImage.user.name,
                    photographerUrl: selectedImage.user.links.html,
                    downloadLocation: selectedImage.links.download_location
                }
            };
        } else {
            return {
                success: false,
                error: 'Failed to download image'
            };
        }

    } catch (error) {
        console.error('Error generating product image:', error);
        return {
            success: false,
            error: `Image generation failed: ${error.message}`
        };
    }
};

/**
 * Download image from URL and save to local storage
 * @param {string} imageUrl - URL of the image to download
 * @param {string} productName - Name of the product (for filename)
 * @returns {string|null} - Filename of saved image or null if failed
 */
const downloadImage = async (imageUrl, productName) => {
    try {
        // Create filename from product name
        const sanitizedProductName = productName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const timestamp = Date.now();
        const filename = `auto_${sanitizedProductName}_${timestamp}.jpg`;
        
        // Ensure images directory exists
        const imagesDir = path.join(__dirname, '..', 'images', 'products');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        const filepath = path.join(imagesDir, filename);

        // Download image
        const response = await axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'stream'
        });

        // Save image to file
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`Image saved successfully: ${filename}`);
                resolve(filename);
            });
            writer.on('error', (error) => {
                console.error('Error saving image:', error);
                reject(null);
            });
        });

    } catch (error) {
        console.error('Error downloading image:', error);
        return null;
    }
};

/**
 * Get multiple image options for a product
 * @param {string} productName - Name of the product
 * @param {string} category - Category name
 * @param {number} count - Number of images to return (max 10)
 * @returns {Array} - Array of image URLs with metadata
 */
const getImageOptions = async (productName, category = '', count = 5) => {
    try {
        const searchQuery = `${productName} ${category} fresh agricultural food`.trim();
        
        const result = await unsplash.search.getPhotos({
            query: searchQuery,
            page: 1,
            perPage: Math.min(count, 10),
            orientation: 'landscape',
        });

        if (result.errors || !result.response?.results) {
            return [];
        }

        return result.response.results.map(photo => ({
            id: photo.id,
            url: photo.urls.small,
            regularUrl: photo.urls.regular,
            description: photo.description || photo.alt_description || 'Product image',
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html
        }));

    } catch (error) {
        console.error('Error getting image options:', error);
        return [];
    }
};

module.exports = {
    generateProductImage,
    getImageOptions,
    downloadImage
};