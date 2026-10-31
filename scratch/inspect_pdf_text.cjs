const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pdfBuf = fs.readFileSync(path.join(__dirname, 'test_output_current.pdf'));
const str = pdfBuf.toString('binary');

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
  // Find all TJ or Tj blocks
  const tjMatches = text.match(/\[(.*?)\]\s*TJ|\((.*?)\)\s*Tj/g);
  if (tjMatches) {
    console.log('Sample TJ blocks:');
    tjMatches.forEach((m, idx) => {
      // Extract text inside quotes or parens
      const cleaned = m.replace(/\[|\]|TJ|Tj|\(|\)/g, ' ').replace(/-\d+/g, '').replace(/\s+/g, ' ').trim();
      if (cleaned) console.log(`  ${idx}: ${cleaned}`);
    });
  }
}

