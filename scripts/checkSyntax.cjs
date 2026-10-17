const fs = require('fs');
const code = fs.readFileSync('src/pages/CommercialBOQPage.jsx', 'utf8');

// Let's count matching braces, parens, and inspect where brackets/parens/tags differ
let parenCount = 0;
let braceCount = 0;
let inString = false;
let stringChar = '';
let inComment = false;

const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    const prev = j > 0 ? line[j-1] : '';
    const next = j < line.length - 1 ? line[j+1] : '';

    if (!inString && !inComment) {
      if (ch === '/' && next === '/') {
        break; // line comment
      }
      if (ch === '/' && next === '*') {
        inComment = true;
        j++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = true;
        stringChar = ch;
        continue;
      }
      if (ch === '(') parenCount++;
      if (ch === ')') parenCount--;
      if (ch === '{') braceCount++;
      if (ch === '}') braceCount--;
    } else if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        j++;
        continue;
      }
    } else if (inString) {
      if (ch === stringChar && prev !== '\\') {
        inString = false;
      }
    }
  }
  if (parenCount < 0 || braceCount < 0) {
    console.log(`Negative count at line ${i + 1}: parens=${parenCount}, braces=${braceCount}`);
    break;
  }
}
console.log(`Final counts: parens=${parenCount}, braces=${braceCount}`);
