/**
 * Fingerprinting (Rabin-Karp) algoritmi
 * Rolling hash orqali matnning aniq nusxalarini topish.
 */

class FingerprintAlgorithm {
  constructor(windowSize = 50, base = 256, modulus = 1000000007) {
    this.windowSize = windowSize;
    this.base = base;
    this.modulus = modulus;
  }

  normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim();
  }

  computeHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * this.base + str.charCodeAt(i)) % this.modulus;
    }
    return hash;
  }

  computeFingerprints(text) {
    const normalized = this.normalizeText(text);
    const fingerprints = [];

    if (normalized.length < this.windowSize) {
      fingerprints.push({ hash: this.computeHash(normalized), position: 0, text: normalized });
      return fingerprints;
    }

    let hash = this.computeHash(normalized.substring(0, this.windowSize));
    fingerprints.push({ hash, position: 0, text: normalized.substring(0, this.windowSize) });

    let highPow = 1;
    for (let i = 0; i < this.windowSize - 1; i++) {
      highPow = (highPow * this.base) % this.modulus;
    }

    for (let i = 1; i <= normalized.length - this.windowSize; i++) {
      hash = (hash - normalized.charCodeAt(i - 1) * highPow % this.modulus + this.modulus) % this.modulus;
      hash = (hash * this.base + normalized.charCodeAt(i + this.windowSize - 1)) % this.modulus;
      if (i % 10 === 0) {
        fingerprints.push({ hash, position: i, text: normalized.substring(i, i + this.windowSize) });
      }
    }
    return fingerprints;
  }

  compare(text1, text2) {
    const fps1 = this.computeFingerprints(text1);
    const fps2 = this.computeFingerprints(text2);
    const hashSet2 = new Map();
    for (const fp of fps2) hashSet2.set(fp.hash, fp);

    let matchCount = 0;
    const matches = [];
    for (const fp1 of fps1) {
      if (hashSet2.has(fp1.hash)) {
        matchCount++;
        matches.push({ position1: fp1.position, text: fp1.text, hash: fp1.hash });
      }
    }

    const similarity = matchCount / Math.max(fps1.length, 1);
    return { score: Math.round(similarity * 100 * 100) / 100, matches, matchCount };
  }

  compareWithMultiple(text, documents) {
    const sourceFps = this.computeFingerprints(text);
    const sourceHashes = new Set(sourceFps.map(fp => fp.hash));
    const results = [];

    for (const doc of documents) {
      const docFps = this.computeFingerprints(doc.content);
      let matchCount = 0;
      for (const fp of docFps) {
        if (sourceHashes.has(fp.hash)) matchCount++;
      }
      const similarity = matchCount / Math.max(sourceFps.length, 1);
      if (similarity > 0.05) {
        results.push({ documentId: doc.id, title: doc.title, score: Math.round(similarity * 100 * 100) / 100, matchCount });
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }

  findMatchPositions(text1, text2) {
    const fps1 = this.computeFingerprints(text1);
    const fps2 = this.computeFingerprints(text2);
    const hashSet2 = new Set(fps2.map(fp => fp.hash));
    const positions = [];

    for (const fp of fps1) {
      if (hashSet2.has(fp.hash)) {
        positions.push({ start: fp.position, end: fp.position + this.windowSize, text: fp.text });
      }
    }

    if (positions.length === 0) return [];
    positions.sort((a, b) => a.start - b.start);
    const merged = [positions[0]];
    for (let i = 1; i < positions.length; i++) {
      const last = merged[merged.length - 1];
      if (positions[i].start <= last.end) {
        last.end = Math.max(last.end, positions[i].end);
      } else {
        merged.push(positions[i]);
      }
    }
    return merged;
  }
}

module.exports = FingerprintAlgorithm;
