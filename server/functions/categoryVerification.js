// Simple category verification based on keywords
const { CATEGORY } = require('../models');

const categoryKeywords = {
    1: { // Fruits
        name: 'Fruits',
        keywords: ['apple', 'banana', 'orange', 'grape', 'mango', 'pineapple', 'strawberry', 'berry', 'citrus', 'fruit', 'peach', 'pear', 'cherry', 'plum', 'melon', 'watermelon', 'kiwi', 'papaya', 'guava', 'coconut', 'avocado']
    },
    2: { // Vegetables
        name: 'Vegetables',
        keywords: ['carrot', 'lettuce', 'tomato', 'potato', 'onion', 'garlic', 'cabbage', 'broccoli', 'spinach', 'cucumber', 'pepper', 'celery', 'radish', 'beet', 'vegetable', 'green', 'leafy', 'root', 'tuber', 'squash', 'zucchini', 'eggplant', 'cauliflower']
    },
    3: { // Seeds
        name: 'Seeds', 
        keywords: ['seed', 'grain', 'wheat', 'rice', 'corn', 'barley', 'oats', 'quinoa', 'chia', 'flax', 'sunflower', 'pumpkin', 'sesame', 'plant', 'grow', 'sowing', 'germinate', 'sprout']
    },
    4: { // Spices
        name: 'Spices',
        keywords: ['spice', 'herb', 'pepper', 'salt', 'ginger', 'turmeric', 'cumin', 'coriander', 'cinnamon', 'clove', 'cardamom', 'nutmeg', 'paprika', 'chili', 'basil', 'oregano', 'thyme', 'rosemary', 'sage', 'mint', 'parsley', 'seasoning', 'flavor', 'aromatic']
    }
};

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