/**
 * AI Text Detection moduli (v3 - Kalibrovka qilingan)
 * O'zbek ilmiy matnini to'g'ri tahlil qiladi.
 */

class AIDetector {
  constructor() {
    this.transitionWords = [
      'furthermore', 'moreover', 'additionally', 'consequently',
      'nevertheless', 'however', 'therefore', 'subsequently',
      'significantly', 'importantly', 'notably', 'specifically',
      'in conclusion', 'in summary', 'in addition', 'as a result',
      'on the other hand', 'for instance', 'for example',
      'shuningdek', 'bundan tashqari', 'natijada', 'shu sababli',
      'biroq', 'ammo', 'lekin', 'shunga qaramay', 'masalan',
      'xulosa qilib', 'shuni ta\'kidlash', 'shu bilan birga',
      'yuqoridagilardan', 'qayd etish', 'ta\'kidlash joiz',
      'e\'tibor qaratish', 'muhim ahamiyatga', 'dolzarb masala',
      'alohida ahamiyat', 'shu o\'rinda', 'qolaversa',
      'bunga qo\'shimcha', 'shunday qilib', 'demak', 'binobarin',
      'xususan', 'jumladan', 'ayniqsa', 'shu jumladan',
      'кроме того', 'более того', 'следовательно', 'однако',
      'таким образом', 'в заключение', 'необходимо отметить'
    ];

    this.aiPatterns = [
      /(muhim|zarur|dolzarb).{0,20}(ahamiyatga|ahamiyat kasb|o'ringa).{0,15}(ega|etadi)/i,
      /shuni.{0,10}(ta'kidlash|qayd etish|ko'rsatish|alohida qayd).{0,10}(joiz|lozim|kerak|zarur|mumkin)/i,
      /(zamonaviy|bugungi|hozirgi).{0,10}(dunyoda|jamiyatda|davrda|ta'limda|sharoitda)/i,
      /(muhim|katta|sezilarli|alohida).{0,10}(ahamiyat|o'rin|rol).{0,10}(kasb etadi|tutadi|ega)/i,
      /yuqoridagilardan kelib.{0,5}(chiqib|chiqqan)/i,
      /(takomillashtirish|rivojlantirish|joriy etish|amalga oshirish).{0,15}(zarur|lozim|kerak|maqsadga muvofiq)/i,
      /ilmiy.{0,10}(tadqiqotlar|izlanishlar|manba|adabiyotlar).{0,10}(ko'rsatadi|shuni|tahlili)/i,
      /(pedagogik|ilmiy|nazariy|amaliy).{0,10}(jihatdan|nuqtai nazardan|asosda)/i,
      /imkonini (beradi|yaratadi|ta'minlaydi|ochadi)/i,
      /(ta'minlash|oshirish|shakllantirish|rivojlantirish).{0,10}(maqsad|vazifa|talab)/i,
      /(asoslab|isbotlab|ko'rsatib|tahlil qilib).{0,5}(bergan|o'tgan|kelgan)/i,
      /it is (important|worth|essential|crucial) to (note|mention|highlight)/i,
      /this (suggests|indicates|demonstrates|highlights|underscores)/i,
      /plays a (crucial|vital|significant|important|key) role/i,
      /(необходимо|важно|следует) (отметить|подчеркнуть|учитывать)/i
    ];

    // Inson yozganlikni bildiruvchi belgilar
    this.humanIndicators = [
      /\b(ya'ni|xullas|qisqasi|aytganday|o'zi|bilasizmi|voy|eee|ha|hmm)\b/i,
      /\b(menimcha|o'ylayman|his qilaman|ko'rdim|eshitdim|sezdim)\b/i,
      /[!]{2,}/, // Ko'p undov belgi
      /\b\d{4}\b.{0,5}yil/i, // Aniq yillar (2024-yil) - inson
      /\(.{0,50}(bet|b\.|p\.|sahifa)\)/i, // Sahifa raqamlari - inson
      /\[\d+\]/, // Iqtibos raqamlari [1], [23] - inson
    ];
  }

  detectFull(text) {
    if (!text || text.trim().length < 50) {
      return { aiScore: 0, verdict: 'insufficient_text', message: 'Matn juda qisqa.', sentences: [], highlights: [], stats: {} };
    }

    // TO'G'RI jumlalarga bo'lish (faqat . ! ? bilan)
    const sentences = this.splitSentences(text);
    
    // Har bir jumlani baholash
    const analyzedSentences = sentences.map((sentence, index) => {
      const score = this.analyzeSentence(sentence, index, sentences);
      return { text: sentence, index, aiScore: score, isAI: score >= 55, level: this.getLevel(score) };
    });

    // Xususiyatlar
    const features = this.analyzeFeatures(text, sentences);
    const featureScore = this.calculateFeatureScore(features);
    const sentenceAvg = this.calculateOverallFromSentences(analyzedSentences);
    const finalScore = Math.round((sentenceAvg * 0.6 + featureScore * 0.4) * 100) / 100;

    let verdict = 'human';
    if (finalScore >= 72) verdict = 'ai_generated';
    else if (finalScore >= 55) verdict = 'likely_ai';
    else if (finalScore >= 38) verdict = 'mixed';
    else if (finalScore >= 20) verdict = 'likely_human';

    const highlights = this.buildHighlights(text, analyzedSentences);
    const aiSentences = analyzedSentences.filter(s => s.isAI).length;

    return {
      aiScore: finalScore, verdict, message: this.getVerdictMessage(verdict),
      sentences: analyzedSentences, highlights, features,
      stats: {
        totalSentences: sentences.length, aiSentences,
        humanSentences: sentences.length - aiSentences,
        aiPercentage: Math.round((aiSentences / Math.max(sentences.length, 1)) * 100),
        totalWords: text.split(/\s+/).length, totalChars: text.length
      }
    };
  }

  detect(text) {
    const r = this.detectFull(text);
    return { aiScore: r.aiScore, verdict: r.verdict, message: r.message, features: r.features };
  }

  /**
   * MUHIM: To'g'ri jumlalarga bo'lish
   * Faqat nuqta, undov va so'roq belgisidan keyin yangi jumla boshlanadi
   * Nuqtali vergul (;) va ikki nuqta (:) jumla ajratmaydi!
   */
  splitSentences(text) {
    // Qisqartmalarni himoya qilish
    let cleaned = text
      .replace(/\r\n/g, '\n')
      .replace(/([A-Z])\./g, '$1DOTPROTECT') // Qisqartmalar: A. B. va h.k.
      .replace(/(\d)\./g, '$1DOTPROTECT')     // 1. 2. 3. raqamlar
      .replace(/(va h\.k|va sh\.k|va b)/g, '$1DOTPROTECT');

    // Faqat . ! ? dan keyin bo'lish
    const raw = cleaned.split(/(?<=[.!?])\s+(?=[A-ZА-ЯA-Z\u0400-\u04FF])|(?<=[.!?])\s*\n/);
    
    // DOTPROTECT ni qaytarish
    const sentences = raw
      .map(s => s.replace(/DOTPROTECT/g, '.').trim())
      .filter(s => s.length > 30); // Kamida 30 belgi

    // Agar kam jumla chiqsa, paragraflar bo'yicha
    if (sentences.length < 5) {
      const byParagraph = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
      if (byParagraph.length > sentences.length) {
        return byParagraph.map(p => p.trim());
      }
    }

    // Juda uzun "jumlalarni" ham bo'lish (200+ so'z)
    const final = [];
    for (const s of sentences) {
      const wordCount = s.split(/\s+/).length;
      if (wordCount > 80) {
        // Nuqtali vergul yoki yangi qator bilan bo'lish
        const parts = s.split(/[;\n]/).filter(p => p.trim().length > 30);
        if (parts.length > 1) {
          final.push(...parts.map(p => p.trim()));
        } else {
          final.push(s);
        }
      } else {
        final.push(s);
      }
    }

    return final.length > 0 ? final : [text.trim()];
  }

  analyzeSentence(sentence, index, allSentences) {
    const wordCount = sentence.split(/\s+/).length;
    const lowerSentence = sentence.toLowerCase();
    
    let totalScore = 0;
    let totalWeight = 0;

    // 1. Jumla uzunligi (AI: 15-35 so'z orasida bo'ladi)
    let lenScore;
    if (wordCount >= 15 && wordCount <= 35) lenScore = 65;
    else if (wordCount >= 10 && wordCount <= 45) lenScore = 45;
    else lenScore = 20;
    totalScore += lenScore * 0.08; totalWeight += 0.08;

    // 2. Transition so'zlar
    const startsWithTransition = this.transitionWords.some(tw => lowerSentence.startsWith(tw));
    const hasTransition = this.transitionWords.some(tw => lowerSentence.includes(tw));
    let transScore = startsWithTransition ? 80 : (hasTransition ? 55 : 15);
    totalScore += transScore * 0.18; totalWeight += 0.18;

    // 3. AI pattern lar — ENG MUHIM MEZON
    const patternMatches = this.aiPatterns.filter(p => p.test(sentence)).length;
    let patternScore;
    if (patternMatches >= 3) patternScore = 95;
    else if (patternMatches >= 2) patternScore = 85;
    else if (patternMatches === 1) patternScore = 68;
    else patternScore = 20;
    totalScore += patternScore * 0.28; totalWeight += 0.28;

    // 4. Formal fe'llar (o'zbekcha)
    const formalVerbs = /(hisoblanadi|sanaladi|qaraladi|amalga oshiriladi|ta'minlanadi|joriy etiladi|ko'rib chiqiladi|tavsiya etiladi|ishlab chiqilgan|asoslab berilgan|ko'rsatib o'tilgan|belgilab berilgan|aniqlangan|tahlil qilingan|o'rganilgan|qayd etilgan|yoritilgan|bayon etilgan|ifodalanadi|namoyon bo'ladi|xizmat qiladi|asos bo'ladi)/i;
    const formalCount = (sentence.match(formalVerbs) || []).length;
    let formalScore;
    if (formalCount >= 2) formalScore = 80;
    else if (formalCount === 1) formalScore = 60;
    else formalScore = 20;
    totalScore += formalScore * 0.18; totalWeight += 0.18;

    // 5. Vergullar zichligi
    const commas = (sentence.match(/,/g) || []).length;
    const commaRatio = commas / Math.max(wordCount, 1);
    let commaScore;
    if (commaRatio > 0.15) commaScore = 70;
    else if (commaRatio > 0.08) commaScore = 50;
    else commaScore = 20;
    totalScore += commaScore * 0.07; totalWeight += 0.07;

    // 6. Oldingi jumla bilan uzunlik o'xshashligi
    if (index > 0 && index < allSentences.length - 1) {
      const prevLen = allSentences[index - 1].split(/\s+/).length;
      const nextLen = allSentences[Math.min(index + 1, allSentences.length - 1)].split(/\s+/).length;
      const avgNeighbor = (prevLen + nextLen) / 2;
      const diff = Math.abs(wordCount - avgNeighbor);
      let simScore;
      if (diff <= 5) simScore = 70;
      else if (diff <= 10) simScore = 45;
      else simScore = 15;
      totalScore += simScore * 0.06; totalWeight += 0.06;
    }

    // 7. INSON belgilari (bu ball kamaytiradi)
    const hasHumanIndicator = this.humanIndicators.some(p => p.test(sentence));
    if (hasHumanIndicator) {
      totalScore += 10 * 0.15; totalWeight += 0.15;
    } else {
      totalScore += 55 * 0.15; totalWeight += 0.15;
    }

    return Math.min(99, Math.round(totalScore / totalWeight));
  }

  getLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 55) return 'medium';
    if (score >= 35) return 'low';
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
        highlights.push({ start, end: start + s.text.length, text: s.text, score: s.aiScore, level: s.level, isAI: s.isAI });
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
      sentenceLength: this.analyzeSentenceLengthUniformity(sentences)
    };
  }

  analyzeBurstiness(sentences) {
    if (sentences.length < 3) return { score: 50 };
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    let score;
    if (cv < 0.25) score = 80;
    else if (cv < 0.40) score = 60;
    else if (cv < 0.55) score = 35;
    else score = 15;
    return { score, cv: Math.round(cv * 100) / 100 };
  }

  analyzeVocabulary(text) {
    const words = text.toLowerCase().replace(/[^\w\s\u0400-\u04FF]/g, '').split(/\s+/).filter(w => w.length > 3);
    const uniqueWords = new Set(words);
    const ttr = uniqueWords.size / Math.max(words.length, 1);
    let score;
    if (ttr < 0.30) score = 75;
    else if (ttr < 0.40) score = 55;
    else if (ttr < 0.50) score = 35;
    else score = 15;
    return { score, ttr: Math.round(ttr * 100) / 100 };
  }

  analyzeTransitionDensity(text, sentences) {
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
    else if (ratio > 0.15) score = 45;
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
    if (ratio > 0.30) score = 90;
    else if (ratio > 0.15) score = 70;
    else if (ratio > 0.08) score = 50;
    else score = 20;
    return { score, matchCount, ratio: Math.round(ratio * 100) / 100 };
  }

  analyzeSentenceLengthUniformity(sentences) {
    const lengths = sentences.map(s => s.split(/\s+/).length);
    if (lengths.length < 3) return { score: 50 };
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const inRange = lengths.filter(l => l >= 12 && l <= 40).length;
    const ratio = inRange / lengths.length;
    let score;
    if (ratio > 0.80) score = 75;
    else if (ratio > 0.60) score = 55;
    else if (ratio > 0.40) score = 35;
    else score = 15;
    return { score, avgLength: Math.round(mean), uniformRatio: Math.round(ratio * 100) / 100 };
  }

  calculateFeatureScore(features) {
    const weights = { burstiness: 0.25, vocabulary: 0.15, transitions: 0.22, patterns: 0.25, sentenceLength: 0.13 };
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
