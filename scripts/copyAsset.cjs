const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\Avita\\.gemini\\antigravity-ide\\brain\\eff6196d-7089-42c5-b5cc-8d89ba87c781\\construction_site_bg_1792239154513.jpg';
const dest = path.resolve(__dirname, '../public/construction-site-bg.jpg');

fs.copyFileSync(src, dest);
console.log('Successfully copied to', dest, 'Size:', fs.statSync(dest).size);
