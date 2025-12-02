import { Component, signal } from '@angular/core';
import { PDFDocument, rgb } from 'pdf-lib';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [CommonModule]
})
export class App {
  title = signal('PDF POC');
  pdfUrl = 'https://cdn.testbook.com/pdfs/2025/November/18/RRB%20Clerk%20Prelims%20Memory%20Based%20Paper%20%28Held%20On%2018%20August%202024%20Shift%201%29_English_1763453700.pdf';

  async generatePDFFromCDN() {
    try {
      // Fetch PDF from CDN
      const response = await fetch(this.pdfUrl);
      if (!response.ok) throw new Error('Failed to fetch PDF from CDN');
      const existingPdfBytes = await response.arrayBuffer();

      // Load PDF
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const originalPages = pdfDoc.getPages().slice();

      // Load watermark
      const watermarkImage = await this.loadWatermarkImage(pdfDoc);
      const watermarkDims = { width: watermarkImage.width, height: watermarkImage.height };

      // Create cover page (without watermark)
      const coverPage = pdfDoc.insertPage(0, [595.28, 841.89]);
      const { width: coverWidth, height: coverHeight } = coverPage.getSize();

      coverPage.drawRectangle({ x: 0, y: 0, width: coverWidth, height: coverHeight, color: rgb(0.9, 0.9, 0.9) });
      coverPage.drawText('COVER PAGE TITLE', { x: coverWidth / 2 - 120, y: coverHeight / 2 + 100, size: 30, color: rgb(1, 1, 1) });
      coverPage.drawText('This is the subtitle of the cover page', { x: coverWidth / 2 - 140, y: coverHeight / 2 + 60, size: 16, color: rgb(1, 1, 1) });

      // Rebuild pages with header, footer, watermark
      const headerHeight = 50;
      const footerHeight = 40;

      for (let i = 1; i < originalPages.length + 1; i++) {
        const oldPage = originalPages[i - 1];
        const { width, height } = oldPage.getSize();
        const embedded = await pdfDoc.embedPage(oldPage);

        const newPage = pdfDoc.insertPage(i, [width, height]);

        // Calculate available height between header and footer
        const availableHeight = height - headerHeight - footerHeight;

        // Scaling factor to fit the content
        const scale = availableHeight / height;

        // Y-offset to start drawing above footer
        const yOffset = footerHeight;

        // Draw original content scaled and shifted
        newPage.drawPage(embedded, {
          x: 0,
          y: yOffset,
          width,
          height: height * scale,
        });

        // Draw header
        newPage.drawRectangle({
          x: 0,
          y: height - headerHeight,
          width,
          height: headerHeight,
          color: rgb(0.204, 0.596, 0.859),
        });
        newPage.drawText(`Header - Page ${i}`, {
          x: width / 2 - 60,
          y: height - 30,
          size: 14,
          color: rgb(1, 1, 1),
        });

        // Draw footer
        newPage.drawRectangle({
          x: 0,
          y: 0,
          width,
          height: footerHeight,
          color: rgb(0.204, 0.596, 0.859),
        });
        newPage.drawText(`Footer - Page ${i}`, {
          x: width / 2 - 60,
          y: 15,
          size: 12,
          color: rgb(1, 1, 1),
        });

        // Draw watermark on all other pages
        newPage.drawImage(watermarkImage, {
          x: (width - watermarkDims.width) / 2,
          y: (height - watermarkDims.height) / 2,
          width: watermarkDims.width,
          height: watermarkDims.height,
          opacity: 0.2,
        });

        pdfDoc.removePage(i + 1);
      }

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      this.downloadPDF(pdfBytes, 'modified-CDN-PDF.pdf');
      alert('PDF generated successfully from CDN!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${(error as Error).message}`);
    }
  }

  private async loadWatermarkImage(pdfDoc: PDFDocument) {
    const url = 'https://cdn.testbook.com/article2pdf/v1/tb-logo-highres.png';
    try {
      const response = await fetch(url);
      const bytes = await response.arrayBuffer();
      return await pdfDoc.embedPng(bytes);
    } catch {
      return await this.createFallbackWatermark(pdfDoc);
    }
  }

  private async createFallbackWatermark(pdfDoc: PDFDocument) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(128,128,128,0.5)';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(200, 200);
    ctx.rotate(Math.PI / 4);
    ctx.fillText('WATERMARK', 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return await pdfDoc.embedPng(bytes);
  }

  private downloadPDF(pdfBytes: Uint8Array, filename: string) {
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
