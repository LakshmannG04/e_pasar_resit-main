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
 * Enhanced product verification - checks if product is suitable for agricultural marketplace
 * @param {string} productName - Name of the product
 * @param {string} description - Product description
 * @returns {Object} - Verification result with approval status
 */
const verifyProductSuitability = async (productName, description) => {
    try {
        const textToAnalyze = `${productName} ${description}`.toLowerCase();
        
        // Step 1: Check for forbidden keywords (non-agricultural items)
        const detectedForbiddenKeywords = [];
        for (const forbiddenKeyword of forbiddenKeywords) {
            if (textToAnalyze.includes(forbiddenKeyword)) {
                detectedForbiddenKeywords.push(forbiddenKeyword);
            }
        }

        // If forbidden keywords found, reject immediately
        if (detectedForbiddenKeywords.length > 0) {
            return {
                approved: false,
                reason: 'FORBIDDEN_PRODUCT',
                message: `This product is not suitable for our agricultural marketplace. Detected non-agricultural items: ${detectedForbiddenKeywords.join(', ')}`,
                confidence: 0,
                suggestedCategory: null,
                forbiddenKeywords: detectedForbiddenKeywords,
                recommendation: 'Please list only agricultural products: fruits, vegetables, seeds, or spices.'
            };
        }

        // Step 2: Analyze agricultural category match
        let bestMatch = {
            categoryId: null,
            confidence: 0,
            matchedKeywords: [],
            score: 0
        };

        // Check each agricultural category for keyword matches
        for (const [categoryId, categoryInfo] of Object.entries(categoryKeywords)) {
            const matchedKeywords = [];
            let score = 0;

            // Check for keyword matches with weighted scoring
            for (const keyword of categoryInfo.keywords) {
                if (textToAnalyze.includes(keyword)) {
                    matchedKeywords.push(keyword);
                    // More sophisticated scoring system
                    if (productName.toLowerCase().includes(keyword)) {
                        score += 5; // Product name match is most important
                    } else if (description.toLowerCase().includes(keyword)) {
                        score += 2; // Description match
                    }
                    
                    // Bonus for exact word matches (not just substring)
                    const words = textToAnalyze.split(/\s+/);
                    if (words.includes(keyword)) {
                        score += 3; // Exact word match bonus
                    }
                }
            }

            // Enhanced confidence calculation
            // Base confidence on match ratio and absolute score
            const matchRatio = matchedKeywords.length / Math.min(categoryInfo.keywords.length, 20); // Cap at 20 to avoid dilution
            const confidence = Math.min((matchRatio * 60) + (score * 2), 100);

            if (confidence > bestMatch.confidence) {
                bestMatch = {
                    categoryId: parseInt(categoryId),
                    confidence: Math.round(confidence),
                    matchedKeywords: matchedKeywords,
                    score: score
                };
            }
        }

        // Step 3: Determine approval based on confidence threshold
        const isApproved = bestMatch.confidence >= MINIMUM_CONFIDENCE_THRESHOLD;
        const isHighConfidence = bestMatch.confidence >= RECOMMENDED_CONFIDENCE_THRESHOLD;

        if (!isApproved) {
            return {
                approved: false,
                reason: 'LOW_AGRICULTURAL_MATCH',
                message: `This product doesn't appear to be a suitable agricultural item (confidence: ${bestMatch.confidence}%). Please ensure your product is a fruit, vegetable, seed, or spice with a clear agricultural description.`,
                confidence: bestMatch.confidence,
                suggestedCategory: null,
                matchedKeywords: bestMatch.matchedKeywords,
                recommendation: 'Try using more specific agricultural terms in your product name and description. Include words like "fresh", "organic", "grown", "harvest", etc.'
            };
        }

        const categoryName = categoryKeywords[bestMatch.categoryId].name;
        
        return {
            approved: true,
            reason: isHighConfidence ? 'HIGH_CONFIDENCE_MATCH' : 'ACCEPTABLE_MATCH',
            message: isHighConfidence 
                ? `Excellent match! This product clearly belongs to the ${categoryName} category.`
                : `Good match for ${categoryName} category, but consider adding more specific agricultural terms for better classification.`,
            confidence: bestMatch.confidence,
            suggestedCategory: bestMatch.categoryId,
            categoryName: categoryName,
            matchedKeywords: bestMatch.matchedKeywords,
            thresholdInfo: {
                minimum: MINIMUM_CONFIDENCE_THRESHOLD,
                recommended: RECOMMENDED_CONFIDENCE_THRESHOLD,
                achieved: bestMatch.confidence
            }
        };

    } catch (error) {
        console.error('Error in product verification:', error);
        return {
            approved: false,
            reason: 'SYSTEM_ERROR',
            message: "Error analyzing product. Please try again or contact support.",
            confidence: 0,
            suggestedCategory: null,
            matchedKeywords: []
        };
    }
};

/**
 * Legacy function for backward compatibility - now uses enhanced verification
 * @param {string} productName - Name of the product
 * @param {string} description - Product description
 * @returns {Object} - Category suggestion with approval info
 */
const suggestCategory = async (productName, description) => {
    const verificationResult = await verifyProductSuitability(productName, description);
    
    // Convert to legacy format but include approval info
    return {
        suggestedCategory: verificationResult.suggestedCategory || 1,
        confidence: verificationResult.confidence,
        reason: verificationResult.message,
        categoryName: verificationResult.categoryName || 'Unknown',
        matchedKeywords: verificationResult.matchedKeywords || [],
        // New fields for enhanced verification
        approved: verificationResult.approved,
        verificationReason: verificationResult.reason,
        recommendation: verificationResult.recommendation,
        forbiddenKeywords: verificationResult.forbiddenKeywords
    };
};

/**
 * Get all available categories with enhanced information
 * @returns {Array} - List of categories with their keywords and thresholds
 */
const getAvailableCategories = () => {
    return Object.entries(categoryKeywords).map(([id, info]) => ({
        id: parseInt(id),
        name: info.name,
        sampleKeywords: info.keywords.slice(0, 8), // Show first 8 keywords as examples
        totalKeywords: info.keywords.length,
        confidenceThresholds: {
            minimum: MINIMUM_CONFIDENCE_THRESHOLD,
            recommended: RECOMMENDED_CONFIDENCE_THRESHOLD
        }
    }));
};

/**
 * Get detailed verification information for UI display
 * @returns {Object} - Verification system information
 */
const getVerificationInfo = () => {
    return {
        systemType: 'Enhanced Agricultural Product Verification',
        minimumConfidence: MINIMUM_CONFIDENCE_THRESHOLD,
        recommendedConfidence: RECOMMENDED_CONFIDENCE_THRESHOLD,
        categories: getAvailableCategories(),
        forbiddenItemsCount: forbiddenKeywords.length,
        sampleForbiddenItems: [
            'furniture (chairs, tables, sofas)',
            'electronics (phones, computers, TVs)', 
            'clothing (shirts, pants, shoes)',
            'vehicles (cars, bikes, boats)',
            'tools (hammers, drills, saws)',
            'toys and games',
            'beauty products',
            'office supplies'
        ],
        guidelines: [
            'Products must be agricultural items: fruits, vegetables, seeds, or spices',
            'Use specific agricultural terms in product names and descriptions',
            'Include descriptive words like "fresh", "organic", "grown", "harvest"',
            'Avoid generic terms - be specific about your agricultural product',
            'Minimum confidence threshold: ' + MINIMUM_CONFIDENCE_THRESHOLD + '%'
        ]
    };
};

module.exports = {
    suggestCategory,
    verifyProductSuitability,
    getAvailableCategories,
    getVerificationInfo,
    categoryKeywords,
    forbiddenKeywords,
    MINIMUM_CONFIDENCE_THRESHOLD,
    RECOMMENDED_CONFIDENCE_THRESHOLD
};