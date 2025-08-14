// Enhanced restrictive category verification system for agricultural marketplace
const { CATEGORY } = require('../models');

// Expanded agricultural keywords with better coverage
const categoryKeywords = {
    1: { // Fruits
        name: 'Fruits',
        keywords: [
            // Common fruits
            'apple', 'banana', 'orange', 'grape', 'mango', 'pineapple', 'strawberry', 'berry', 'citrus', 'fruit',
            'peach', 'pear', 'cherry', 'plum', 'melon', 'watermelon', 'kiwi', 'papaya', 'guava', 'coconut', 'avocado',
            // Additional fruits
            'lemon', 'lime', 'grapefruit', 'apricot', 'fig', 'date', 'pomegranate', 'passion', 'dragon', 'star',
            'lychee', 'rambutan', 'durian', 'jackfruit', 'breadfruit', 'tamarind', 'cranberry', 'blueberry',
            'raspberry', 'blackberry', 'gooseberry', 'elderberry', 'mulberry', 'boysenberry',
            // Fruit descriptors
            'fresh', 'ripe', 'juicy', 'sweet', 'tropical', 'organic', 'natural', 'harvest', 'orchard'
        ]
    },
    2: { // Vegetables
        name: 'Vegetables',
        keywords: [
            // Common vegetables
            'carrot', 'lettuce', 'tomato', 'potato', 'onion', 'garlic', 'cabbage', 'broccoli', 'spinach',
            'cucumber', 'pepper', 'celery', 'radish', 'beet', 'vegetable', 'green', 'leafy', 'root', 'tuber',
            'squash', 'zucchini', 'eggplant', 'cauliflower',
            // Additional vegetables
            'mushroom', 'asparagus', 'artichoke', 'brussels', 'kale', 'chard', 'collard', 'arugula',
            'watercress', 'endive', 'fennel', 'leek', 'scallion', 'shallot', 'turnip', 'parsnip',
            'rutabaga', 'kohlrabi', 'okra', 'peas', 'beans', 'corn', 'sweet', 'bell', 'chili', 'jalapeño',
            'habanero', 'serrano', 'poblano', 'anaheim', 'cayenne',
            // Vegetable descriptors
            'fresh', 'organic', 'leafy', 'crunchy', 'farm', 'grown', 'harvest', 'produce'
        ]
    },
    3: { // Seeds
        name: 'Seeds',
        keywords: [
            // Seeds and grains
            'seed', 'grain', 'wheat', 'rice', 'corn', 'barley', 'oats', 'quinoa', 'chia', 'flax',
            'sunflower', 'pumpkin', 'sesame', 'plant', 'grow', 'sowing', 'germinate', 'sprout',
            // Additional seeds
            'hemp', 'poppy', 'mustard', 'caraway', 'fennel', 'dill', 'anise', 'alfalfa', 'clover',
            'buckwheat', 'millet', 'amaranth', 'teff', 'sorghum', 'rye', 'spelt', 'kamut',
            'legume', 'lentil', 'chickpea', 'blackeye', 'mung', 'adzuki', 'lima', 'navy', 'pinto',
            // Seed descriptors
            'planting', 'gardening', 'cultivation', 'agriculture', 'farming', 'nursery', 'heirloom',
            'non-gmo', 'hybrid', 'variety'
        ]
    },
    4: { // Spices
        name: 'Spices',
        keywords: [
            // Common spices
            'spice', 'herb', 'pepper', 'salt', 'ginger', 'turmeric', 'cumin', 'coriander', 'cinnamon',
            'clove', 'cardamom', 'nutmeg', 'paprika', 'chili', 'basil', 'oregano', 'thyme', 'rosemary',
            'sage', 'mint', 'parsley', 'seasoning', 'flavor', 'aromatic',
            // Additional spices and herbs
            'allspice', 'anise', 'bay', 'chives', 'cilantro', 'curry', 'fenugreek', 'garlic', 'horseradish',
            'lavender', 'lemongrass', 'marjoram', 'mustard', 'saffron', 'tarragon', 'vanilla', 'wasabi',
            'star', 'juniper', 'mace', 'galangal', 'asafoetida', 'sumac', 'za\'atar', 'harissa',
            'berbere', 'garam', 'masala', 'chinese', 'five', 'herbes', 'provence',
            // Spice descriptors
            'dried', 'ground', 'whole', 'powder', 'fresh', 'organic', 'medicinal', 'culinary',
            'traditional', 'authentic', 'premium'
        ]
    }
};

// Forbidden/negative keywords that indicate non-agricultural products
const forbiddenKeywords = [
    // Furniture
    'chair', 'table', 'desk', 'sofa', 'couch', 'bed', 'mattress', 'dresser', 'cabinet', 'shelf',
    'bookcase', 'wardrobe', 'nightstand', 'ottoman', 'bench', 'stool', 'lamp', 'mirror',
    
    // Electronics
    'phone', 'computer', 'laptop', 'tablet', 'television', 'tv', 'radio', 'speaker', 'headphone',
    'camera', 'drone', 'gaming', 'console', 'monitor', 'keyboard', 'mouse', 'charger', 'cable',
    'battery', 'electronic', 'digital', 'smart', 'wifi', 'bluetooth', 'usb',
    
    // Clothing
    'shirt', 'pants', 'dress', 'shoe', 'boot', 'hat', 'cap', 'jacket', 'coat', 'sweater',
    'jeans', 'shorts', 'skirt', 'blouse', 'suit', 'tie', 'belt', 'sock', 'underwear',
    'clothing', 'apparel', 'fashion', 'fabric', 'textile',
    
    // Vehicles
    'car', 'truck', 'bike', 'bicycle', 'motorcycle', 'scooter', 'boat', 'ship', 'plane',
    'vehicle', 'automotive', 'engine', 'tire', 'wheel', 'brake', 'transmission',
    
    // Tools and Hardware
    'hammer', 'screwdriver', 'wrench', 'drill', 'saw', 'nail', 'screw', 'bolt', 'nut',
    'tool', 'hardware', 'machinery', 'equipment', 'device', 'gadget', 'appliance',
    
    // Household items
    'dish', 'plate', 'cup', 'glass', 'bowl', 'fork', 'knife', 'spoon', 'pot', 'pan',
    'cookware', 'kitchenware', 'utensil', 'bottle', 'jar', 'container', 'box', 'bag',
    'plastic', 'metal', 'steel', 'aluminum', 'ceramic', 'glass', 'wood', 'bamboo',
    
    // Toys and Games
    'toy', 'game', 'puzzle', 'doll', 'action', 'figure', 'lego', 'board', 'card',
    'video', 'mobile', 'app', 'software',
    
    // Beauty and Personal Care
    'makeup', 'cosmetic', 'lipstick', 'foundation', 'mascara', 'perfume', 'cologne',
    'shampoo', 'conditioner', 'soap', 'lotion', 'cream', 'oil', 'toothbrush', 'toothpaste',
    
    // Books and Media
    'book', 'magazine', 'newspaper', 'cd', 'dvd', 'bluray', 'movie', 'music', 'album',
    
    // Sports Equipment
    'ball', 'bat', 'racket', 'club', 'stick', 'helmet', 'pad', 'glove', 'jersey',
    'equipment', 'sports', 'fitness', 'gym', 'exercise',
    
    // Office Supplies
    'pen', 'pencil', 'paper', 'notebook', 'folder', 'file', 'stapler', 'clip', 'tape',
    'office', 'supply', 'stationary',
    
    // Jewelry and Accessories
    'ring', 'necklace', 'bracelet', 'earring', 'watch', 'jewelry', 'gold', 'silver',
    'diamond', 'gem', 'accessory',
    
    // Services (non-physical)
    'service', 'consultation', 'lesson', 'class', 'course', 'training', 'workshop',
    'repair', 'maintenance', 'installation', 'delivery', 'shipping'
];

// Minimum confidence threshold for product approval
const MINIMUM_CONFIDENCE_THRESHOLD = 25;
const RECOMMENDED_CONFIDENCE_THRESHOLD = 40;

/**
 * Analyze product description and suggest category
 * @param {string} productName - Name of the product
 * @param {string} description - Product description
 * @returns {Object} - {suggestedCategory: number, confidence: number, reason: string}
 */
const suggestCategory = async (productName, description) => {
    try {
        // Combine product name and description for analysis
        const textToAnalyze = `${productName} ${description}`.toLowerCase();
        
        let bestMatch = {
            categoryId: 1, // Default to fruits
            confidence: 0,
            matchedKeywords: []
        };

        // Check each category for keyword matches
        for (const [categoryId, categoryInfo] of Object.entries(categoryKeywords)) {
            const matchedKeywords = [];
            let score = 0;

            // Check for keyword matches
            for (const keyword of categoryInfo.keywords) {
                if (textToAnalyze.includes(keyword)) {
                    matchedKeywords.push(keyword);
                    // Give higher score for matches in product name
                    if (productName.toLowerCase().includes(keyword)) {
                        score += 3; // Product name match is more important
                    } else {
                        score += 1; // Description match
                    }
                }
            }

            // Calculate confidence based on matches
            const confidence = Math.min((score / categoryInfo.keywords.length) * 100, 100);

            if (confidence > bestMatch.confidence) {
                bestMatch = {
                    categoryId: parseInt(categoryId),
                    confidence: Math.round(confidence),
                    matchedKeywords: matchedKeywords
                };
            }
        }

        // If confidence is too low, provide general suggestion
        if (bestMatch.confidence < 20) {
            return {
                suggestedCategory: 1, // Default to fruits
                confidence: 10,
                reason: "Low keyword match. Please manually select the most appropriate category.",
                matchedKeywords: []
            };
        }

        const categoryName = categoryKeywords[bestMatch.categoryId].name;
        
        return {
            suggestedCategory: bestMatch.categoryId,
            confidence: bestMatch.confidence,
            reason: `Based on keywords: ${bestMatch.matchedKeywords.join(', ')}`,
            categoryName: categoryName,
            matchedKeywords: bestMatch.matchedKeywords
        };

    } catch (error) {
        console.error('Error in category suggestion:', error);
        return {
            suggestedCategory: 1,
            confidence: 0,
            reason: "Error in analysis. Please select category manually.",
            matchedKeywords: []
        };
    }
};

/**
 * Get all available categories
 * @returns {Array} - List of categories with their keywords
 */
const getAvailableCategories = () => {
    return Object.entries(categoryKeywords).map(([id, info]) => ({
        id: parseInt(id),
        name: info.name,
        sampleKeywords: info.keywords.slice(0, 5) // Show first 5 keywords as examples
    }));
};

module.exports = {
    suggestCategory,
    getAvailableCategories,
    categoryKeywords
};