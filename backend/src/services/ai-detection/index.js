/**
 * AI Text Detection moduli (Kengaytirilgan)
 * Har bir jumlani alohida tahlil qilib, AI yozgan qismlarni aniqlaydi.
 */

class AIDetector {
  constructor() {
    this.transitionWords = [
      'furthermore', 'moreover', 'additionally', 'consequently',
      'nevertheless', 'however', 'therefore', 'subsequently',
      'significantly', 'importantly', 'notably', 'specifically',
      'in conclusion', 'in summary', 'in addition', 'as a result',
      'on the other hand', 'for instance', 'for example',
      'it is worth noting', 'it is important to', 'this suggests that',
      'shuningdek', 'bundan tashqari', 'natijada', 'shu sababli',
      'biroq', 'ammo', 'lekin', 'shunga qaramay', 'masalan',
      'xulosa qilib aytganda', 'shuni ta\'kidlash joizki',
      'yuqoridagilardan kelib chiqib', 'shu bilan birga',
      'кроме того', 'более того', 'следовательно', 'однако',
      'таким образом', 'в заключение', 'необходимо отметить'
    ];

    // AI ga xos iboralar
    this.aiPatterns = [
      /it is (important|worth|essential|crucial) to (note|mention|highlight|understand)/i,
      /this (suggests|indicates|demonstrates|highlights|underscores)/i,
      /in (today's|the modern|the contemporary|the current) (world|era|age|society)/i,
      /plays a (crucial|vital|significant|important|key) role/i,
      /(one|we) (can|could|should|must) (argue|say|conclude|note)/i,
      /it (should|must|can) be (noted|mentioned|emphasized|highlighted)/i,
      /(muhim|zarur|dolzarb) (ahamiyatga|o'ringa|masala)/i,
      /shuni (ta'kidlash|qayd etish|ko'rsatish) (joiz|lozim|kerak|zarur)/i,
      /(zamonaviy|bugungi|hozirgi) (dunyoda|jamiyatda|davrda)/i,
      /(muhim|katta|sezilarli) (ahamiyat|o'rin|rol) (kasb etadi|ega|tutadi)/i,
      /yuqoridagilardan kelib (chiqib|chiqqan holda)/i,
      /(xulosa|natija) (qilib|sifatida|o'laroq)/i
    ];
  }

  /**
   * To'liq tahlil - umumiy ball + har bir jumla alohida
   */
  detectFull(text) {
    if (!text || text.trim().length < 50) {
      return {
        aiScore: 0,
        verdict: 'insufficient_text',
        message: 'Matn juda qisqa. Kamida 50 belgi kerak.',
        sentences: [],
        highlights: [],
        stats: {}
      };
    }

    // Jumlalarga bo'lish
    const sentences = this.splitSentences(text);

    // Har bir jumlani alohida baholash
    const analyzedSentences = sentences.map((sentence, index) => {
      const score = this.analyzeSentence(sentence, index, sentences);
      return {
        text: sentence,
        index,
        aiScore: score,
        isAI: score >= 65,
        level: this.getLevel(score)
      };
    });

    // Umumiy ball
    const overallScore = this.calculateOverallFromSentences(analyzedSentences);

    // Xususiyatlar
    const features = {
      burstiness: this.analyzeBurstiness(text),
      vocabulary: this.analyzeVocabulary(text),
      sentenceStarters: this.analyzeSentenceStarters(sentences),
      transitions: this.analyzeTransitions(text, sentences),
      repetition: this.analyzeRepetition(text),
      patterns: this.analyzeAIPatterns(text, sentences),
      sentenceLength: this.analyzeSentenceLength(sentences),
      paragraphUniformity: this.analyzeParagraphUniformity(text)
    };

    const featureScore = this.calculateFeatureScore(features);
    const finalScore = Math.round((overallScore * 0.6 + featureScore * 0.4) * 100) / 100;

    let verdict = 'human';
    if (finalScore >= 75) verdict = 'ai_generated';
    else if (finalScore >= 55) verdict = 'likely_ai';
    else if (finalScore >= 35) verdict = 'mixed';
    else if (finalScore >= 15) verdict = 'likely_human';

    // Qizil rangda belgilanadigan qismlar
    const highlights = this.buildHighlights(text, analyzedSentences);

    // Statistika
    const aiSentences = analyzedSentences.filter(s => s.isAI).length;
    const stats = {
      totalSentences: sentences.length,
      aiSentences,
      humanSentences: sentences.length - aiSentences,
      aiPercentage: Math.round((aiSentences / Math.max(sentences.length, 1)) * 100),
      totalWords: text.split(/\s+/).length,
      totalChars: text.length
    };

    return {
      aiScore: finalScore,
      verdict,
      message: this.getVerdictMessage(verdict),
      sentences: analyzedSentences,
      highlights,
      features,
      stats
    };
  }

  /**
   * Oddiy detect (eski API uchun mos)
   */
  detect(text) {
    const result = this.detectFull(text);
    return {
      aiScore: result.aiScore,
      verdict: result.verdict,
      message: result.message,
      features: result.features
    };
  }

  /**
   * Matnni jumlalarga bo'lish (o'zbek, rus, ingliz)
   */
  splitSentences(text) {
    // Jumlalarni ajratish - nuqta, undov, so'roq belgilari
    const raw = text.split(/(?<=[.!?])\s+/);
    const sentences = [];

    for (const s of raw) {
      const trimmed = s.trim();
      if (trimmed.length > 10) {
        sentences.push(trimmed);
      }
    }

    // Agar juda kam jumla chiqsa, yangi qator bilan ham bo'lamiz
    if (sentences.length < 3) {
      const byNewline = text.split(/\n+/).filter(s => s.trim().length > 10);
      if (byNewline.length > sentences.length) return byNewline.map(s => s.trim());
    }

    return sentences;
  }

  /**
   * Bitta jumlani AI ehtimolligini aniqlash
   */
  analyzeSentence(sentence, index, allSentences) {
    let score = 0;
    let factors = 0;

    // 1. Jumla uzunligi (AI o'rtacha 15-25 so'z yozadi)
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 15 && wordCount <= 30) { score += 60; factors++; }
    else if (wordCount >= 10 && wordCount <= 35) { score += 40; factors++; }
    else { score += 15; factors++; }

    // 2. Transition so'zlar bilan boshlash
    const lowerSentence = sentence.toLowerCase();
    const startsWithTransition = this.transitionWords.some(tw =>
      lowerSentence.startsWith(tw) || lowerSentence.startsWith(tw + ',') || lowerSentence.startsWith(tw + ' ')
    );
    if (startsWithTransition) { score += 80; factors++; }
    else { score += 20; factors++; }

    // 3. AI patternlarini tekshirish
    const hasPattern = this.aiPatterns.some(p => p.test(sentence));
    if (hasPattern) { score += 85; factors++; }
    else { score += 25; factors++; }

    // 4. Vergullar soni (AI ko'p vergul ishlatadi)
    const commas = (sentence.match(/,/g) || []).length;
    const commaRatio = commas / Math.max(wordCount, 1);
    if (commaRatio > 0.15) { score += 70; factors++; }
    else if (commaRatio > 0.08) { score += 45; factors++; }
    else { score += 20; factors++; }

    // 5. Murakkab so'z tuzilmalari
    const complexWords = sentence.split(/\s+/).filter(w => w.length > 10).length;
    const complexRatio = complexWords / Math.max(wordCount, 1);
    if (complexRatio > 0.25) { score += 65; factors++; }
    else if (complexRatio > 0.15) { score += 45; factors++; }
    else { score += 20; factors++; }

    // 6. Oldingi jumla bilan uzunlik o'xshashligi
    if (index > 0) {
      const prevLen = allSentences[index - 1].split(/\s+/).length;
      const diff = Math.abs(wordCount - prevLen);
      if (diff <= 3) { score += 70; factors++; } // Juda o'xshash uzunlik = AI
      else if (diff <= 7) { score += 40; factors++; }
      else { score += 15; factors++; }
    }

    // 7. Passiv/formal konstruksiyalar
    const formalPatterns = /\b(is|are|was|were|been|being)\s+(considered|regarded|seen|viewed|known|used|utilized|employed|implemented)\b/i;
    const formalPatternsUz = /(hisoblanadi|sanaladi|qaraladi|ko'rib chiqiladi|amalga oshiriladi|ta'minlanadi|joriy etiladi)/i;
    if (formalPatterns.test(sentence) || formalPatternsUz.test(sentence)) {
      score += 75; factors++;
    } else {
      score += 25; factors++;
    }

    // 8. Raqamlar va aniq faktlar (AI kamroq ishlatadi)
    const hasNumbers = /\d{2,}/.test(sentence);
    const hasQuote = /["«»"]/.test(sentence);
    if (hasNumbers || hasQuote) { score += 15; factors++; }
    else { score += 50; factors++; }

    return Math.round(score / factors);
  }

  /**
   * Jumla darajasi
   */
  getLevel(score) {
    if (score >= 75) return 'high';    // Qizil - AI
    if (score >= 55) return 'medium';  // Sariq - ehtimol AI
    if (score >= 35) return 'low';     // Och sariq - noaniq
    return 'none';                      // Oq - inson
  }

  /**
   * Jumlalar asosida umumiy ball
   */
  calculateOverallFromSentences(analyzedSentences) {
    if (analyzedSentences.length === 0) return 0;
    const total = analyzedSentences.reduce((sum, s) => sum + s.aiScore, 0);
    return total / analyzedSentences.length;
  }

  /**
   * Highlighting ma'lumotlarini yaratish
   */
  buildHighlights(originalText, analyzedSentences) {
    const highlights = [];
    let position = 0;

    for (const s of analyzedSentences) {
      const start = originalText.indexOf(s.text, position);
      if (start !== -1) {
        highlights.push({
          start,
          end: start + s.text.length,
          text: s.text,
          score: s.aiScore,
          level: s.level,
          isAI: s.isAI
        });
        position = start + s.text.length;
      }
    }

    return highlights;
  }

  // === Xususiyatlar tahlili ===

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

  analyzeSentenceStarters(sentences) {
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

  analyzeTransitions(text, sentences) {
    const lowerText = text.toLowerCase();
    let count = 0;
    for (const word of this.transitionWords) {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = lowerText.match(regex);
      if (matches) count += matches.length;
    }
    const ratio = count / Math.max(sentences.length, 1);
    let score;
    if (ratio > 0.5) score = 85;
    else if (ratio > 0.3) score = 65;
    else if (ratio > 0.2) score = 45;
    else score = 20;
    return { score, count, ratio: Math.round(ratio * 100) / 100 };
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

  analyzeAIPatterns(text, sentences) {
    let matchCount = 0;
    for (const sentence of sentences) {
      if (this.aiPatterns.some(p => p.test(sentence))) matchCount++;
    }
    const ratio = matchCount / Math.max(sentences.length, 1);
    let score;
    if (ratio > 0.3) score = 90;
    else if (ratio > 0.15) score = 70;
    else if (ratio > 0.05) score = 45;
    else score = 15;
    return { score, matchCount, ratio: Math.round(ratio * 100) / 100 };
  }

  analyzeSentenceLength(sentences) {
    const lengths = sentences.map(s => s.split(/\s+/).length);
    if (lengths.length < 3) return { score: 50 };
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    // AI: ko'pchilik jumlalar 15-25 so'z oralig'ida
    const inRange = lengths.filter(l => l >= 12 && l <= 28).length;
    const ratio = inRange / lengths.length;
    let score;
    if (ratio > 0.7) score = 80;
    else if (ratio > 0.5) score = 55;
    else if (ratio > 0.3) score = 35;
    else score = 15;
    return { score, avgLength: Math.round(mean), uniformRatio: Math.round(ratio * 100) / 100 };
  }

  analyzeParagraphUniformity(text) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    if (paragraphs.length < 2) return { score: 50 };
    const lengths = paragraphs.map(p => p.trim().length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const cv = Math.sqrt(variance) / Math.max(mean, 1);
    let score;
    if (cv < 0.2) score = 80;
    else if (cv < 0.4) score = 50;
    else score = 20;
    return { score, paragraphCount: paragraphs.length, cv: Math.round(cv * 100) / 100 };
  }

  calculateFeatureScore(features) {
    const weights = {
      burstiness: 0.20,
      vocabulary: 0.12,
      sentenceStarters: 0.12,
      transitions: 0.15,
      repetition: 0.08,
      patterns: 0.18,
      sentenceLength: 0.10,
      paragraphUniformity: 0.05
    };
    let total = 0;
    for (const [key, weight] of Object.entries(weights)) {
      total += (features[key]?.score || 50) * weight;
    }
    return total;
  }

  getVerdictMessage(verdict) {
    const msgs = {
      'ai_generated': 'Bu matn yuqori ehtimollik bilan AI tomonidan yozilgan.',
      'likely_ai': 'Bu matn AI tomonidan yozilgan bo\'lishi ehtimoli yuqori.',
      'mixed': 'Bu matnda AI va inson yozgan qismlar aralash.',
      'likely_human': 'Bu matn inson tomonidan yozilgan bo\'lishi ehtimoli yuqori.',
      'human': 'Bu matn inson tomonidan yozilgan.',
      'insufficient_text': 'Matn juda qisqa, tahlil qilish imkoni yo\'q.'
    };
    return msgs[verdict] || 'Aniqlab bo\'lmadi.';
  }
}

module.exports = AIDetector;
