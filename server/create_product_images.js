#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Product images with their descriptions
const productImages = {
    'tomatoes_1.jpg': {
        emoji: '🍅',
        title: 'Fresh Organic\nTomatoes',
        color: '#dc2626', // red
        bgColor: '#fef2f2'
    },
    'tomatoes_2.jpg': {
        emoji: '🍅',
        title: 'Fresh\nTomatoes',
        color: '#dc2626',
        bgColor: '#fef2f2'
    },
    'apples_sweet.jpg': {
        emoji: '🍎',
        title: 'Sweet Red\nApples',
        color: '#dc2626',
        bgColor: '#fef2f2'
    },
    'apples_fresh.jpg': {
        emoji: '🍎',
        title: 'Fresh Red\nApples',
        color: '#dc2626',
        bgColor: '#fef2f2'
    },
    'apples_ai.jpg': {
        emoji: '🍎',
        title: 'AI Generated\nApples',
        color: '#7c3aed',
        bgColor: '#f3e8ff'
    },
    'bananas.jpg': {
        emoji: '🍌',
        title: 'Organic\nBananas',
        color: '#d97706',
        bgColor: '#fffbeb'
    },
    'oranges.jpg': {
        emoji: '🍊',
        title: 'Sweet\nOranges',
        color: '#ea580c',
        bgColor: '#fff7ed'
    },
    'mangoes.jpg': {
        emoji: '🥭',
        title: 'Fresh\nMangoes',
        color: '#d97706',
        bgColor: '#fffbeb'
    },
    'strawberries.jpg': {
        emoji: '🍓',
        title: 'Fresh\nStrawberries',
        color: '#dc2626',
        bgColor: '#fef2f2'
    },
    'carrots.jpg': {
        emoji: '🥕',
        title: 'Organic\nCarrots',
        color: '#ea580c',
        bgColor: '#fff7ed'
    },
    'lettuce.jpg': {
        emoji: '🥬',
        title: 'Green\nLettuce',
        color: '#16a34a',
        bgColor: '#f0fdf4'
    },
    'bell_peppers.jpg': {
        emoji: '🫑',
        title: 'Bell Peppers\nMix',
        color: '#16a34a',
        bgColor: '#f0fdf4'
    },
    'broccoli.jpg': {
        emoji: '🥦',
        title: 'Fresh\nBroccoli',
        color: '#16a34a',
        bgColor: '#f0fdf4'
    },
    'spinach.jpg': {
        emoji: '🥬',
        title: 'Organic\nSpinach',
        color: '#16a34a',
        bgColor: '#f0fdf4'
    },
    'basil_seeds.jpg': {
        emoji: '🌱',
        title: 'Organic Basil\nSeeds',
        color: '#16a34a',
        bgColor: '#f0fdf4'
    },
    'sunflower_seeds.jpg': {
        emoji: '🌻',
        title: 'Sunflower\nSeeds',
        color: '#d97706',
        bgColor: '#fffbeb'
    },
    'pumpkin_seeds.jpg': {
        emoji: '🎃',
        title: 'Pumpkin\nSeeds',
        color: '#ea580c',
        bgColor: '#fff7ed'
    },
    'herb_seeds.jpg': {
        emoji: '🌿',
        title: 'Herb Seed\nMix',
        color: '#16a34a',
        bgColor: '#f0fdf4'
    },
    'turmeric.jpg': {
        emoji: '🧄',
        title: 'Organic Turmeric\nPowder',
        color: '#d97706',
        bgColor: '#fffbeb'
    },
    'black_pepper.jpg': {
        emoji: '🫛',
        title: 'Black Pepper\nWhole',
        color: '#374151',
        bgColor: '#f9fafb'
    },
    'cinnamon.jpg': {
        emoji: '🍂',
        title: 'Cinnamon\nSticks',
        color: '#92400e',
        bgColor: '#fef3c7'
    }
};

// Function to create SVG image
function createProductImageSVG(filename, product) {
    const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${product.bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${product.color};stop-opacity:0.1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="300" fill="url(#bg)"/>
  
  <!-- Border -->
  <rect x="10" y="10" width="380" height="280" fill="none" stroke="${product.color}" stroke-width="2" rx="15"/>
  
  <!-- Main emoji -->
  <text x="200" y="120" font-size="80" text-anchor="middle" font-family="Arial, sans-serif">${product.emoji}</text>
  
  <!-- Product title -->
  <text x="200" y="180" font-size="24" font-weight="bold" text-anchor="middle" fill="${product.color}" font-family="Arial, sans-serif">
    ${product.title.split('\n').map((line, i) => 
        `<tspan x="200" dy="${i === 0 ? 0 : 30}">${line}</tspan>`
    ).join('')}
  </text>
  
  <!-- Decorative elements -->
  <circle cx="50" cy="50" r="20" fill="${product.color}" opacity="0.1"/>
  <circle cx="350" cy="250" r="25" fill="${product.color}" opacity="0.1"/>
  <circle cx="350" cy="50" r="15" fill="${product.color}" opacity="0.2"/>
  <circle cx="50" cy="250" r="18" fill="${product.color}" opacity="0.2"/>
  
  <!-- E-Pasar branding -->
  <text x="200" y="260" font-size="14" text-anchor="middle" fill="${product.color}" opacity="0.6" font-family="Arial, sans-serif">🌾 E-Pasar Fresh Products</text>
</svg>`;
    
    return svg;
}

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'images', 'products');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Generate SVG files for each product
Object.entries(productImages).forEach(([filename, product]) => {
    const svgContent = createProductImageSVG(filename, product);
    const svgFilename = filename.replace('.jpg', '.svg');
    const filePath = path.join(imagesDir, svgFilename);
    
    fs.writeFileSync(filePath, svgContent);
    console.log(`Created: ${svgFilename}`);
});

console.log('\n✅ All product images created successfully!');
console.log(`📁 Images saved in: ${imagesDir}`);
console.log('\n🔄 Restart the backend server to see the images.');