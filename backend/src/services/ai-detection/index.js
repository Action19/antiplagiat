/**
 * AI Text Detection moduli
 * AI tomonidan yozilgan matnni aniqlash.
 */

class AIDetector {
  constructor() {
    this.transitionWords = new Set([
      'furthermore', 'moreover', 'additionally', 'consequently',
      'nevertheless', 'however', 'therefore', 'subsequently',
      'significantly', 'importantly', 'notably', 'specifically',
      'shuningdek', 'bundan tashqari', 'natijada', 'shu sababli',
      'biroq', 'ammo', 'lekin', 'shunga qaramay', 'masalan',
      'кроме того', 'более того', 'следовательно', 'однако'
    ]);
  }

  detect(text) {
    if (!text || text.trim().length < 100) {
      return { aiScore: 0, verdict: 'insufficient_text', message: 'Matn juda qisqa.', features: {} };
    }
    const features = {
      burstiness: this.analyzeBurstiness(text),
      vocabulary: this.analyzeVocabulary(text),
      sentenceStarters: this.analyzeSentenceStarters(text),
      transitionUsage: this.analyzeTransitions(text),
      repetition: this.analyzeRepetition(text),
    };
    const aiScore = this.calculateAIScore(features);
    let verdict = 'human';
    if (aiScore >= 80) verdict = 'ai_generated';
    else if (aiScore >= 60) verdict = 'likely_ai';
    else if (aiScore >= 40) verdict = 'mixed';
    else if (aiScore >= 20) verdict = 'likely_human';

    return { aiScore: Math.round(aiScore * 100) / 100, verdict, message: this.getVerdictMessage(verdict), features };
  }

  analyzeBurstiness(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (sentences.length < 3) return { score: 50 };
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    let score;
    if (cv < 0.2) score = 90;
    else if (cv < 0.3) score = 70;
    else if (cv < 0.5) score = 40;
    else score = 15;
    return { score, cv: Math.round(cv * 100) / 100 };
  }

  analyzeVocabulary(text) {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const uniqueWords = new Set(words);
    const ttr = uniqueWords.size / Math.max(words.length, 1);
    let score;
    if (ttr < 0.4) score = 70;
    else if (ttr < 0.5) score = 50;
    else if (ttr < 0.6) score = 30;
    else score = 15;
    return { score, ttr: Math.round(ttr * 100) / 100 };
  }

  analyzeSentenceStarters(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const starters = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase());
    const starterCount = {};
    for (const s of starters) { if (s) starterCount[s] = (starterCount[s] || 0) + 1; }
    const maxRepeat = Math.max(...Object.values(starterCount), 0);
    const repeatRatio = maxRepeat / Math.max(sentences.length, 1);
    let score;
    if (repeatRatio > 0.4) score = 80;
    else if (repeatRatio > 0.3) score = 60;
    else if (repeatRatio > 0.2) score = 40;
    else score = 20;
    return { score, repeatRatio: Math.round(repeatRatio * 100) / 100 };
  }

  analyzeTransitions(text) {
    const lowerText = text.toLowerCase();
    let count = 0;
    for (const word of this.transitionWords) {
      const regex = new RegExp(word, 'gi');
      const matches = lowerText.match(regex);
      if (matches) count += matches.length;
    }
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const ratio = count / Math.max(sentences.length, 1);
    let score;
    if (ratio > 0.5) score = 85;
    else if (ratio > 0.3) score = 65;
    else if (ratio > 0.2) score = 40;
    else score = 20;
    return { score, ratio: Math.round(ratio * 100) / 100 };
  }

  analyzeRepetition(text) {
    const words = text.toLowerCase().split(/\s+/);
    const phraseCount = {};
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 3).join(' ');
      phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
    }
    const repeated = Object.values(phraseCount).filter(c => c > 2).length;
    const rate = repeated / Math.max(Object.keys(phraseCount).length, 1);
    let score;
    if (rate > 0.1) score = 75;
    else if (rate > 0.05) score = 50;
    else score = 25;
    return { score, repetitionRate: Math.round(rate * 100) / 100 };
  }

  calculateAIScore(features) {
    const weights = { burstiness: 0.30, vocabulary: 0.20, sentenceStarters: 0.20, transitionUsage: 0.20, repetition: 0.10 };
    let total = 0;
    for (const [key, weight] of Object.entries(weights)) {
      total += (features[key]?.score || 50) * weight;
    }
    return total;
  }

  getVerdictMessage(verdict) {
    const msgs = {
      'ai_generated': 'Bu matn AI tomonidan yozilgan.',
      'likely_ai': 'Ehtimol AI tomonidan yozilgan.',
      'mixed': 'AI va inson aralash yozgan bo\'lishi mumkin.',
      'likely_human': 'Ehtimol inson yozgan.',
      'human': 'Inson tomonidan yozilgan.',
      'insufficient_text': 'Matn juda qisqa.'
    };
    return msgs[verdict] || 'Aniqlab bo\'lmadi.';
  }
}

module.exports = AIDetector;
