import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { InvoiceItem } from '../types/InvoiceItems.js';

export async function generateInvoicePDF(
  items: InvoiceItem[],
  total: number,
  filePath: string
) {
  return new Promise<void>(async (resolve, reject) => {
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(16).text('Smart Cart - Modern eCommerce', { align: 'center' });
    doc.fontSize(12).text('Your trusted online store', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(20).text('Order Invoice', { align: 'center' });
    doc.moveDown();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      doc.fontSize(12).text(`Item ${i + 1}:`);
      doc.text(`Product ID: ${item.productId}`);
      doc.text(`Quantity: ${item.quantity}`);
      doc.text(`Price: $${item.price}`);

      try {
        const response = await axios.get(item.img_url, {
          responseType: 'arraybuffer',
        });
        const originalBuffer = Buffer.from(response.data);

        // Convert to PNG for compatibility
        const pngBuffer = await sharp(originalBuffer).png().toBuffer();

        doc.image(pngBuffer, { width: 100, height: 100 });
      } catch (err) {
        doc.text(`(Failed to load image from: ${item.img_url})`);
      }

      doc.moveDown();
    }

    doc.fontSize(14).text(`Total: $${total.toFixed(2)}`, { align: 'right' });
    doc.end();

    writeStream.on('finish', () => resolve());
    writeStream.on('error', (err) => reject(err));
  });
}
