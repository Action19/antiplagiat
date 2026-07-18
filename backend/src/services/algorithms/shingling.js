/**
 * Shingling algoritmi
 * Matnni n-gramlarga bo'lib, Jaccard koeffitsienti orqali solishtiradi.
 */

class ShinglingAlgorithm {
  constructor(shingleSize = 5) {
    this.shingleSize = shingleSize;
  }

  normalizeText(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  createShingles(text) {
    const normalized = this.normalizeText(text);
    const words = normalized.split(' ');
    const shingles = new Set();

    if (words.length < this.shingleSize) {
      shingles.add(words.join(' '));
      return shingles;
    }

    for (let i = 0; i <= words.length - this.shingleSize; i++) {
      const shingle = words.slice(i, i + this.shingleSize).join(' ');
      shingles.add(shingle);
    }
    return shingles;
  }

  jaccardSimilarity(setA, setB) {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  compare(text1, text2) {
    const shingles1 = this.createShingles(text1);
    const shingles2 = this.createShingles(text2);
    const similarity = this.jaccardSimilarity(shingles1, shingles2);
    const matchedShingles = [...shingles1].filter(s => shingles2.has(s));

    return {
      score: Math.round(similarity * 100 * 100) / 100,
      matchedShingles,
      totalShingles1: shingles1.size,
      totalShingles2: shingles2.size,
      matchCount: matchedShingles.length
    };
  }

  compareWithMultiple(text, documents) {
    const sourceShingles = this.createShingles(text);
    const results = [];

    for (const doc of documents) {
      const docShingles = this.createShingles(doc.content);
      const similarity = this.jaccardSimilarity(sourceShingles, docShingles);
      const matchedShingles = [...sourceShingles].filter(s => docShingles.has(s));

      if (similarity > 0.05) {
        results.push({
          documentId: doc.id,
          title: doc.title,
          score: Math.round(similarity * 100 * 100) / 100,
          matchedShingles,
          matchCount: matchedShingles.length
        });
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }

  findMatchedPositions(text1, text2) {
    const normalized1 = this.normalizeText(text1);
    const words1 = normalized1.split(' ');
    const words2Set = new Set();
    const normalized2 = this.normalizeText(text2);
    const words2 = normalized2.split(' ');

    for (let i = 0; i <= words2.length - this.shingleSize; i++) {
      words2Set.add(words2.slice(i, i + this.shingleSize).join(' '));
    }

    const matches = [];
    let i = 0;
    while (i <= words1.length - this.shingleSize) {
      const shingle = words1.slice(i, i + this.shingleSize).join(' ');
      if (words2Set.has(shingle)) {
        let end = i + this.shingleSize;
        while (end < words1.length) {
          const nextShingle = words1.slice(end - this.shingleSize + 1, end + 1).join(' ');
          if (words2Set.has(nextShingle)) end++;
          else break;
        }
        matches.push({ startWord: i, endWord: end, text: words1.slice(i, end).join(' ') });
        i = end;
      } else {
        i++;
      }
    }
    return matches;
  }
}

module.exports = ShinglingAlgorithm;
