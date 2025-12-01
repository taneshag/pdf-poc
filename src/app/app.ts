import { Component, signal } from '@angular/core';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true
})
export class App {
  title = signal('PDF POC');

  pdfContent: string = 'This is the main PDF content.';

  async generatePDF() {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Load watermark image from CDN
    const watermark = await this.loadImage('https://cdn.testbook.com/article2pdf/v1/tb-logo-highres.png');

    // --- COVER PAGE ---
    const coverHeaderHeight = 80;
    const coverFooterHeight = 60;

    // Cover background color
    doc.setFillColor(52, 152, 219); // Blue
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Cover title
    doc.setFontSize(30);
    doc.setTextColor(255, 255, 255);
    doc.text('COVER PAGE TITLE', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });

    // Cover subtitle
    doc.setFontSize(16);
    doc.text('This is the subtitle of the cover page', pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });

    // Cover watermark (full original size)
    this.addWatermark(doc, watermark.data, watermark.width, watermark.height);

    // --- CONTENT PAGES ---
    const numberOfPages = 3; // Example: 3 content pages
    for (let i = 1; i <= numberOfPages; i++) {
      doc.addPage();

      // HEADER
      const headerHeight = 50;
      doc.setFillColor(52, 152, 219);
      doc.rect(0, 0, pageWidth, headerHeight, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(`Header - Page ${i}`, pageWidth / 2, 30, { align: 'center' });

      // MAIN CONTENT
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`${this.pdfContent} - Page ${i}`, 40, 100);

      // FOOTER
      const footerHeight = 40;
      doc.setFillColor(52, 152, 219);
      doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(`Footer - Page ${i}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

      // WATERMARK
      this.addWatermark(doc, watermark.data, watermark.width, watermark.height);
    }

    doc.save('pdf-with-full-size-watermark.pdf');
  }

  private async loadImage(url: string): Promise<{ data: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Handle CORS
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve({ data: canvas.toDataURL('image/png'), width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private addWatermark(doc: jsPDF, imageData: string, originalWidth: number, originalHeight: number) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Center the image
    const x = (pageWidth - originalWidth) / 2;
    const y = (pageHeight - originalHeight) / 2;

    // Opacity
    if ((doc as any).setGState) {
      const gState = new (doc as any).GState({ opacity: 0.2 });
      doc.setGState(gState);
    }

    // Add image at full original size
    doc.addImage(imageData, 'PNG', x, y, originalWidth, originalHeight);

    // Reset opacity
    if ((doc as any).setGState) {
      const gState = new (doc as any).GState({ opacity: 1 });
      doc.setGState(gState);
    }
  }
}
