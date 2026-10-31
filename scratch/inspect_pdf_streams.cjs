const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pdfBuf = fs.readFileSync(path.join(__dirname, 'test_output_current.pdf'));
const str = pdfBuf.toString('binary');

// Count pages
const pageMatches = str.match(/\/Type\s*\/Page\b/g);
console.log('Page objects count:', pageMatches ? pageMatches.length : 0);

// Decompress streams
const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
let match;
let streamIndex = 0;
while ((match = streamRegex.exec(str)) !== null) {
  const rawStream = Buffer.from(match[1], 'binary');
  let decompressed;
  try {
    decompressed = zlib.inflateSync(rawStream);
  } catch (e) {
    decompressed = rawStream;
  }
  const text = decompressed.toString('utf8');
  console.log(`\n=== STREAM ${streamIndex++} (Length: ${text.length}) ===`);
  // Find text strings in parentheses: ( ... ) Tj or '
  const textMatches = text.match(/\((.*?)\)\s*Tj/g);
  if (textMatches) {
    console.log('Text count:', textMatches.length);
    console.log(textMatches.slice(0, 15).map(m => m.replace(/\\/g, '')).join(' | '));
  }
}

