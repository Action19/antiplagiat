/**
 * AI Text Detection moduli (Kengaytirilgan - O'zbek/Rus/Ingliz)
 * Har bir jumlani alohida tahlil qilib, AI yozgan qismlarni aniqlaydi.
 */

class AIDetector {
  constructor() {
    this.transitionWords = [
      // Inglizcha
      'furthermore', 'moreover', 'additionally', 'consequently',
      'nevertheless', 'however', 'therefore', 'subsequently',
      'significantly', 'importantly', 'notably', 'specifically',
      'in conclusion', 'in summary', 'in addition', 'as a result',
      'on the other hand', 'for instance', 'for example',
      'it is worth noting', 'it is important to',
      // O'zbekcha (kengaytirilgan)
      'shuningdek', 'bundan tashqari', 'natijada', 'shu sababli',
      'biroq', 'ammo', 'lekin', 'shunga qaramay', 'masalan',
      'xulosa qilib', 'shuni ta\'kidlash', 'shu bilan birga',
      'yuqoridagilardan', 'keltirilgan', 'qayd etish',
      'ta\'kidlash joiz', 'e\'tibor qaratish', 'muhim ahamiyatga',
      'dolzarb masala', 'alohida ahamiyat', 'shu o\'rinda',
      'qolaversa', 'bunga qo\'shimcha', 'bunda', 'aynan shu',
      'shunday qilib', 'demak', 'binobarin', 'xususan',
      'jumladan', 'ayniqsa', 'shu jumladan',
      // Ruscha
      'кроме того', 'более того', 'следовательно', 'однако',
      'таким образом', 'в заключение', 'необходимо отметить',
      'важно подчеркнуть', 'в частности', 'например'
    ];

    // O'zbek tilidagi AI patternlari (kengaytirilgan)
    this.aiPatterns = [
      // O'zbekcha AI patterns
      /(muhim|zarur|dolzarb) (ahamiyatga|ahamiyat kasb|o'ringa) (ega|etadi|ega bo'lgan)/i,
      /shuni (ta'kidlash|qayd etish|ko'rsatish|alohida qayd) (joiz|lozim|kerak|zarur|mumkin)/i,
      /(zamonaviy|bugungi|hozirgi) (dunyoda|jamiyatda|davrda|ta'limda|sharoitda)/i,
      /(muhim|katta|sezilarli|alohida) (ahamiyat|o'rin|rol) (kasb etadi|tutadi|ega)/i,
      /yuqoridagilardan kelib (chiqib|chiqqan holda)/i,
      /(xulosa|natija) (qilib|sifatida|o'laroq) (aytish|ta'kidlash|qayd etish)/i,
      /bu (o'rinda|borada|masalada|yo'nalishda) (alohida|muhim|katta)/i,
      /(takomillashtirish|rivojlantirish|joriy etish|amalga oshirish) (zarur|lozim|kerak|maqsadga muvofiq)/i,
      /ilmiy (tadqiqotlar|izlanishlar|manba|adabiyotlar) (ko'rsatadi|shuni|tahlili)/i,
      /(pedagogik|ilmiy|nazariy|amaliy) (jihatdan|nuqtai nazardan|asosda)/i,
      /bo'yicha (tadqiqotlar|izlanishlar|tajribalar) (olib borilgan|mavjud|ko'rsatadi)/i,
      /(shu bois|shu sababli|aynan shu|ana shu) (narsa|holat|masala|jihat)/i,
      /imkonini (beradi|yaratadi|ta'minlaydi|ochadi)/i,
      /xizmat (qiladi|qilishi mumkin|qilishga)/i,
      /(ta'minlash|oshirish|shakllantirish|rivojlantirish)ni? (maqsad|vazifa|talab)/i,
      /(asoslab|isbotlab|ko'rsatib|tahlil qilib) (bergan|o'tgan|kelgan)/i,
      // Inglizcha AI patterns
      /it is (important|worth|essential|crucial) to (note|mention|highlight)/i,
      /this (suggests|indicates|demonstrates|highlights|underscores)/i,
      /plays a (crucial|vital|significant|important|key) role/i,
      /(one|we) (can|could|should|must) (argue|say|conclude|note)/i,
      // Ruscha AI patterns
      /(необходимо|важно|следует) (отметить|подчеркнуть|учитывать)/i,
      /данн(ый|ая|ое) (исследование|работа|подход) (направлен|посвящен)/i
    ];
  }

  /**
   * To'liq tahlil - har bir jumla alohida
   */
  detectFull(text) {
    if (!text || text.trim().length < 50) {
      return {
        aiScore: 0, verdict: 'insufficient_text',
        message: 'Matn juda qisqa.', sentences: [],
        highlights: [], stats: {}
      };
    }

    const sentences = this.splitSentences(text);
    const analyzedSentences = sentences.map((sentence, index) => {
      const score = this.analyzeSentence(sentence, index, sentences);
      return {
        text: sentence, index, aiScore: score,
        isAI: score >= 50, // 50% dan yuqori = AI
        level: this.getLevel(score)
      };
    });

    const overallScore = this.calculateOverallFromSentences(analyzedSentences);
    const features = this.analyzeFeatures(text, sentences);
    const featureScore = this.calculateFeatureScore(features);
    const finalScore = Math.round((overallScore * 0.55 + featureScore * 0.45) * 100) / 100;

    let verdict = 'human';
    if (finalScore >= 70) verdict = 'ai_generated';
    else if (finalScore >= 50) verdict = 'likely_ai';
    else if (finalScore >= 30) verdict = 'mixed';
    else if (finalScore >= 15) verdict = 'likely_human';

    const highlights = this.buildHighlights(text, analyzedSentences);
    const aiSentences = analyzedSentences.filter(s => s.isAI).length;

    return {
      aiScore: finalScore, verdict,
      message: this.getVerdictMessage(verdict),
      sentences: analyzedSentences,
      highlights,
      features,
      stats: {
        totalSentences: sentences.length,
        aiSentences,
        humanSentences: sentences.length - aiSentences,
        aiPercentage: Math.round((aiSentences / Math.max(sentences.length, 1)) * 100),
        totalWords: text.split(/\s+/).length,
        totalChars: text.length
      }
    };
  }

  detect(text) {
    const result = this.detectFull(text);
    return { aiScore: result.aiScore, verdict: result.verdict, message: result.message, features: result.features };
  }

  splitSentences(text) {
    // Avval paragraflar bo'yicha, keyin jumlalar bo'yicha
    const raw = text.split(/(?<=[.!?।])\s+|(?<=\n)\s*/);
    const sentences = [];
    for (const s of raw) {
      const trimmed = s.trim();
      if (trimmed.length > 15) sentences.push(trimmed);
    }
    return sentences.length > 0 ? sentences : [text.trim()];
  }

  /**
   * Bitta jumlani 10 ta mezon bilan tahlil qilish
   */
  analyzeSentence(sentence, index, allSentences) {
    let totalScore = 0;
    let totalWeight = 0;

    // 1. Jumla uzunligi (AI: 12-30 so'z)
    const wordCount = sentence.split(/\s+/).length;
    let lenScore;
    if (wordCount >= 14 && wordCount <= 28) lenScore = 70;
    else if (wordCount >= 10 && wordCount <= 35) lenScore = 50;
    else if (wordCount >= 5 && wordCount <= 8) lenScore = 20;
    else lenScore = 15;
    totalScore += lenScore * 0.10; totalWeight += 0.10;

    // 2. Transition so'zlar bilan boshlash yoki ichida bormi
    const lowerSentence = sentence.toLowerCase();
    const hasTransition = this.transitionWords.some(tw => lowerSentence.includes(tw));
    const startsWithTransition = this.transitionWords.some(tw =>
      lowerSentence.startsWith(tw) || lowerSentence.startsWith(tw + ',')
    );
    let transScore = startsWithTransition ? 85 : (hasTransition ? 60 : 15);
    totalScore += transScore * 0.20; totalWeight += 0.20;

    // 3. AI patternlari
    const patternMatch = this.aiPatterns.filter(p => p.test(sentence)).length;
    let patternScore;
    if (patternMatch >= 2) patternScore = 95;
    else if (patternMatch === 1) patternScore = 75;
    else patternScore = 20;
    totalScore += patternScore * 0.25; totalWeight += 0.25;

    // 4. Vergullar zichligi (AI ko'p vergul ishlatadi)
    const commas = (sentence.match(/,/g) || []).length;
    const commaRatio = commas / Math.max(wordCount, 1);
    let commaScore;
    if (commaRatio > 0.18) commaScore = 75;
    else if (commaRatio > 0.10) commaScore = 55;
    else commaScore = 20;
    totalScore += commaScore * 0.08; totalWeight += 0.08;

    // 5. Uzun so'zlar (AI ko'p murakkab so'z ishlatadi)
    const longWords = sentence.split(/\s+/).filter(w => w.length > 9).length;
    const longRatio = longWords / Math.max(wordCount, 1);
    let longScore;
    if (longRatio > 0.35) longScore = 75;
    else if (longRatio > 0.20) longScore = 55;
    else longScore = 20;
    totalScore += longScore * 0.08; totalWeight += 0.08;

    // 6. Oldingi jumla bilan uzunlik yaqinligi (AI tekis uzunlik)
    if (index > 0) {
      const prevLen = allSentences[index - 1].split(/\s+/).length;
      const diff = Math.abs(wordCount - prevLen);
      let simScore;
      if (diff <= 3) simScore = 75;
      else if (diff <= 6) simScore = 50;
      else simScore = 15;
      totalScore += simScore * 0.08; totalWeight += 0.08;
    }

    // 7. Formal/ilmiy konstruksiyalar (o'zbekcha)
    const formalUz = /(hisoblanadi|sanaladi|qaraladi|amalga oshiriladi|ta'minlanadi|joriy etiladi|ko'rib chiqiladi|tavsiya etiladi|ishlab chiqilgan|asoslab berilgan|ko'rsatib o'tilgan|belgilab berilgan|aniqlangan|tahlil qilingan|o'rganilgan|qayd etilgan)/i;
    const formalRu = /(является|считается|рассматривается|обеспечивает|реализуется)/i;
    const formalEn = /\b(is|are|was|were)\s+(considered|regarded|implemented|utilized|employed)\b/i;
    let formalScore;
    if (formalUz.test(sentence)) formalScore = 70;
    else if (formalRu.test(sentence) || formalEn.test(sentence)) formalScore = 65;
    else formalScore = 20;
    totalScore += formalScore * 0.12; totalWeight += 0.12;

    // 8. Struktura - tire, ikki nuqta, qavs
    const hasStructure = /[–—:]/.test(sentence) || /\(.+\)/.test(sentence);
    let structScore = hasStructure ? 55 : 25;
    totalScore += structScore * 0.05; totalWeight += 0.05;

    // 9. Takroriy og'zaki iboralar yo'qligi (AI kamdan-kam og'zaki gap ishlatadi)
    const informalPatterns = /\b(ya'ni|xullas|qisqasi|aytganday|aytgandek|o'zi|o'zim|bilasizmi|qiziq|voy|hayron|eee)\b/i;
    let informalScore = informalPatterns.test(sentence) ? 10 : 55;
    totalScore += informalScore * 0.04; totalWeight += 0.04;

    return Math.min(99, Math.round(totalScore / totalWeight));
  }

  getLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'low';
    return 'none';
  }

  calculateOverallFromSentences(analyzed) {
    if (analyzed.length === 0) return 0;
    return analyzed.reduce((sum, s) => sum + s.aiScore, 0) / analyzed.length;
  }

  buildHighlights(originalText, analyzedSentences) {
    const highlights = [];
    let position = 0;
    for (const s of analyzedSentences) {
      const start = originalText.indexOf(s.text, position);
      if (start !== -1) {
        highlights.push({
          start, end: start + s.text.length,
          text: s.text, score: s.aiScore,
          level: s.level, isAI: s.isAI
        });
        position = start + s.text.length;
      }
    }
    return highlights;
  }

  analyzeFeatures(text, sentences) {
    return {
      burstiness: this.analyzeBurstiness(sentences),
      vocabulary: this.analyzeVocabulary(text),
      transitions: this.analyzeTransitionDensity(text, sentences),
      patterns: this.analyzePatternDensity(sentences),
      sentenceLength: this.analyzeSentenceLengthUniformity(sentences),
      paragraphUniformity: this.analyzeParagraphUniformity(text)
    };
  }

  analyzeBurstiness(sentences) {
    if (sentences.length < 3) return { score: 50 };
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    let score;
    if (cv < 0.25) score = 85;
    else if (cv < 0.40) score = 60;
    else if (cv < 0.55) score = 35;
    else score = 15;
    return { score, cv: Math.round(cv * 100) / 100 };
  }

  analyzeVocabulary(text) {
    const words = text.toLowerCase().replace(/[^\w\s\u0400-\u04FF]/g, '').split(/\s+/).filter(w => w.length > 2);
    const uniqueWords = new Set(words);
    const ttr = uniqueWords.size / Math.max(words.length, 1);
    let score;
    if (ttr < 0.35) score = 75;
    else if (ttr < 0.45) score = 55;
    else if (ttr < 0.55) score = 35;
    else score = 15;
    return { score, ttr: Math.round(ttr * 100) / 100 };
  }

  analyzeTransitionDensity(text, sentences) {
    const lowerText = text.toLowerCase();
    let count = 0;
    for (const word of this.transitionWords) {
      if (lowerText.includes(word)) count++;
    }
    const ratio = count / Math.max(sentences.length, 1);
    let score;
    if (ratio > 0.4) score = 85;
    else if (ratio > 0.2) score = 60;
    else if (ratio > 0.1) score = 40;
    else score = 15;
    return { score, count, ratio: Math.round(ratio * 100) / 100 };
  }

  analyzePatternDensity(sentences) {
    let matchCount = 0;
    for (const s of sentences) {
      if (this.aiPatterns.some(p => p.test(s))) matchCount++;
    }
    const ratio = matchCount / Math.max(sentences.length, 1);
    let score;
    if (ratio > 0.25) score = 90;
    else if (ratio > 0.12) score = 70;
    else if (ratio > 0.05) score = 45;
    else score = 15;
    return { score, matchCount, ratio: Math.round(ratio * 100) / 100 };
  }

  analyzeSentenceLengthUniformity(sentences) {
    const lengths = sentences.map(s => s.split(/\s+/).length);
    if (lengths.length < 3) return { score: 50 };
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const inRange = lengths.filter(l => l >= 10 && l <= 30).length;
    const ratio = inRange / lengths.length;
    let score;
    if (ratio > 0.75) score = 80;
    else if (ratio > 0.55) score = 55;
    else if (ratio > 0.35) score = 30;
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
    if (cv < 0.25) score = 75;
    else if (cv < 0.45) score = 45;
    else score = 20;
    return { score, paragraphCount: paragraphs.length };
  }

  calculateFeatureScore(features) {
    const weights = { burstiness: 0.22, vocabulary: 0.15, transitions: 0.20, patterns: 0.23, sentenceLength: 0.12, paragraphUniformity: 0.08 };
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
      'insufficient_text': 'Matn juda qisqa.'
    };
    return msgs[verdict] || 'Aniqlab bo\'lmadi.';
  }
}

module.exports = AIDetector;
