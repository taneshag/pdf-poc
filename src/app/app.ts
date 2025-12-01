import { Component, signal } from '@angular/core';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
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
    const pages = pdfDoc.getPages();

    // Load watermark image
    const watermarkImage = await this.loadWatermarkImage(pdfDoc);
    const watermarkDims = { width: watermarkImage.width, height: watermarkImage.height };

    const coverPage = pdfDoc.insertPage(0, [595.28, 841.89]); // A4 cover page at start
    const { width: coverWidth, height: coverHeight } = coverPage.getSize();

    // --- COVER PAGE BACKGROUND ---
    coverPage.drawRectangle({
      x: 0,
      y: 0,
      width: coverWidth,
      height: coverHeight,
      color: rgb(0.9, 0.9, 0.9), // change background color here
    });

    // --- COVER PAGE TITLE ---
    coverPage.drawText('COVER PAGE TITLE', {
      x: coverWidth / 2 - 120,
      y: coverHeight / 2 + 100,
      size: 30,
      color: rgb(1, 1, 1),
    });

    // --- COVER PAGE SUBTITLE ---
    coverPage.drawText('This is the subtitle of the cover page', {
      x: coverWidth / 2 - 140,
      y: coverHeight / 2 + 60,
      size: 16,
      color: rgb(1, 1, 1),
    });

    // --- COVER PAGE CENTERED WATERMARK ---
    coverPage.drawImage(watermarkImage, {
      x: (coverWidth - watermarkDims.width) / 2,
      y: (coverHeight - watermarkDims.height) / 2,
      width: watermarkDims.width,
      height: watermarkDims.height,
      opacity: 0.2,
    });

    // --- PROCESS OTHER PAGES ---
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();

      // Header
      const headerHeight = 50;
      page.drawRectangle({ x: 0, y: height - headerHeight, width, height: headerHeight, color: rgb(0.204, 0.596, 0.859) });
      page.drawText(`Header - Page ${index + 1}`, { x: width / 2 - 60, y: height - 30, size: 14, color: rgb(1, 1, 1) });

      // Footer
      const footerHeight = 40;
      page.drawRectangle({ x: 0, y: 0, width, height: footerHeight, color: rgb(0.204, 0.596, 0.859) });
      page.drawText(`Footer - Page ${index + 1}`, { x: width / 2 - 60, y: 15, size: 12, color: rgb(1, 1, 1) });

      // Centered watermark
      page.drawImage(watermarkImage, {
        x: (width - watermarkDims.width) / 2,
        y: (height - watermarkDims.height) / 2,
        width: watermarkDims.width,
        height: watermarkDims.height,
        opacity: 0.2,
      });
    });

    const pdfBytes = await pdfDoc.save();
    this.downloadPDF(pdfBytes, 'modified-' + this.selectedFile.name);
    alert('PDF generated successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Failed to generate PDF: ${(error as Error).message}`);
  }
}


  
  private async loadWatermarkImage(pdfDoc: PDFDocument) {
    try {
      // Try to load from CDN with multiple proxies
      const watermarkUrl = 'https://cdn.testbook.com/article2pdf/v1/tb-logo-highres.png';
      
      // Try direct fetch first
      try {
        const response = await fetch(watermarkUrl);
        if (response.ok) {
          const imageBytes = await response.arrayBuffer();
          return await pdfDoc.embedPng(imageBytes);
        }
      } catch (e) {
        console.log('Direct fetch failed, trying alternative...');
      }
      
      // Fallback: Create a simple text-based watermark using canvas
      console.log('Using fallback watermark generation...');
      return await this.createFallbackWatermark(pdfDoc);
      
    } catch (error) {
      console.error('Error loading watermark, using fallback:', error);
      return await this.createFallbackWatermark(pdfDoc);
    }
  }
  
  private async createFallbackWatermark(pdfDoc: PDFDocument) {
    // Create a simple watermark image using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;
    
    // Draw watermark text
    ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(Math.PI / 4);
    ctx.fillText('WATERMARK', 0, 0);
    ctx.restore();
    
    // Convert to PNG and embed
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.split(',')[1];
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    return await pdfDoc.embedPng(imageBytes);
  }
  
  private async createCoverPage(watermarkImage: any): Promise<PDFDocument> {
  const coverDoc = await PDFDocument.create();
  const coverPage = coverDoc.addPage([595.28, 841.89]); // A4 size in points
  const { width, height } = coverPage.getSize();

  // Cover background
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: rgb(0.204, 0.596, 0.859),
  });

  // Cover title
  coverPage.drawText('COVER PAGE TITLE', {
    x: width / 2 - 120,
    y: height / 2 + 100,
    size: 30,
    color: rgb(1, 1, 1),
  });

  // Cover subtitle
  coverPage.drawText('This is the subtitle of the cover page', {
    x: width / 2 - 140,
    y: height / 2 + 60,
    size: 16,
    color: rgb(1, 1, 1),
  });

  // --- ADD CENTERED WATERMARK ---
  const watermarkDims = {
    width: watermarkImage.width,
    height: watermarkImage.height
  };
  const watermarkX = (width - watermarkDims.width) / 2;
  const watermarkY = (height - watermarkDims.height) / 2;

  coverPage.drawImage(watermarkImage, {
    x: watermarkX,
    y: watermarkY,
    width: watermarkDims.width,
    height: watermarkDims.height,
    opacity: 0.2
  });

  return coverDoc;
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