/**
 * TF-IDF + Cosine Similarity algoritmi
 * Matnlarning semantik o'xshashligini aniqlash.
 */

class TfIdfAlgorithm {
  constructor() {
    this.idfValues = new Map();
    this.documentFrequency = new Map();
  }

  tokenize(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
      .split(' ').filter(word => word.length > 2);
  }

  getStopWords() {
    return new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'not', 'no', 'can', 'had', 'have',
      'was', 'were', 'are', 'this', 'that', 'will', 'would', 'could',
      'va', 'ham', 'esa', 'bilan', 'uchun', 'dan', 'ning', 'ga', 'da',
      'bu', 'shu', 'bir', 'har', 'agar', 'lekin', 'ammo', 'chunki',
      'и', 'в', 'не', 'на', 'что', 'он', 'она', 'это', 'как', 'но'
    ]);
  }

  filterTokens(tokens) {
    const stopWords = this.getStopWords();
    return tokens.filter(token => !stopWords.has(token));
  }

  computeTF(tokens) {
    const tf = new Map();
    const total = tokens.length;
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }
    for (const [token, count] of tf) {
      tf.set(token, count / total);
    }
    return tf;
  }

  computeIDF(documents) {
    const N = documents.length;
    this.documentFrequency.clear();
    this.idfValues.clear();

    for (const doc of documents) {
      const tokens = this.filterTokens(this.tokenize(doc));
      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        this.documentFrequency.set(token, (this.documentFrequency.get(token) || 0) + 1);
      }
    }

    for (const [token, df] of this.documentFrequency) {
      this.idfValues.set(token, Math.log((N + 1) / (df + 1)) + 1);
    }
  }

  computeTfIdf(text) {
    const tokens = this.filterTokens(this.tokenize(text));
    const tf = this.computeTF(tokens);
    const tfidfVector = new Map();
    for (const [token, tfValue] of tf) {
      const idf = this.idfValues.get(token) || Math.log(2);
      tfidfVector.set(token, tfValue * idf);
    }
    return tfidfVector;
  }

  cosineSimilarity(vector1, vector2) {
    let dotProduct = 0, magnitude1 = 0, magnitude2 = 0;
    const allKeys = new Set([...vector1.keys(), ...vector2.keys()]);

    for (const key of allKeys) {
      const v1 = vector1.get(key) || 0;
      const v2 = vector2.get(key) || 0;
      dotProduct += v1 * v2;
      magnitude1 += v1 * v1;
      magnitude2 += v2 * v2;
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  compare(text1, text2) {
    this.computeIDF([text1, text2]);
    const vector1 = this.computeTfIdf(text1);
    const vector2 = this.computeTfIdf(text2);
    const similarity = this.cosineSimilarity(vector1, vector2);
    return { score: Math.round(similarity * 100 * 100) / 100 };
  }

  compareWithMultiple(text, documents) {
    const allTexts = [text, ...documents.map(d => d.content)];
    this.computeIDF(allTexts);
    const sourceVector = this.computeTfIdf(text);
    const results = [];

    for (const doc of documents) {
      const docVector = this.computeTfIdf(doc.content);
      const similarity = this.cosineSimilarity(sourceVector, docVector);
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

module.exports = TfIdfAlgorithm;
