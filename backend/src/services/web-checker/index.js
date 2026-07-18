const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../../config/database');

class WebChecker {
  constructor() {
    this.timeout = 10000;
  }

  extractKeyPhrases(text, count = 5) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const sorted = sentences.map(s => s.trim()).filter(s => s.split(/\s+/).length >= 5).sort((a, b) => b.length - a.length);
    const phrases = [];
    for (let i = 0; i < Math.min(count, sorted.length); i++) {
      const words = sorted[i].split(/\s+/);
      const start = Math.floor(Math.random() * Math.max(words.length - 7, 1));
      const phrase = words.slice(start, start + 7).join(' ');
      if (phrase.length > 15) phrases.push(phrase);
    }
    return phrases;
  }

  async fetchPageContent(url) {
    try {
      const response = await axios.get(url, { timeout: this.timeout, headers: { 'User-Agent': 'AntiplagiatBot/1.0' } });
      const $ = cheerio.load(response.data);
      $('script, style, nav, footer, header').remove();
      return { url, title: $('title').text() || url, content: $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000) };
    } catch { return null; }
  }

  async checkOnline(text) {
    const phrases = this.extractKeyPhrases(text);
    const webSources = [];
    for (const phrase of phrases) {
      try {
        const cached = await this.checkCache(phrase);
        if (cached.length > 0) { webSources.push(...cached); continue; }
      } catch (e) { /* continue */ }
    }
    return webSources;
  }

  async checkCache(phrase) {
    try {
      const result = await pool.query('SELECT url, title, content FROM web_sources_cache WHERE content ILIKE $1 LIMIT 5', [`%${phrase.substring(0, 50)}%`]);
      return result.rows;
    } catch { return []; }
  }
}

module.exports = WebChecker;
