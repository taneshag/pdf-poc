import { Component, signal } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: false
})
export class App {
  title = signal('PDF POC');

  // 100 dummy PDFs (for demonstration, all same URL)
  pdfList: string[] = Array.from({ length: 100 }, (_, i) =>
    `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`
  );

  async generatePDF() {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ---- COVER PAGE ----
    const coverElement = document.getElementById('cover-page')!;
    const coverCanvas = await html2canvas(coverElement);
    const coverImg = coverCanvas.toDataURL('image/png');
    doc.addImage(coverImg, 'PNG', 0, 0, pageWidth, pageHeight);
    doc.addPage();

    // ---- LOOP THROUGH PDF LIST ----
    for (let i = 0; i < this.pdfList.length; i++) {
      const pdfUrl = this.pdfList[i];

      // HEADER
      doc.setFontSize(14);
      doc.text('Header - Angular PDF POC', 40, 40);

      // CONTENT (Here we just write URL as text; can be replaced with real PDF content)
      doc.setFontSize(12);
      doc.text(`PDF #${i + 1}: ${pdfUrl}`, 40, 100);

      // FOOTER
      doc.setFontSize(10);
      doc.text(`Page ${i + 2}`, 40, pageHeight - 30);

      if (i !== this.pdfList.length - 1) doc.addPage();
    }

    doc.save('all-pdfs.pdf');
  }
}
