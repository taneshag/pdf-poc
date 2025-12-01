import { Component, signal } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { CoverPage } from './cover-page/cover-page';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [Header, Footer, CoverPage]
})
export class App {
  title = signal('PDF POC');

  // Single PDF content
  pdfContent: string = 'This is the main PDF content.';

  async generatePDF() {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- COVER PAGE (NO HEADER/FOOTER) ---
    const coverElement = document.getElementById('cover-page')!;
    const coverCanvas = await html2canvas(coverElement);
    const coverImg = coverCanvas.toDataURL('image/png');
    doc.addImage(coverImg, 'PNG', 0, 0, pageWidth, pageHeight);

    // Add watermark on cover page
    this.addWatermark(doc, 'SAMPLE WATERMARK');

    // --- SINGLE PDF PAGE WITH HEADER/FOOTER ---
    doc.addPage();

    // HEADER
    const headerHeight = 50;
    doc.setFillColor(52, 152, 219); // Blue header
    doc.rect(0, 0, pageWidth, headerHeight, 'F'); // filled rectangle
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255); // white text
    doc.text('Header - Angular PDF POC', pageWidth / 2, 30, { align: 'center' });

    // MAIN CONTENT
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // black text
    doc.text(this.pdfContent, 40, 100);

    // FOOTER
    const footerHeight = 40;
    doc.setFillColor(52, 152, 219); // Blue footer
    doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Footer - Angular PDF POC', pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Add watermark on PDF page
    this.addWatermark(doc, 'SAMPLE WATERMARK');

    // Save PDF
    doc.save('pdf-with-cover-header-footer-watermark.pdf');
  }

  // Utility function to add watermark
  private addWatermark(doc: jsPDF, text: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(60);
    doc.setTextColor(150, 150, 150); // Gray color
    doc.setGState(new (doc as any).GState({ opacity: 0.2 })); // 20% opacity
    doc.text(text, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.setGState(new (doc as any).GState({ opacity: 1 })); // Reset opacity
  }
}
