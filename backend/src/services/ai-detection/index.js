/**
 * AI Text Detection moduli (v4 - Barcha uslublar uchun)
 * ChatGPT ning ilmiy, og'zaki va aralash uslublarini aniqlaydi.
 */

class AIDetector {
  constructor() {
    this.transitionWords = [
      'furthermore', 'moreover', 'additionally', 'consequently',
      'nevertheless', 'however', 'therefore', 'subsequently',
      'in conclusion', 'in summary', 'in addition', 'as a result',
      'on the other hand', 'for instance', 'for example',
      'shuningdek', 'bundan tashqari', 'natijada', 'shu sababli',
      'biroq', 'ammo', 'lekin', 'shunga qaramay', 'masalan',
      'xulosa qilib', 'shu bilan birga', 'yuqoridagilardan',
      'shunday qilib', 'demak', 'binobarin', 'xususan', 'jumladan',
      'ayniqsa', 'shu jumladan', 'qolaversa', 'albatta',
      'кроме того', 'более того', 'следовательно', 'однако',
      'таким образом', 'в заключение'
    ];

    // AI patternlari - ilmiy uslub
    this.formalAIPatterns = [
      /(muhim|zarur|dolzarb).{0,25}(ahamiyat|o'rin|rol)/i,
      /shuni.{0,15}(ta'kidlash|qayd etish|ko'rsatish).{0,10}(joiz|lozim|kerak)/i,
      /(zamonaviy|bugungi|hozirgi).{0,15}(dunyoda|jamiyatda|davrda|sharoitda)/i,
      /(takomillashtirish|rivojlantirish|joriy etish).{0,15}(zarur|lozim|kerak)/i,
      /imkonini (beradi|yaratadi|ta'minlaydi)/i,
      /it is (important|worth|essential) to (note|mention)/i,
      /plays a (crucial|vital|significant) role/i,
    ];

    // AI patternlari - NORASMIY/og'zaki uslub (ChatGPT shunday yozadi)
    this.informalAIPatterns = [
      /bu.{0,15}(davr|payt|vaqt|yillar).{0,20}(eng|juda).{0,15}(muhim|unutilmas|qimmatli|go'zal|ajoyib)/i,
      /(nafaqat|faqat).{0,20}(balki|ham)/i,
      /hayot.{0,15}(dars|ibrat|tajriba|saboq).{0,10}(berdi|o'rgatdi|bo'ldi)/i,
      /(eng|juda).{0,10}(muhim|qimmatli|unutilmas|go'zal|ajoyib).{0,15}(narsalardan|lahzalardan|davrlardan|kunlardan)/i,
      /(shaxs|inson|insonni).{0,15}(shakllantir|rivojlantir|tarbiyala)/i,
      /har bir.{0,15}(inson|kishi|odam|bola|o'quvchi).{0,15}(uchun|hayotida)/i,
      /(xulosa|qisqa) qilib (aytganda|aytadigan|aytish)/i,
      /bu.{0,10}(davr|payt|yillar).{0,15}(davomida|mobaynida|ichida)/i,
      /(mustahkam|kuchli|chuqur).{0,15}(poydevor|asos|zamin).{0,10}(yaratadi|qo'yadi|bo'ladi)/i,
      /not only.{0,20}but also/i,
      /it is (worth|important).{0,10}(mentioning|noting|remembering)/i,
      /these (experiences|moments|memories|years).{0,15}(shape|form|teach|help)/i,
      // YANGI - shaxsiy hikoya uchun
      /(unutilmas|ajoyib|go'zal|qimmatli|hayotiy).{0,15}(voqea|lahza|kun|davr|xotira)/i,
      /o'ziga xos.{0,15}(xotira|voqea|tajriba|lahza)/i,
      /hali ham.{0,20}(yodimdan|esimdan|xotiramdan|ko'z oldimdan)/i,
      /(boy|to'la|to'lib-toshgan).{0,5}(bo'ladi|bo'lgan|edi)/i,
      /(qaror|ahd) (qildim|qildi|qilishdi|qilgan)/i,
      /men.{0,5}(uchun|ham).{0,5}(ham|esa|bu)/i,
      /(tayyorgarlik|shug'ullanish|mashq).{0,10}(ko'rdim|qildim|boshladim)/i,
      /(maslahat|yo'l-yo'riq|ko'rsatma).{0,10}(berdi|berishdi|oldi)/i,
    ];

    // ChatGPT ning xos xususiyatlari (barcha uslubda)
    this.chatgptSignatures = [
      /nafaqat.{5,40}balki.{5,40}ham/i,
      /^bu (davr|narsa|masala|jarayon|holat|jihat)/i,
      /(\w+lash|\w+tirish|\w+lanish),\s*(\w+lash|\w+tirish|\w+lanish)/i,
      /(biri|biridir) (hisoblanadi|bo'ladi|sanaladi)/i,
      /har bir.{0,20}(inson|odam|kishi|bola|o'quvchi)/i,
      /(bilim|tajriba|ko'nikma).{0,10}(va|hamda).{0,10}(malaka|ko'nikma|bilim|tajriba)/i,
      // YANGI - shaxsiy hikoya uchun
      /\w+,\s*\w+.{0,20}(va|hamda)\s+\w+/i,
      /o'ziga xos/i,
      /(boy|to'la).{0,5}bo'l/i,
      /men.{0,5}(uchun|ham)/i,
      /(ayniqsa|xususan),?.{0,5}(bir|bu|o'sha|shu)/i,
    ];
  }

  detectFull(text) {
    if (!text || text.trim().length < 50) {
      return { aiScore: 0, verdict: 'insufficient_text', message: 'Matn juda qisqa.', sentences: [], highlights: [], stats: {} };
    }

    const sentences = this.splitSentences(text);
    const analyzedSentences = sentences.map((sentence, index) => {
      const score = this.analyzeSentence(sentence, index, sentences);
      return { text: sentence, index, aiScore: score, isAI: score >= 40, level: this.getLevel(score) };
    });

    const features = this.analyzeFeatures(text, sentences);
    const featureScore = this.calculateFeatureScore(features);
    const sentenceAvg = this.calculateOverallFromSentences(analyzedSentences);
    const finalScore = Math.round((sentenceAvg * 0.55 + featureScore * 0.45) * 100) / 100;

    let verdict = 'human';
    if (finalScore >= 70) verdict = 'ai_generated';
    else if (finalScore >= 52) verdict = 'likely_ai';
    else if (finalScore >= 35) verdict = 'mixed';
    else if (finalScore >= 18) verdict = 'likely_human';

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

  splitSentences(text) {
    let cleaned = text.replace(/\r\n/g, '\n');
    // Qisqartmalarni himoya
    cleaned = cleaned.replace(/([A-Z])\.\s/g, '$1DOTPROT ');
    cleaned = cleaned.replace(/(\d)\.\s/g, '$1DOTPROT ');

    // Jumlalarni ajratish: . ! ? dan keyin
    const raw = cleaned.split(/(?<=[.!?])\s+/);
    const sentences = raw
      .map(s => s.replace(/DOTPROT/g, '.').trim())
      .filter(s => s.length > 25 && s.split(/\s+/).length >= 5);

    if (sentences.length < 3) {
      const byLine = text.split(/\n+/).filter(s => s.trim().length > 25);
      if (byLine.length > sentences.length) return byLine.map(s => s.trim());
    }

    return sentences.length > 0 ? sentences : [text.trim()];
  }

  analyzeSentence(sentence, index, allSentences) {
    const wordCount = sentence.split(/\s+/).length;
    const lowerSentence = sentence.toLowerCase();

    let totalScore = 0;
    let totalWeight = 0;

    // 1. AI PATTERNS — FORMAL (25%)
    const formalMatches = this.formalAIPatterns.filter(p => p.test(sentence)).length;
    let formalPatScore = formalMatches >= 2 ? 90 : (formalMatches === 1 ? 72 : 25);
    totalScore += formalPatScore * 0.20; totalWeight += 0.20;

    // 2. AI PATTERNS — NORASMIY / ChatGPT (25%)
    const informalMatches = this.informalAIPatterns.filter(p => p.test(sentence)).length;
    let informalPatScore = informalMatches >= 2 ? 92 : (informalMatches === 1 ? 75 : 25);
    totalScore += informalPatScore * 0.20; totalWeight += 0.20;

    // 3. ChatGPT SIGNATURE (20%)
    const sigMatches = this.chatgptSignatures.filter(p => p.test(sentence)).length;
    let sigScore = sigMatches >= 2 ? 90 : (sigMatches === 1 ? 70 : 20);
    totalScore += sigScore * 0.20; totalWeight += 0.20;

    // 4. TRANSITION so'zlar (15%)
    const startsWithTrans = this.transitionWords.some(tw => lowerSentence.startsWith(tw));
    const hasTrans = this.transitionWords.some(tw => lowerSentence.includes(tw));
    let transScore = startsWithTrans ? 80 : (hasTrans ? 55 : 15);
    totalScore += transScore * 0.15; totalWeight += 0.15;

    // 5. JUMLA UZUNLIGI (10%)
    let lenScore;
    if (wordCount >= 15 && wordCount <= 35) lenScore = 65;
    else if (wordCount >= 10 && wordCount <= 45) lenScore = 45;
    else lenScore = 20;
    totalScore += lenScore * 0.10; totalWeight += 0.10;

    // 6. VERGULLAR (8%)
    const commas = (sentence.match(/,/g) || []).length;
    const commaRatio = commas / Math.max(wordCount, 1);
    let commaScore = commaRatio > 0.12 ? 70 : (commaRatio > 0.06 ? 50 : 20);
    totalScore += commaScore * 0.08; totalWeight += 0.08;

    // 7. TEKISLIK — oldingi va keyingi jumlalar bilan (7%)
    if (index > 0) {
      const prevLen = allSentences[index - 1].split(/\s+/).length;
      const diff = Math.abs(wordCount - prevLen);
      let simScore = diff <= 5 ? 70 : (diff <= 10 ? 45 : 15);
      totalScore += simScore * 0.07; totalWeight += 0.07;
    }

    return Math.min(99, Math.round(totalScore / totalWeight));
  }

  getLevel(score) {
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 28) return 'low';
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
      formalPatterns: this.analyzePatternDensity(sentences, this.formalAIPatterns),
      informalPatterns: this.analyzePatternDensity(sentences, this.informalAIPatterns),
      signatures: this.analyzePatternDensity(sentences, this.chatgptSignatures),
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
    if (cv < 0.25) score = 82;
    else if (cv < 0.38) score = 62;
    else if (cv < 0.50) score = 38;
    else score = 15;
    return { score, cv: Math.round(cv * 100) / 100 };
  }

  analyzeVocabulary(text) {
    const words = text.toLowerCase().replace(/[^\w\s\u0400-\u04FF]/g, '').split(/\s+/).filter(w => w.length > 3);
    const uniqueWords = new Set(words);
    const ttr = uniqueWords.size / Math.max(words.length, 1);
    let score;
    if (ttr < 0.35) score = 70;
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
    else if (ratio > 0.2) score = 62;
    else if (ratio > 0.1) score = 40;
    else score = 15;
    return { score, count, ratio: Math.round(ratio * 100) / 100 };
  }

  analyzePatternDensity(sentences, patterns) {
    let matchCount = 0;
    for (const s of sentences) {
      if (patterns.some(p => p.test(s))) matchCount++;
    }
    const ratio = matchCount / Math.max(sentences.length, 1);
    let score;
    if (ratio > 0.35) score = 90;
    else if (ratio > 0.20) score = 72;
    else if (ratio > 0.10) score = 50;
    else score = 18;
    return { score, matchCount, ratio: Math.round(ratio * 100) / 100 };
  }

  analyzeSentenceLengthUniformity(sentences) {
    const lengths = sentences.map(s => s.split(/\s+/).length);
    if (lengths.length < 3) return { score: 50 };
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const inRange = lengths.filter(l => l >= 10 && l <= 35).length;
    const ratio = inRange / lengths.length;
    let score;
    if (ratio > 0.75) score = 75;
    else if (ratio > 0.55) score = 55;
    else if (ratio > 0.35) score = 35;
    else score = 15;
    return { score, avgLength: Math.round(mean), uniformRatio: Math.round(ratio * 100) / 100 };
  }

  calculateFeatureScore(features) {
    const weights = { burstiness: 0.20, vocabulary: 0.12, transitions: 0.18, formalPatterns: 0.15, informalPatterns: 0.15, signatures: 0.12, sentenceLength: 0.08 };
    let total = 0;
    for (const [key, weight] of Object.entries(weights)) {
      total += (features[key]?.score || 40) * weight;
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
