const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const FileParser = require('../services/parser');
const PlagiarismChecker = require('../services/algorithms');
const AIDetector = require('../services/ai-detection');
const WebChecker = require('../services/web-checker');
const ReportGenerator = require('../services/report');

const router = express.Router();
const fileParser = new FileParser();
const plagiarismChecker = new PlagiarismChecker();
const aiDetector = new AIDetector();
const webChecker = new WebChecker();
const reportGenerator = new ReportGenerator();

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    let text = '', title = req.body.title || '', originalFilename = null, filePath = null, fileType = 'text';
    if (req.file) {
      const parsed = await fileParser.parseFile(req.file.path);
      text = parsed.text; originalFilename = req.file.originalname; filePath = req.file.path; fileType = req.file.mimetype;
      if (!title) title = req.file.originalname;
    } else if (req.body.text) {
      text = req.body.text; if (!title) title = text.substring(0, 50) + '...';
    } else {
      return res.status(400).json({ error: 'Fayl yoki matn kiritilishi shart.' });
    }
    if (text.trim().length < 50) return res.status(400).json({ error: 'Matn juda qisqa.' });

    const wordCount = fileParser.countWords(text);
    const docResult = await pool.query('INSERT INTO documents (user_id, title, original_filename, file_path, content, word_count, file_type) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [req.user.id, title, originalFilename, filePath, text, wordCount, fileType]);
    const document = docResult.rows[0];
    const checkResult = await pool.query('INSERT INTO check_results (document_id, user_id, status) VALUES ($1, $2, \'processing\') RETURNING *', [document.id, req.user.id]);

    res.status(201).json({ message: 'Tekshiruv boshlanmoqda...', document, checkId: checkResult.rows[0].id });
    performCheck(checkResult.rows[0].id, document, text, req.user.id);
  } catch (error) {
    console.error('Upload xatosi:', error);
    res.status(500).json({ error: 'Fayl yuklashda xato: ' + error.message });
  }
});

router.post('/check-text', authenticate, async (req, res) => {
  try {
    const { text, title } = req.body;
    if (!text || text.trim().length < 50) return res.status(400).json({ error: 'Matn juda qisqa.' });
    const wordCount = fileParser.countWords(text);
    const docTitle = title || text.substring(0, 50) + '...';
    const docResult = await pool.query('INSERT INTO documents (user_id, title, content, word_count, file_type) VALUES ($1,$2,$3,$4,\'text\') RETURNING *', [req.user.id, docTitle, text, wordCount]);
    const document = docResult.rows[0];
    const checkResult = await pool.query('INSERT INTO check_results (document_id, user_id, status) VALUES ($1, $2, \'processing\') RETURNING *', [document.id, req.user.id]);
    res.status(201).json({ message: 'Tekshiruv boshlanmoqda...', document, checkId: checkResult.rows[0].id });
    performCheck(checkResult.rows[0].id, document, text, req.user.id);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi.' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query('SELECT d.*, cr.overall_score, cr.originality_score, cr.ai_score, cr.status as check_status FROM documents d LEFT JOIN check_results cr ON cr.document_id = d.id WHERE d.user_id = $1 ORDER BY d.created_at DESC LIMIT $2 OFFSET $3', [req.user.id, limit, offset]);
    const countResult = await pool.query('SELECT COUNT(*) FROM documents WHERE user_id = $1', [req.user.id]);
    res.json({ documents: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), totalPages: Math.ceil(countResult.rows[0].count / limit) });
  } catch (error) { res.status(500).json({ error: 'Server xatosi.' }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT d.*, cr.overall_score, cr.originality_score, cr.ai_score, cr.shingling_score, cr.minhash_score, cr.tfidf_score, cr.fingerprint_score, cr.status as check_status, cr.id as check_id FROM documents d LEFT JOIN check_results cr ON cr.document_id = d.id WHERE d.id = $1 AND d.user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi.' });
    res.json({ document: result.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Server xatosi.' }); }
});

router.get('/:id/results', authenticate, async (req, res) => {
  try {
    const checkResult = await pool.query('SELECT cr.* FROM check_results cr JOIN documents d ON d.id = cr.document_id WHERE cr.document_id = $1 AND d.user_id = $2 ORDER BY cr.created_at DESC LIMIT 1', [req.params.id, req.user.id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Topilmadi.' });
    const matches = await pool.query('SELECT * FROM plagiarism_matches WHERE check_result_id = $1 ORDER BY similarity_score DESC', [checkResult.rows[0].id]);
    res.json({ result: checkResult.rows[0], matches: matches.rows });
  } catch (error) { res.status(500).json({ error: 'Server xatosi.' }); }
});

router.get('/:id/report', authenticate, async (req, res) => {
  try {
    const checkResult = await pool.query('SELECT cr.*, d.title, d.original_filename, d.word_count FROM check_results cr JOIN documents d ON d.id = cr.document_id WHERE cr.document_id = $1 AND d.user_id = $2 ORDER BY cr.created_at DESC LIMIT 1', [req.params.id, req.user.id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Topilmadi.' });
    const matches = await pool.query('SELECT * FROM plagiarism_matches WHERE check_result_id = $1', [checkResult.rows[0].id]);
    const document = { title: checkResult.rows[0].title, original_filename: checkResult.rows[0].original_filename, word_count: checkResult.rows[0].word_count };
    const { filePath, fileName } = await reportGenerator.generateReport(checkResult.rows[0], document, matches.rows);
    res.download(filePath, fileName);
  } catch (error) { res.status(500).json({ error: 'Hisobot xatosi.' }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi.' });
    res.json({ message: 'O\'chirildi.' });
  } catch (error) { res.status(500).json({ error: 'Server xatosi.' }); }
});

async function performCheck(checkId, document, text, userId) {
  try {
    const docsResult = await pool.query('SELECT id, title, content FROM documents WHERE id != $1 LIMIT 100', [document.id]);
    const existingDocs = docsResult.rows;
    const plagResults = await plagiarismChecker.fullCheck(text, existingDocs);
    const aiResult = aiDetector.detect(text);
    let webSources = [];
    try { webSources = await webChecker.checkOnline(text); } catch (e) {}
    if (webSources.length > 0) {
      const webDocs = webSources.map((s, i) => ({ id: `web_${i}`, title: s.title, content: s.content }));
      const webResults = await plagiarismChecker.fullCheck(text, webDocs);
      plagResults.overall.score = Math.max(plagResults.overall.score, webResults.overall.score);
      plagResults.overall.originality = Math.max(0, 100 - plagResults.overall.score);
    }
    await pool.query('UPDATE check_results SET overall_score=$1, originality_score=$2, ai_score=$3, shingling_score=$4, minhash_score=$5, tfidf_score=$6, fingerprint_score=$7, status=\'completed\', completed_at=NOW() WHERE id=$8',
      [plagResults.overall.score, plagResults.overall.originality, aiResult.aiScore, plagResults.shingling.score, plagResults.minhash.score, plagResults.tfidf.score, plagResults.fingerprint.score, checkId]);

    const allMatches = [...plagResults.shingling.matches.map(m => ({ ...m, algorithm: 'shingling' })), ...plagResults.fingerprint.matches.map(m => ({ ...m, algorithm: 'fingerprint' }))];
    for (const match of allMatches.slice(0, 20)) {
      await pool.query('INSERT INTO plagiarism_matches (check_result_id, source_document_id, matched_text, start_position, end_position, similarity_score, algorithm_used) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [checkId, match.documentId && !match.documentId.startsWith('web_') ? match.documentId : null, match.matchedShingles?.[0] || 'O\'xshash qism', 0, 100, match.score, match.algorithm]);
    }
    console.log(`Tekshiruv tugadi: ${checkId} | Originallik: ${plagResults.overall.originality}%`);
  } catch (error) {
    console.error('Tekshiruv xatosi:', error);
    await pool.query('UPDATE check_results SET status = \'failed\' WHERE id = $1', [checkId]);
  }
}

module.exports = router;
