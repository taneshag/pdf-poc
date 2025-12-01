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

  async generatePDF() {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- COVER PAGE ---
    const coverElement = document.getElementById('cover-page')!;
    const coverCanvas = await html2canvas(coverElement);
    const coverImg = coverCanvas.toDataURL('image/png');
    doc.addImage(coverImg, 'PNG', 0, 0, pageWidth, pageHeight);

    // --- HEADER (Colored) ---
    const headerHeight = 50;
    doc.setFillColor(52, 152, 219); // Blue color
    doc.rect(0, 0, pageWidth, headerHeight, 'F'); // Draw filled rectangle
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255); // White text
    doc.text('Header - Angular PDF POC', pageWidth / 2, 30, { align: 'center' });

    // --- MAIN CONTENT ---
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Black text
    doc.text('This is the main PDF content.', 40, 100);

    // --- FOOTER (Colored) ---
    const footerHeight = 40;
    doc.setFillColor(52, 152, 219); // Blue color
    doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F'); // Filled footer
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Footer - Angular PDF POC', pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Save single PDF
    doc.save('single-pdf-with-colored-header-footer.pdf');
  }
}
