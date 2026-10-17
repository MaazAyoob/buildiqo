const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('Copy construction background asset to public folder', () => {
  const src = 'C:\\Users\\Avita\\.gemini\\antigravity-ide\\brain\\eff6196d-7089-42c5-b5cc-8d89ba87c781\\construction_site_bg_1792239154513.jpg';
  const dest = path.resolve(__dirname, '../../public/construction-site-bg.jpg');

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
  assert.ok(fs.existsSync(dest), 'public/construction-site-bg.jpg exists');
  const stats = fs.statSync(dest);
  assert.ok(stats.size > 10000, 'Image file size is valid (>10KB)');
});
