const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../../reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async generateReport(checkResult, document, matches) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `report_${checkResult.id}.pdf`;
        const filePath = path.join(this.reportsDir, fileName);
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(20).font('Helvetica-Bold').text('ANTIPLAGIAT HISOBOTI', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Hujjat: ${document.title}`);
        doc.text(`So'zlar: ${document.word_count}`);
        doc.text(`Sana: ${new Date(checkResult.created_at).toLocaleString('uz-UZ')}`);
        doc.moveDown(1);

        doc.fontSize(14).font('Helvetica-Bold').text('NATIJALAR:');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`Originallik: ${checkResult.originality_score}%`);
        doc.text(`Plagiat: ${checkResult.overall_score}%`);
        doc.text(`AI ehtimolligi: ${checkResult.ai_score}%`);
        doc.moveDown(0.5);
        doc.text(`Shingling: ${checkResult.shingling_score}%`);
        doc.text(`MinHash+LSH: ${checkResult.minhash_score}%`);
        doc.text(`TF-IDF: ${checkResult.tfidf_score}%`);
        doc.text(`Fingerprint: ${checkResult.fingerprint_score}%`);
        doc.moveDown(1);

        if (matches && matches.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Topilgan manbalar:');
          doc.moveDown(0.3);
          doc.fontSize(9).font('Helvetica');
          for (let i = 0; i < Math.min(matches.length, 10); i++) {
            const m = matches[i];
            doc.text(`${i+1}. ${m.source_title || 'Ichki baza'} - ${m.similarity_score}%`);
          }
        }

        doc.end();
        stream.on('finish', () => resolve({ filePath, fileName }));
        stream.on('error', reject);
      } catch (error) { reject(error); }
    });
  }
}

module.exports = ReportGenerator;
