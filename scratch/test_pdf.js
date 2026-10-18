import PDFDocument from 'pdfkit';
import fs from 'fs';

console.log('Testing PDFKit encoding...');
const doc = new PDFDocument({ margin: 40, size: 'A4' });
const stream = fs.createWriteStream('./scratch/test_output.pdf');
doc.pipe(stream);

doc.fontSize(16).text('Buildiqo Test', 50, 50);
try {
  doc.fontSize(12).text('Testing Rupee: ₹ 2,250 / sq.ft', 50, 80);
  console.log('Text with rupee written.');
} catch (e) {
  console.error('Error writing rupee:', e);
}

doc.end();
stream.on('finish', () => {
  console.log('PDF written successfully. Size:', fs.statSync('./scratch/test_output.pdf').size);
});
