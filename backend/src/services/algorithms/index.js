/**
 * Barcha algoritmlarni birlashtiruvchi asosiy plagiat tekshirish servisi
 */

const ShinglingAlgorithm = require('./shingling');
const MinHashLSH = require('./minhash');
const TfIdfAlgorithm = require('./tfidf');
const FingerprintAlgorithm = require('./fingerprint');

class PlagiarismChecker {
  constructor() {
    this.shingling = new ShinglingAlgorithm(5);
    this.minhash = new MinHashLSH(128, 16);
    this.tfidf = new TfIdfAlgorithm();
    this.fingerprint = new FingerprintAlgorithm(50);
  }

  async fullCheck(text, documents) {
    const results = {
      shingling: { score: 0, matches: [] },
      minhash: { score: 0, matches: [] },
      tfidf: { score: 0, matches: [] },
      fingerprint: { score: 0, matches: [] },
      overall: { score: 0, originality: 100 },
      highlightedMatches: []
    };

    if (!documents || documents.length === 0) return results;

    const shinglingResults = this.shingling.compareWithMultiple(text, documents);
    results.shingling.score = shinglingResults.length > 0 ? Math.max(...shinglingResults.map(r => r.score)) : 0;
    results.shingling.matches = shinglingResults.slice(0, 10);

    const minhashResults = this.minhash.compareWithMultiple(text, documents);
    results.minhash.score = minhashResults.length > 0 ? Math.max(...minhashResults.map(r => r.score)) : 0;
    results.minhash.matches = minhashResults.slice(0, 10);

    const tfidfResults = this.tfidf.compareWithMultiple(text, documents);
    results.tfidf.score = tfidfResults.length > 0 ? Math.max(...tfidfResults.map(r => r.score)) : 0;
    results.tfidf.matches = tfidfResults.slice(0, 10);

    const fpResults = this.fingerprint.compareWithMultiple(text, documents);
    results.fingerprint.score = fpResults.length > 0 ? Math.max(...fpResults.map(r => r.score)) : 0;
    results.fingerprint.matches = fpResults.slice(0, 10);

    results.overall.score = this.calculateOverallScore(results);
    results.overall.originality = Math.max(0, 100 - results.overall.score);

    results.highlightedMatches = this.getHighlightedMatches(text, documents);
    return results;
  }

  calculateOverallScore(results) {
    const weights = { shingling: 0.30, fingerprint: 0.30, tfidf: 0.25, minhash: 0.15 };
    const weightedScore =
      results.shingling.score * weights.shingling +
      results.fingerprint.score * weights.fingerprint +
      results.tfidf.score * weights.tfidf +
      results.minhash.score * weights.minhash;
    return Math.round(weightedScore * 100) / 100;
  }

  getHighlightedMatches(text, documents) {
    const allMatches = [];
    for (const doc of documents) {
      const positions = this.shingling.findMatchedPositions(text, doc.content);
      for (const pos of positions) {
        allMatches.push({ sourceDocId: doc.id, sourceTitle: doc.title, matchedText: pos.text, startWord: pos.startWord, endWord: pos.endWord, algorithm: 'shingling' });
      }
      const fpPositions = this.fingerprint.findMatchPositions(text, doc.content);
      for (const pos of fpPositions) {
        allMatches.push({ sourceDocId: doc.id, sourceTitle: doc.title, matchedText: pos.text, startChar: pos.start, endChar: pos.end, algorithm: 'fingerprint' });
      }
    }
    return allMatches;
  }
}

module.exports = PlagiarismChecker;
