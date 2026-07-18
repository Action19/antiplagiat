const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class FileParser {
  async parseFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.pdf': return await this.parsePDF(filePath);
      case '.docx': case '.doc': return await this.parseDOCX(filePath);
      case '.txt': return await this.parseTXT(filePath);
      default: throw new Error(`Qo'llab-quvvatlanmaydigan fayl: ${ext}`);
    }
  }

  async parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return { text: this.cleanText(data.text), pageCount: data.numpages };
  }

  async parseDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return { text: this.cleanText(result.value) };
  }

  async parseTXT(filePath) {
    const text = fs.readFileSync(filePath, 'utf-8');
    return { text: this.cleanText(text) };
  }

  cleanText(text) {
    return text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/ +/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }

  countWords(text) {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }
}

module.exports = FileParser;
