import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function DocumentDetail() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [docRes, resultsRes] = await Promise.all([
        documentsAPI.getOne(id),
        documentsAPI.getResults(id).catch(() => null)
      ]);
      setDocument(docRes.data.document || docRes.data);
      if (resultsRes) setResults(resultsRes.data);
    } catch (error) {
      toast.error('Hujjat topilmadi');
    } finally { setLoading(false); }
  };

  const downloadReport = async () => {
    try {
      const res = await documentsAPI.getReport(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `report-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Hisobotni yuklashda xato'); }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 70) return 'stroke-green-500';
    if (score >= 40) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Hujjat topilmadi</p>
      </div>
    );
  }

  const score = document.originality_score || 0;
  const aiScore = document.ai_score || results?.ai_score || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/results" className="text-gray-500 hover:text-gray-700">
              <FiArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-primary-700">
              {document.title || document.filename || 'Hujjat'}
            </h1>
          </div>
          {document.status === 'completed' && (
            <button onClick={downloadReport} className="btn-secondary flex items-center gap-2 text-sm">
              <FiDownload /> Hisobot
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {document.status !== 'completed' ? (
          <div className="card text-center py-12">
            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Hujjat tekshirilmoqda...</p>
            <p className="text-sm text-gray-500 mt-1">Bu bir necha daqiqa vaqt olishi mumkin</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Circle */}
            <div className="card flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    className={getScoreBg(score)}
                    strokeWidth="10"
                    strokeDasharray={`${score * 3.14} ${314 - score * 3.14}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</span>
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700 mt-4">Originallik</p>
            </div>

            {/* AI Score & Algorithms */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Tahlil natijalari</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">AI tomonidan yozilgan</span>
                    <span className="font-medium">{aiScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${aiScore}%` }}></div>
                  </div>
                </div>

                {results?.algorithms && Object.entries(results.algorithms).map(([name, value]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 capitalize">{name}</span>
                      <span className="font-medium">{typeof value === 'number' ? `${Math.round(value)}%` : value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${typeof value === 'number' ? value : 0}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Hujjat ma'lumotlari</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Nomi</dt>
                  <dd className="font-medium">{document.title || document.filename || 'Nomsiz'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Yuklangan sana</dt>
                  <dd className="font-medium">{document.created_at ? new Date(document.created_at).toLocaleString('uz') : '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">So'zlar soni</dt>
                  <dd className="font-medium">{document.word_count || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Holat</dt>
                  <dd className="font-medium text-green-600">Tekshirilgan</dd>
                </div>
              </dl>
            </div>

            {/* Matched Text Highlights */}
            {results?.matches && results.matches.length > 0 && (
              <div className="card lg:col-span-3">
                <h3 className="font-semibold text-gray-900 mb-4">Topilgan o'xshashliklar</h3>
                <div className="space-y-3">
                  {results.matches.map((match, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Manba: {match.source || 'Noma\'lum'}
                        </span>
                        <span className="text-sm font-semibold text-red-600">
                          {match.similarity || match.percentage}% o'xshashlik
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 highlight-high p-2 rounded">
                        {match.text || match.matched_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
