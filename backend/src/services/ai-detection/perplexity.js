/**
 * GPT-2 Perplexity Calculator
 * HuggingFace Inference API orqali matnning perplexity ni hisoblaydi.
 * 
 * Perplexity = matnning "kutilmaganlik" darajasi
 * Past perplexity = AI yozgan (bashorat qilish oson)
 * Yuqori perplexity = Inson yozgan (kutilmagan so'zlar)
 * 
 * HuggingFace API token kerak: https://huggingface.co/settings/tokens
 */

const axios = require('axios');

class PerplexityCalculator {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
    this.modelUrl = 'https://api-inference.huggingface.co/models/gpt2';
    this.enabled = !!this.apiKey;
    
    // Perplexity chegaralari (kalibrovka)
    // Past perplexity = AI, Yuqori = Inson
    this.thresholds = {
      ai_generated: 30,      // < 30 = aniq AI
      likely_ai: 50,         // 30-50 = ehtimol AI
      mixed: 80,             // 50-80 = aralash
      likely_human: 120,     // 80-120 = ehtimol inson
      human: 120             // > 120 = aniq inson
    };
  }

  /**
   * HuggingFace API orqali token ehtimolliklarini olish
   */
  async getLogProbabilities(text) {
    if (!this.enabled) {
      return null;
    }

    try {
      // Matnni 500 token ga cheklash (API limiti)
      const truncated = text.substring(0, 2000);

      const response = await axios.post(
        this.modelUrl,
        { inputs: truncated, parameters: { return_full_text: false } },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('HuggingFace API xatosi:', error.message);
      return null;
    }
  }

  /**
   * Matnning perplexity ni HuggingFace API orqali hisoblash
   * Bu usul: matnni bo'laklarga bo'lib, har birining "davom etish ehtimolligi"ni tekshiradi
   */
  async calculatePerplexity(text) {
    if (!this.enabled) {
      return { available: false, message: 'HUGGINGFACE_API_KEY sozlanmagan' };
    }

    try {
      // Matnni jumlalarga bo'lib, har birini tekshirish
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const results = [];

      // Har 5 ta jumlani bir paketda yuborish (API limitini tejash)
      const batchSize = 5;
      for (let i = 0; i < Math.min(sentences.length, 20); i += batchSize) {
        const batch = sentences.slice(i, i + batchSize);
        
        for (const sentence of batch) {
          const score = await this.scoreSentence(sentence.trim());
          if (score !== null) {
            results.push({ text: sentence.trim(), perplexity: score });
          }
        }

        // API rate limit uchun kutish
        if (i + batchSize < sentences.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (results.length === 0) {
        return { available: true, perplexity: null, message: 'Natija olinmadi' };
      }

      // O'rtacha perplexity
      const avgPerplexity = results.reduce((sum, r) => sum + r.perplexity, 0) / results.length;
      
      // AI ehtimolligini aniqlash
      const aiProbability = this.perplexityToAIScore(avgPerplexity);

      return {
        available: true,
        perplexity: Math.round(avgPerplexity * 100) / 100,
        aiProbability,
        verdict: this.getVerdict(avgPerplexity),
        sentenceScores: results.slice(0, 10), // Birinchi 10 ta jumlani qaytarish
        message: `O'rtacha perplexity: ${Math.round(avgPerplexity)}`
      };
    } catch (error) {
      console.error('Perplexity hisoblashda xato:', error.message);
      return { available: true, perplexity: null, error: error.message };
    }
  }

  /**
   * Bitta jumla uchun perplexity hisoblash
   * HuggingFace text-generation API dan "continuation probability" olinadi
   */
  async scoreSentence(sentence) {
    try {
      // Jumlaning birinchi yarmini berib, ikkinchi yarmini bashorat qildirish
      const words = sentence.split(/\s+/);
      if (words.length < 6) return null;

      const halfPoint = Math.floor(words.length / 2);
      const prompt = words.slice(0, halfPoint).join(' ');
      const expected = words.slice(halfPoint).join(' ').toLowerCase();

      const response = await axios.post(
        this.modelUrl,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: Math.min(words.length - halfPoint + 5, 50),
            temperature: 1.0,
            return_full_text: false,
            num_return_sequences: 1
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (response.data && response.data[0]) {
        const generated = (response.data[0].generated_text || '').toLowerCase();
        
        // Generated matn va haqiqiy matn o'rtasidagi o'xshashlikni hisoblash
        // O'xshash = past perplexity (AI), farqli = yuqori perplexity (inson)
        const similarity = this.calculateSimilarity(generated, expected);
        
        // Similarity ni perplexity ga o'tkazish
        // Yuqori similarity = past perplexity (AI yozgan)
        const perplexity = Math.max(5, (1 - similarity) * 200);
        return perplexity;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Ikki matn o'rtasidagi o'xshashlikni hisoblash (0-1)
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2));
    
    if (words1.size === 0 || words2.size === 0) return 0;

    let matches = 0;
    for (const word of words1) {
      if (words2.has(word)) matches++;
    }

    return matches / Math.max(words1.size, words2.size);
  }

  /**
   * Perplexity ni AI ehtimolligiga (0-100%) o'tkazish
   */
  perplexityToAIScore(perplexity) {
    if (perplexity < 20) return 95;
    if (perplexity < 35) return 85;
    if (perplexity < 50) return 70;
    if (perplexity < 70) return 55;
    if (perplexity < 90) return 40;
    if (perplexity < 120) return 25;
    return 10;
  }

  /**
   * Perplexity asosida xulosa
   */
  getVerdict(perplexity) {
    if (perplexity < this.thresholds.ai_generated) return 'ai_generated';
    if (perplexity < this.thresholds.likely_ai) return 'likely_ai';
    if (perplexity < this.thresholds.mixed) return 'mixed';
    if (perplexity < this.thresholds.likely_human) return 'likely_human';
    return 'human';
  }

  /**
   * API mavjudligini tekshirish
   */
  isAvailable() {
    return this.enabled;
  }
}

module.exports = PerplexityCalculator;
