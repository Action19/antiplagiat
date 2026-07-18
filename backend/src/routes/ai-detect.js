const express = require('express');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const FileParser = require('../services/parser');
const AIDetector = require('../services/ai-detection');

const router = express.Router();
const fileParser = new FileParser();
const aiDetector = new AIDetector();

// POST /api/ai-detect/text - Matnni AI tekshirish
router.post('/text', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Matn juda qisqa. Kamida 50 ta belgi kerak.' });
    }

    const result = aiDetector.detectFull(text);

    res.json({
      success: true,
      originalText: text,
      ...result
    });
  } catch (error) {
    console.error('AI detect text xatosi:', error);
    res.status(500).json({ error: 'AI tahlilida xato yuz berdi.' });
  }
});

// POST /api/ai-detect/file - Fayl yuklash va AI tekshirish
router.post('/file', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fayl yuklanmadi.' });
    }

    // Fayldan matn ajratib olish
    const parsed = await fileParser.parseFile(req.file.path);
    const text = parsed.text;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Fayldan yetarli matn topilmadi.' });
    }

    const result = aiDetector.detectFull(text);

    res.json({
      success: true,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      originalText: text,
      ...result
    });
  } catch (error) {
    console.error('AI detect file xatosi:', error);
    res.status(500).json({ error: 'Fayl tahlilida xato: ' + error.message });
  }
});

module.exports = router;
