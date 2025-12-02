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
  selectedFile: File | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
      console.log('PDF selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    } else {
      alert('Please select a valid PDF file');
      this.selectedFile = null;
    }
  }

  async generatePDF() {
    if (!this.selectedFile) {
      alert('Please select a PDF file first');
      return;
    }

    try {
      const existingPdfBytes = await this.selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const originalPages = pdfDoc.getPages().slice(); // clone list before modifying

      // Load watermark
      const watermarkImage = await this.loadWatermarkImage(pdfDoc);
      const watermarkDims = { width: watermarkImage.width, height: watermarkImage.height };

      // -----------------------------
      // ⭐ 1. CREATE COVER PAGE
      // -----------------------------
      const coverPage = pdfDoc.insertPage(0, [595.28, 841.89]);
      const { width: coverWidth, height: coverHeight } = coverPage.getSize();

      coverPage.drawRectangle({
        x: 0, y: 0, width: coverWidth, height: coverHeight,
        color: rgb(0.9, 0.9, 0.9)
      });

      coverPage.drawText('COVER PAGE TITLE', {
        x: coverWidth / 2 - 120,
        y: coverHeight / 2 + 100,
        size: 30,
        color: rgb(1, 1, 1),
      });

      coverPage.drawText('This is the subtitle of the cover page', {
        x: coverWidth / 2 - 140,
        y: coverHeight / 2 + 60,
        size: 16,
        color: rgb(1, 1, 1),
      });

      coverPage.drawImage(watermarkImage, {
        x: (coverWidth - watermarkDims.width) / 2,
        y: (coverHeight - watermarkDims.height) / 2,
        width: watermarkDims.width,
        height: watermarkDims.height,
        opacity: 0.2,
      });

      // -----------------------------
      // ⭐ 2. REPLACE EACH PAGE WITH A NEW PAGE
      // -----------------------------
      for (let i = 1; i < originalPages.length + 1; i++) {
        const oldPage = originalPages[i - 1];
        const { width, height } = oldPage.getSize();

        // Extract old page content as embedded page
        const embedded = await pdfDoc.embedPage(oldPage);

        // Create new page (THIS FIXES YOUR PROBLEM)
        const newPage = pdfDoc.insertPage(i, [width, height]);

        // Draw original page FIRST
        newPage.drawPage(embedded, { x: 0, y: 0, width, height });

        // HEADER (always on top)
        const headerHeight = 50;
        newPage.drawRectangle({
          x: 0, y: height - headerHeight,
          width, height: headerHeight,
          color: rgb(0.204, 0.596, 0.859)
        });

        newPage.drawText(`Header - Page ${i}`, {
          x: width / 2 - 60,
          y: height - 30,
          size: 14,
          color: rgb(1, 1, 1)
        });

        // FOOTER (always on top)
        const footerHeight = 40;
        newPage.drawRectangle({
          x: 0, y: 0,
          width, height: footerHeight,
          color: rgb(0.204, 0.596, 0.859)
        });

        newPage.drawText(`Footer - Page ${i}`, {
          x: width / 2 - 60,
          y: 15,
          size: 12,
          color: rgb(1, 1, 1)
        });

        // WATERMARK (still below header/footer)
        newPage.drawImage(watermarkImage, {
          x: (width - watermarkDims.width) / 2,
          y: (height - watermarkDims.height) / 2,
          width: watermarkDims.width,
          height: watermarkDims.height,
          opacity: 0.2,
        });

        // Remove the original old page
        pdfDoc.removePage(i + 1);
      }

      // -----------------------------
      // SAVE PDF
      // -----------------------------
      const pdfBytes = await pdfDoc.save();
      this.downloadPDF(pdfBytes, 'modified-' + this.selectedFile.name);

      alert('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${(error as Error).message}`);
    }
  }

  // -----------------------------
  // LOAD WATERMARK IMAGE
  // -----------------------------
  private async loadWatermarkImage(pdfDoc: PDFDocument) {
    const url = 'https://cdn.testbook.com/article2pdf/v1/tb-logo-highres.png';

    try {
      const response = await fetch(url);
      const imageBytes = await response.arrayBuffer();
      return await pdfDoc.embedPng(imageBytes);
    } catch (error) {
      console.warn('Watermark load failed. Using fallback.');
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
