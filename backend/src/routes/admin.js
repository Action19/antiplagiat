const express = require('express');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalDocs = await pool.query('SELECT COUNT(*) FROM documents');
    const totalChecks = await pool.query('SELECT COUNT(*) FROM check_results WHERE status = $1', ['completed']);
    const avgOriginality = await pool.query('SELECT AVG(originality_score) as avg FROM check_results WHERE status = $1', ['completed']);
    const avgAI = await pool.query('SELECT AVG(ai_score) as avg FROM check_results WHERE status = $1 AND ai_score IS NOT NULL', ['completed']);

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalDocuments: parseInt(totalDocs.rows[0].count),
      totalChecks: parseInt(totalChecks.rows[0].count),
      averageOriginality: Math.round(parseFloat(avgOriginality.rows[0].avg || 0) * 100) / 100,
      averageAIScore: Math.round(parseFloat(avgAI.rows[0].avg || 0) * 100) / 100
    });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, full_name, role, is_active, created_at, (SELECT COUNT(*) FROM documents WHERE user_id = users.id) as doc_count FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi.' });
  }
});

router.put('/users/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = $1 AND role != \'admin\' RETURNING id, email, is_active', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi.' });
    res.json({ message: result.rows[0].is_active ? 'Aktivlashtirildi.' : 'Bloklandi.', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi.' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 AND role != \'admin\' RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi.' });
    res.json({ message: 'O\'chirildi.' });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi.' });
  }
});

router.get('/documents', async (req, res) => {
  try {
    const result = await pool.query('SELECT d.*, u.full_name as user_name, u.email as user_email, cr.overall_score, cr.originality_score, cr.ai_score, cr.status as check_status FROM documents d JOIN users u ON u.id = d.user_id LEFT JOIN check_results cr ON cr.document_id = d.id ORDER BY d.created_at DESC LIMIT 50');
    res.json({ documents: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi.' });
  }
});

module.exports = router;
