/**
 * MinHash + LSH algoritmi
 * Katta hajmli matnlar uchun tezkor o'xshashlik aniqlash.
 */

class MinHashLSH {
  constructor(numHashes = 128, numBands = 16) {
    this.numHashes = numHashes;
    this.numBands = numBands;
    this.rowsPerBand = Math.floor(numHashes / numBands);
    this.hashFunctions = this.generateHashFunctions(numHashes);
    this.buckets = new Map();
  }

  generateHashFunctions(count) {
    const prime = 2147483647;
    const functions = [];
    for (let i = 0; i < count; i++) {
      const a = Math.floor(Math.random() * (prime - 1)) + 1;
      const b = Math.floor(Math.random() * prime);
      functions.push({ a, b, prime });
    }
    return functions;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  createShingles(text, k = 3) {
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const words = normalized.split(' ');
    const shingles = new Set();
    for (let i = 0; i <= words.length - k; i++) {
      shingles.add(words.slice(i, i + k).join(' '));
    }
    return shingles;
  }

  computeSignature(shingles) {
    const signature = new Array(this.numHashes).fill(Infinity);
    for (const shingle of shingles) {
      const shingleHash = this.hashString(shingle);
      for (let i = 0; i < this.numHashes; i++) {
        const { a, b, prime } = this.hashFunctions[i];
        const hashValue = ((a * shingleHash + b) % prime);
        signature[i] = Math.min(signature[i], hashValue);
      }
    }
    return signature;
  }

  estimateSimilarity(sig1, sig2) {
    let matches = 0;
    for (let i = 0; i < this.numHashes; i++) {
      if (sig1[i] === sig2[i]) matches++;
    }
    return matches / this.numHashes;
  }

  compare(text1, text2) {
    const shingles1 = this.createShingles(text1);
    const shingles2 = this.createShingles(text2);
    const sig1 = this.computeSignature(shingles1);
    const sig2 = this.computeSignature(shingles2);
    const similarity = this.estimateSimilarity(sig1, sig2);
    return { score: Math.round(similarity * 100 * 100) / 100 };
  }

  compareWithMultiple(text, documents) {
    const sourceShingles = this.createShingles(text);
    const sourceSignature = this.computeSignature(sourceShingles);
    const results = [];

    for (const doc of documents) {
      const docShingles = this.createShingles(doc.content);
      const docSignature = this.computeSignature(docShingles);
      const similarity = this.estimateSimilarity(sourceSignature, docSignature);

      if (similarity > 0.1) {
        results.push({
          documentId: doc.id,
          title: doc.title,
          score: Math.round(similarity * 100 * 100) / 100
        });
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }
}

module.exports = MinHashLSH;
