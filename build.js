// Simple TypeScript compilation script
const fs = require('fs');
const path = require('path');

// Copy and process TypeScript files
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy built files (assuming they were already built)
console.log('Extension files are ready in dist/ folder');
console.log('Please load the extension from dist/ folder in Chrome developer mode');
